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
import { Spinner } from "@/components/ui/spinner";
import { DEFAULT_BACKUP_FLAGS } from "@/constants";
import { Database } from "@/db/schema";
import type { BackupFlags } from "@/types";
import { Download, Settings2 } from "lucide-react";
import { useState } from "react";

interface BackupFormProps {
  database: Database;
}

export default function BackupForm({ database }: BackupFormProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [flags, setFlags] = useState<BackupFlags>(DEFAULT_BACKUP_FLAGS);
  const [error, setError] = useState<string | null>(null);

  function updateFlag<K extends keyof BackupFlags>(
    key: K,
    value: BackupFlags[K],
  ) {
    setFlags((f) => ({ ...f, [key]: value }));
  }

  async function handleBackup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          databaseId: database.id,
          flags,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to start backup");
        return;
      }

      setOpen(false);
      setFlags(DEFAULT_BACKUP_FLAGS);
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
          <Download className="size-4" />
          Backup
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Backup</DialogTitle>
          <DialogDescription>
            Create a backup of {database.name} with custom pg_dump flags.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleBackup} className="space-y-4">
          {error && (
            <div className="text-destructive bg-destructive/10 rounded-md px-3 py-2 text-sm">
              {error}
            </div>
          )}

          {/* Basic Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="format">Output Format</Label>
              <Select
                value={flags.format}
                onValueChange={(v) =>
                  updateFlag("format", v as BackupFlags["format"])
                }
                disabled={isLoading}
              >
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom (-Fc)</SelectItem>
                  <SelectItem value="plain">Plain SQL (-Fp)</SelectItem>
                  <SelectItem value="directory">Directory (-Fd)</SelectItem>
                  <SelectItem value="tar">Tar (-Ft)</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                disabled={isLoading || flags.format !== "directory"}
              />
              {flags.format !== "directory" && (
                <p className="text-muted-foreground text-xs">
                  Only available for directory format
                </p>
              )}
            </div>
          </div>

          {/* Quick Options */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="compress"
                checked={flags.compress}
                onCheckedChange={(c) => updateFlag("compress", !!c)}
                disabled={isLoading || flags.format !== "custom"}
              />
              <Label htmlFor="compress" className="text-sm font-normal">
                Compress output
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="verbose"
                checked={flags.verbose}
                onCheckedChange={(c) => updateFlag("verbose", !!c)}
                disabled={isLoading}
              />
              <Label htmlFor="verbose" className="text-sm font-normal">
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
                    id="dataOnly"
                    checked={flags.dataOnly}
                    onCheckedChange={(c) => {
                      updateFlag("dataOnly", !!c);
                      if (c) updateFlag("schemaOnly", false);
                    }}
                    disabled={isLoading || flags.schemaOnly}
                  />
                  <Label htmlFor="dataOnly" className="text-sm font-normal">
                    Data only (--data-only)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="schemaOnly"
                    checked={flags.schemaOnly}
                    onCheckedChange={(c) => {
                      updateFlag("schemaOnly", !!c);
                      if (c) updateFlag("dataOnly", false);
                    }}
                    disabled={isLoading || flags.dataOnly}
                  />
                  <Label htmlFor="schemaOnly" className="text-sm font-normal">
                    Schema only (--schema-only)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="clean"
                    checked={flags.clean}
                    onCheckedChange={(c) => updateFlag("clean", !!c)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="clean" className="text-sm font-normal">
                    Include DROP (--clean)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="noOwner"
                    checked={flags.noOwner}
                    onCheckedChange={(c) => updateFlag("noOwner", !!c)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="noOwner" className="text-sm font-normal">
                    No owner (--no-owner)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="noPrivileges"
                    checked={flags.noPrivileges}
                    onCheckedChange={(c) => updateFlag("noPrivileges", !!c)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="noPrivileges" className="text-sm font-normal">
                    No privileges (--no-acl)
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
              {isLoading ? <Spinner /> : "Start Backup"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
