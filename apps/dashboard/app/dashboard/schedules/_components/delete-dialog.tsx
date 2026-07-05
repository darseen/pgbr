"use client";

import deleteSchedule from "@/actions/schedule/delete";
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
import { BackupSchedule } from "@repo/db/schema";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useState } from "react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  schedule: BackupSchedule | null;
  onDeleted: () => void;
}

export default function DeleteScheduleDialog({
  open,
  setOpen,
  schedule,
  onDeleted,
}: Props) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!schedule) return;
    try {
      setIsDeleting(true);
      const { error } = await deleteSchedule(schedule.id);

      if (error) return toast.error(error.message);

      toast.success("Schedule deleted");
      onDeleted();
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to delete the schedule");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{schedule?.name}&quot;? Future
            automatic backups will stop. Backups already created by this
            schedule are kept.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting || !schedule}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-1.5 size-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Schedule"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
