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
} from "@/components/ui/alert-dialog";
import deleteBackupJobs from "@/actions/backup/delete";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

interface Props {
  selectedBackups: Set<string>;
  setSelectedBackups: (value: Set<string>) => void;
  isDeleting: boolean;
  setIsDeleting: Dispatch<SetStateAction<boolean>>;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export default function DeleteBackupDialog({
  selectedBackups,
  setSelectedBackups,
  isDeleting,
  setIsDeleting,
  open,
  setOpen,
}: Props) {
  const router = useRouter();

  const handleDelete = async (ids: string[]) => {
    try {
      setIsDeleting(true);
      const { error } = await deleteBackupJobs(ids);

      if (error) return toast.error(error.message);

      toast.success("Backups deleted successfully");
    } catch {
    } finally {
      setSelectedBackups(new Set());
      setIsDeleting(false);
      setOpen?.(false);
      router.refresh();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
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
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(e) => {
              e.preventDefault();
              handleDelete(Array.from(selectedBackups));
            }}
            disabled={isDeleting || selectedBackups.size === 0}
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
