"use client";

import nuke from "@/actions/nuke";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Bomb, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function NukeDialog() {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [isNuking, setIsNuking] = useState(false);

  const confirmPhrase = "DELETE EVERYTHING";
  const isConfirmed = confirmText === confirmPhrase;

  async function handleNuke() {
    if (!isConfirmed) return;

    try {
      setIsNuking(true);
      const { error } = await nuke();

      if (error) return toast.error(error.message);

      toast.success("Nuke complete");
      router.refresh();
    } catch {
    } finally {
      setIsNuking(false);
      setConfirmText("");
    }
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <Trash2 className="size-4" />
          Nuke All Data
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="bg-destructive/10 mx-auto mb-4 w-fit rounded-full p-3">
            <Bomb className="text-destructive size-8" />
          </div>
          <AlertDialogTitle className="mx-auto text-center">
            Are you absolutely sure?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            This will permanently destroy all selected data. There is no way to
            recover this data once deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-sm">
              Type{" "}
              <span className="text-destructive font-mono font-bold">
                {confirmPhrase}
              </span>{" "}
              to confirm:
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type here to confirm..."
              className="font-mono"
              autoComplete="off"
            />
          </div>

          <div className="bg-destructive/10 border-destructive/20 flex items-start gap-2 rounded-lg border p-3">
            <AlertTriangle className="text-destructive mt-0.5 size-4 shrink-0" />
            <p className="text-destructive text-xs">
              Warning: This action is permanent and cannot be undone. Make sure
              you have exported any data you wish to keep.
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmText("")}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleNuke}
            disabled={!isConfirmed || isNuking}
            variant="destructive"
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
          >
            {isNuking ? (
              <>Nuking...</>
            ) : (
              <>
                <Bomb className="mr-2 size-4" />
                Nuke Selected Data
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
