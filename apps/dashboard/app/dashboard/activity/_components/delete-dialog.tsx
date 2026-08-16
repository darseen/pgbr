"use client";

import deleteActivity from "@/actions/activity/delete";
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
import type { ActivityItem } from "@/types";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  items: ActivityItem[];
  open: boolean;
  setOpen: (open: boolean) => void;
  onDeleted: () => void;
}

export default function DeleteActivityDialog({
  items,
  open,
  setOpen,
  onDeleted,
}: Props) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const artifacts = items.filter(
    (item) => item.kind === "backup" && item.status === "completed",
  ).length;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const { error } = await deleteActivity(
        items.map((item) => ({ kind: item.kind, id: item.id })),
      );

      if (error) return toast.error(error.message);

      toast.success(
        `Deleted ${items.length} ${items.length === 1 ? "activity" : "activities"}`,
      );
      onDeleted();
    } catch {
      toast.error("Failed to delete activity");
    } finally {
      setIsDeleting(false);
      setOpen(false);
      router.refresh();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete selected activity</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes {items.length}{" "}
            {items.length === 1 ? "entry" : "entries"} from your history.
            {artifacts > 0 && (
              <>
                {" "}
                {artifacts} of {artifacts === 1 ? "them is a" : "them are"}{" "}
                completed {artifacts === 1 ? "backup" : "backups"}, so{" "}
                {artifacts === 1 ? "its artifact" : "their artifacts"} will be
                deleted from storage as well.
              </>
            )}{" "}
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting || items.length === 0}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-1.5 size-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
