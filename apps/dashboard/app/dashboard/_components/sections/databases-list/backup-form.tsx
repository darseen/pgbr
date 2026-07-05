"use client";

import runBackup from "@/actions/backup/run";
import BackupFlagsFields from "@/components/forms/backup-flags-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { DEFAULT_BACKUP_FLAGS } from "@/constants";
import { Database } from "@repo/db/schema";
import { backupSchema, BackupSchema } from "@repo/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface BackupFormProps {
  database: Database;
}

export default function BackupForm({ database }: BackupFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<BackupSchema>({
    resolver: zodResolver(backupSchema),
    defaultValues: DEFAULT_BACKUP_FLAGS,
  });

  async function onSubmit(data: BackupSchema) {
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await runBackup({
        databaseId: database.id,
        flags: data,
      });

      if (error) {
        setError(error.message);
        return;
      }

      toast.success("Backup started");
      router.refresh();
      setOpen(false);
      form.reset(DEFAULT_BACKUP_FLAGS);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Download className="mr-2 size-4" />
          Backup
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto md:min-w-lg">
        <DialogHeader className="mb-2 flex-col items-center justify-center">
          <DialogTitle>Create Backup</DialogTitle>
          <DialogDescription>
            Create a backup of {database.name} with custom pg_dump flags.
          </DialogDescription>
        </DialogHeader>

        <form
          id="backup-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5"
        >
          {error && (
            <div className="text-destructive bg-destructive/10 rounded-md px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <BackupFlagsFields form={form} disabled={isLoading} />

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="backup-form"
              disabled={isLoading}
              className="min-w-30"
            >
              {isLoading ? <Spinner className="size-4" /> : "Start Backup"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
