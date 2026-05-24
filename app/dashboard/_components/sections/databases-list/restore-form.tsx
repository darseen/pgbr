"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SeparatorWithText from "@/components/ui/separator-with-text";
import { Spinner } from "@/components/ui/spinner";
import { DEFAULT_RESTORE_FLAGS } from "@/constants";
import { Database } from "@/db/schema";
import { BackupJob } from "@/db/schema/backup-jobs";
import type { ApiResponse, RestoreFlags } from "@/types";
import { Settings2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { SubmitEvent, useState } from "react";
import { SSE } from "sse.js";

interface RestoreFormProps {
  database: Database;
  backupJobs: BackupJob[];
}

export default function RestoreForm({
  database,
  backupJobs,
}: RestoreFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string>("");
  const [customPath, setCustomPath] = useState("");
  const [flags, setFlags] = useState<RestoreFlags>(DEFAULT_RESTORE_FLAGS);
  const [error, setError] = useState<string | null>(null);

  const completedBackups = backupJobs.filter(
    (j) => j.databaseId === database.id && j.status === "completed",
  );

  function updateFlag<K extends keyof RestoreFlags>(
    key: K,
    value: RestoreFlags[K],
  ) {
    setFlags((f) => ({ ...f, [key]: value }));
  }

  async function handleRestore(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!selectedBackup && !customPath) {
      setError("Please select a backup or enter a custom path");
      return;
    }

    setIsLoading(true);

    try {
      const event = new SSE("/api/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        payload: JSON.stringify({
          databaseId: database.id,
          backupJobId: selectedBackup || undefined,
          backupPath: customPath || undefined,
          flags,
        }),
      });

      event.addEventListener("message", (e: object) => {
        if ("data" in e && typeof e.data === "string") {
          const response = JSON.parse(e.data);
          const { error } = response;

          if (error) {
            setError(error.message);
            return;
          }

          router.refresh();

          setOpen(false);
          setSelectedBackup("");
          setCustomPath("");
          setFlags(DEFAULT_RESTORE_FLAGS);
          setError(null);
        }
      });

      event.addEventListener("error", (e: object) => {
        if ("data" in e && typeof e.data === "string") {
          const response = JSON.parse(e.data) as ApiResponse<null>;
          const { error } = response;

          if (error) {
            setError(error.message);
            return;
          }
        }
      });
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
          <Upload className="size-4" />
          Restore
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Restore Database</DialogTitle>
          <DialogDescription>
            Restore {database.name} from a backup with custom pg_restore flags.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleRestore} className="space-y-4">
          {error && (
            <div className="text-destructive bg-destructive/10 rounded-md px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="backup-select">Select Backup</Label>
            {completedBackups.length > 0 ? (
              <Select
                value={selectedBackup}
                onValueChange={(v) => {
                  setSelectedBackup(v);
                  if (v) setCustomPath("");
                }}
                disabled={isLoading || !!customPath}
              >
                <SelectTrigger id="backup-select" className="w-full">
                  <SelectValue placeholder="Choose a backup..." />
                </SelectTrigger>
                <SelectContent>
                  {completedBackups.map((backup) => (
                    <SelectItem key={backup.id} value={backup.id}>
                      {backup.backupPath.split("/").pop()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-muted-foreground text-sm">
                No completed backups available for this database.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-path">Custom Backup Path</Label>
            <Input
              id="custom-path"
              placeholder="/path/to/backup.dump"
              value={customPath}
              onChange={(e) => {
                setCustomPath(e.target.value);
                if (e.target.value) setSelectedBackup("");
              }}
              disabled={isLoading}
            />
          </div>

          <SeparatorWithText>Options</SeparatorWithText>
          <div className="space-y-2">
            <Label htmlFor="jobs">Parallel Jobs</Label>
            <Input
              id="jobs"
              type="number"
              min={1}
              max={16}
              value={flags.jobs || 1}
              onChange={(e) =>
                updateFlag("jobs", parseInt(e.target.value) || 1)
              }
              disabled={isLoading}
            />
          </div>

          {/* Quick Options */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="r-clean"
                checked={flags.clean}
                onCheckedChange={(c) => updateFlag("clean", !!c)}
                disabled={isLoading}
              />
              <Label htmlFor="r-clean" className="text-sm font-normal">
                Clean before restore
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="r-verbose"
                checked={flags.verbose}
                onCheckedChange={(c) => updateFlag("verbose", !!c)}
                disabled={isLoading}
              />
              <Label htmlFor="r-verbose" className="text-sm font-normal">
                Verbose output
              </Label>
            </div>
          </div>

          {/* Advanced Options */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start"
              >
                <Settings2 className="size-4" />
                Advanced Options
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="r-dataOnly"
                    checked={flags.dataOnly}
                    onCheckedChange={(c) => {
                      updateFlag("dataOnly", !!c);
                      if (c) updateFlag("schemaOnly", false);
                    }}
                    disabled={isLoading || flags.schemaOnly}
                  />
                  <Label htmlFor="r-dataOnly" className="text-sm font-normal">
                    Data only
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="r-schemaOnly"
                    checked={flags.schemaOnly}
                    onCheckedChange={(c) => {
                      updateFlag("schemaOnly", !!c);
                      if (c) updateFlag("dataOnly", false);
                    }}
                    disabled={isLoading || flags.dataOnly}
                  />
                  <Label htmlFor="r-schemaOnly" className="text-sm font-normal">
                    Schema only
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="r-noOwner"
                    checked={flags.noOwner}
                    onCheckedChange={(c) => updateFlag("noOwner", !!c)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="r-noOwner" className="text-sm font-normal">
                    No owner
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="r-noPrivileges"
                    checked={flags.noPrivileges}
                    onCheckedChange={(c) => updateFlag("noPrivileges", !!c)}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="r-noPrivileges"
                    className="text-sm font-normal"
                  >
                    No privileges
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="r-singleTransaction"
                    checked={flags.singleTransaction}
                    onCheckedChange={(c) =>
                      updateFlag("singleTransaction", !!c)
                    }
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="r-singleTransaction"
                    className="text-sm font-normal"
                  >
                    Single transaction
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="r-exitOnError"
                    checked={flags.exitOnError}
                    onCheckedChange={(c) => updateFlag("exitOnError", !!c)}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="r-exitOnError"
                    className="text-sm font-normal"
                  >
                    Exit on error
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="r-ifExists"
                    checked={flags.ifExists}
                    onCheckedChange={(c) => updateFlag("ifExists", !!c)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="r-ifExists" className="text-sm font-normal">
                    IF EXISTS on DROP
                  </Label>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Spinner /> : "Start Restore"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
