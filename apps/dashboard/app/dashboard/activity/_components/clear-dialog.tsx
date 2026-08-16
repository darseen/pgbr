"use client";

import clearActivity from "@/actions/activity/clear";
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
import type { ActivityItem } from "@/types";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  items: ActivityItem[];
  onCleared: () => void;
}

export default function ClearActivityDialog({ items, onCleared }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const counts = {
    backup: items.filter((item) => item.kind === "backup").length,
    restore: items.filter((item) => item.kind === "restore").length,
    migration: items.filter((item) => item.kind === "migration").length,
    event: items.filter((item) => item.kind === "event").length,
  };
  const artifacts = items.filter(
    (item) => item.kind === "backup" && item.status === "completed",
  ).length;

  const handleClear = async () => {
    try {
      setIsClearing(true);
      const { error } = await clearActivity();

      if (error) return toast.error(error.message);

      toast.success("Activity cleared");
      onCleared();
    } catch {
      toast.error("Failed to clear activity");
    } finally {
      setIsClearing(false);
      setOpen(false);
      router.refresh();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={items.length === 0}>
          <Trash2 className="mr-1.5 size-4" />
          Clear all
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear all activity</AlertDialogTitle>
          <AlertDialogDescription>
            This deletes your entire history: {counts.backup} backup,{" "}
            {counts.restore} restore and {counts.migration} migration{" "}
            {counts.backup + counts.restore + counts.migration === 1
              ? "job"
              : "jobs"}
            , plus {counts.event} logged{" "}
            {counts.event === 1 ? "action" : "actions"}. Your database
            connections and schedules are kept.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {artifacts > 0 && (
          <div className="bg-destructive/10 border-destructive/20 flex items-start gap-2 rounded-lg border p-3">
            <AlertTriangle className="text-destructive mt-0.5 size-4 shrink-0" />
            <p className="text-destructive text-xs">
              {artifacts} backup {artifacts === 1 ? "artifact" : "artifacts"}{" "}
              will also be deleted from storage. This cannot be undone.
            </p>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              e.preventDefault();
              handleClear();
            }}
            disabled={isClearing}
          >
            {isClearing ? (
              <>
                <Loader2 className="mr-1.5 size-4 animate-spin" />
                Clearing...
              </>
            ) : (
              "Clear everything"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
