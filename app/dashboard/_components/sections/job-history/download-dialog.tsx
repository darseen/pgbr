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
import { BackupJob } from "@/db/schema";
import { Dispatch, SetStateAction } from "react";

interface Props {
  job: BackupJob | null;
  isOpen: boolean;
  setSelectedJob: Dispatch<SetStateAction<BackupJob | null>>;
}

export default function DownloadDialog({ job, isOpen, setSelectedJob }: Props) {
  const handleDownload = () => {
    if (!job) return;

    const link = document.createElement("a");
    link.href = `/api/backup/download/${job.id}`;
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSelectedJob(null);
  };

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => !open && setSelectedJob(null)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Download Backup</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to download the backup for{" "}
            <strong>{job?.databaseName}</strong>? Depending on the database
            size, this might take a few moments.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setSelectedJob(null)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDownload}
            disabled={job?.status !== "completed"}
          >
            Download File
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
