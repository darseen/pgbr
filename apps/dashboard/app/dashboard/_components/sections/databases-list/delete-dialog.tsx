"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

import deleteDatabase from "@/actions/database/delete";
import { Database } from "@repo/db/schema";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useState } from "react";
import { toast } from "sonner";

interface Props {
  database: Database | null;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setSelectedDatabase: Dispatch<SetStateAction<Database | null>>;
}

export default function DeleteDatabaseDialog({
  database,
  open,
  setOpen,
  setSelectedDatabase,
}: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const toggleOpen = (open: boolean) => {
    setOpen(open);
    if (!open) setSelectedDatabase(null);
  };

  const handleDelete = async () => {
    if (!database) return;
    setIsLoading(true);

    try {
      const { error } = await deleteDatabase(database.id);
      if (error) {
        toast.error(error.message);
        return;
      }

      toggleOpen(false);

      router.refresh();
      toast.success("Database deleted successfully");
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={toggleOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Database</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{database?.name}&quot;? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => toggleOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? <Spinner /> : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
