"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

interface Props {
  selectedBackups: Set<string>;
  setSelectedBackups: (v: Set<string>) => void;
  isDeleting: boolean;
  setIsDeleting: (v: boolean) => void;
  trigger?: ReactNode;
}

export default function DeleteBackupDialog({
  selectedBackups,
  setSelectedBackups,
  isDeleting,
  setIsDeleting,
  trigger,
}: Props) {
  const router = useRouter();

  const handleDelete = async (ids: string[]) => {
    try {
      setIsDeleting(true);
      await fetch("/api/backup", {
        method: "DELETE",
        body: JSON.stringify({ ids }),
      });
    } catch {
    } finally {
      setSelectedBackups(new Set());
      setIsDeleting(false);
      router.refresh();
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-1.5 size-4" />
            Delete ({selectedBackups.size})
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Selected Backups</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {selectedBackups.size} backup(s)?
            This will permanently remove the backup files from disk. This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => handleDelete(Array.from(selectedBackups))}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-1.5 size-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Backups"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
