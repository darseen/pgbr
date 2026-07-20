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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import createDatabase from "@/actions/database/create";
import updateDatabase from "@/actions/database/update";
import { Database } from "@repo/db/schema";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, SubmitEvent, useState } from "react";
import { toast } from "sonner";

interface Props {
  database?: Database | null;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setSelectedDatabase: Dispatch<SetStateAction<Database | null>>;
}

export default function AddDatabaseDialog({
  database,
  open,
  setOpen,
  setSelectedDatabase,
}: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  // The url is never prefilled: `database.url` is masked by the time it reaches
  // the browser, so echoing it back would save the mask. Empty means "keep the
  // stored connection string", which is what the dialog tells the user.
  const [formData, setFormData] = useState<Pick<Database, "name" | "url">>({
    name: database?.name || "",
    url: "",
  });

  const isEditing = !!database;

  const toggleOpen = (open: boolean) => {
    setOpen(open);
    if (!open) setSelectedDatabase(null);
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = isEditing
        ? await updateDatabase({ id: database.id, ...formData })
        : await createDatabase(formData);

      if (error) {
        toast.error(error.message);
        return;
      }

      toggleOpen(false);
      router.refresh();
      toast.success(
        isEditing
          ? "Database updated successfully"
          : "Database added successfully",
      );

      setFormData({
        name: database?.name || "",
        url: "",
      });
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
          <DialogTitle>
            {isEditing ? "Edit Database" : "Add Database Database"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the database details. Leave database string empty to keep the existing one."
              : "Enter a name and PostgreSQL database string for your database."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="conn-name">Database Name</Label>
            <Input
              id="conn-name"
              placeholder="Production DB"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">Database String</Label>
            <Input
              id="url"
              placeholder={
                isEditing
                  ? "Leave empty to keep the current connection string"
                  : "postgresql://user:password@host:5432/database"
              }
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
              required={!isEditing}
              disabled={isLoading}
            />
            <p className="text-muted-foreground text-xs">
              Format: postgresql://user:password@host:port/database
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => toggleOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Spinner /> : isEditing ? "Update" : "Add Database"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
