"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database } from "@/db/schema";
import { BackupFlags, RestoreFlags } from "@/types";
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  ArrowRightLeft,
  ChevronDown,
  DatabaseIcon,
  Settings2,
} from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";

interface Props {
  databases: Database[];
  backupFlags: BackupFlags;
  setBackupFlags: Dispatch<SetStateAction<BackupFlags>>;
  restoreFlags: RestoreFlags;
  setRestoreFlags: Dispatch<SetStateAction<RestoreFlags>>;
  sourceId: string | null;
  setSourceId: Dispatch<SetStateAction<string | null>>;
  targetId: string | null;
  setTargetId: Dispatch<SetStateAction<string | null>>;
  sourceUrl: string | null;
  setSourceUrl: Dispatch<SetStateAction<string | null>>;
  targetUrl: string | null;
  setTargetUrl: Dispatch<SetStateAction<string | null>>;
  handleStartMigration: () => void;
  canStartMigration: boolean;
}

export default function ConfigForm({
  databases,
  backupFlags,
  setBackupFlags,
  restoreFlags,
  setRestoreFlags,
  setSourceId,
  setTargetId,
  sourceId,
  targetId,
  setSourceUrl,
  setTargetUrl,
  sourceUrl,
  targetUrl,
  handleStartMigration,
  canStartMigration,
}: Props) {
  const [showBackupOptions, setShowBackupOptions] = useState(false);
  const [showRestoreOptions, setShowRestoreOptions] = useState(false);

  function updateBackupFlag<K extends keyof BackupFlags>(
    key: K,
    value: BackupFlags[K],
  ) {
    setBackupFlags((f) => ({ ...f, [key]: value }));
  }

  function updateRestoreFlag<K extends keyof RestoreFlags>(
    key: K,
    value: RestoreFlags[K],
  ) {
    setRestoreFlags((f) => ({ ...f, [key]: value }));
  }

  function validateUrl(url: string): boolean {
    if (!url) return false;
    return url.startsWith("postgres://") || url.startsWith("postgresql://");
  }

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
      <div className="flex flex-col items-stretch gap-6 md:flex-row">
        <Card className="border-muted flex-1 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-500/10 p-2 text-orange-600">
                <DatabaseIcon className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Source Database</CardTitle>
                <CardDescription className="mt-1">
                  Origin database to migrate from
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Label
                htmlFor="source-select"
                className="text-muted-foreground text-xs font-semibold uppercase"
              >
                Select Source
              </Label>
              <Select value={sourceId ?? ""} onValueChange={setSourceId}>
                <SelectTrigger
                  id="source-select"
                  className="w-full font-medium"
                >
                  <SelectValue placeholder="Choose a database..." />
                </SelectTrigger>
                <SelectContent>
                  {databases.map((db) => (
                    <SelectItem key={db.id} value={db.id}>
                      {db.name}
                    </SelectItem>
                  ))}
                  {databases.length > 0 && <SelectSeparator />}
                  <SelectItem
                    value="custom"
                    className="text-primary font-medium"
                  >
                    + Use a custom connection string
                  </SelectItem>
                </SelectContent>
              </Select>

              {sourceId === "custom" && (
                <div className="animate-in fade-in slide-in-from-top-2 pt-2 duration-300">
                  <Label
                    htmlFor="source-url"
                    className="text-muted-foreground mb-2 block text-xs font-semibold uppercase"
                  >
                    Connection URL
                  </Label>
                  <Input
                    id="source-url"
                    type="password"
                    placeholder="postgres://user:pass@host:5432/dbname"
                    value={sourceUrl ?? ""}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    className="font-mono text-sm"
                  />
                  {sourceUrl && !validateUrl(sourceUrl) && (
                    <p className="text-destructive mt-1.5 flex items-center gap-1 text-xs font-medium">
                      <AlertCircle className="size-3" /> URL must start with
                      postgres://
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center py-2 md:py-0">
          <div className="bg-background text-muted-foreground z-10 hidden rounded-full border p-3 shadow-sm md:flex">
            <ArrowRight className="size-5" />
          </div>
          <div className="bg-background text-muted-foreground rounded-full border p-2 shadow-sm md:hidden">
            <ArrowDown className="size-4" />
          </div>
        </div>

        <Card className="border-muted flex-1 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600">
                <DatabaseIcon className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Target Database</CardTitle>
                <CardDescription className="mt-1">
                  Destination database to migrate to
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Label
                htmlFor="target-select"
                className="text-muted-foreground text-xs font-semibold uppercase"
              >
                Select Target
              </Label>
              <Select value={targetId ?? ""} onValueChange={setTargetId}>
                <SelectTrigger
                  id="target-select"
                  className="w-full font-medium"
                >
                  <SelectValue placeholder="Choose a database" />
                </SelectTrigger>
                <SelectContent>
                  {databases.map((db) => (
                    <SelectItem key={db.id} value={db.id}>
                      {db.name}
                    </SelectItem>
                  ))}
                  {databases.length > 0 && <SelectSeparator />}
                  <SelectItem
                    value="custom"
                    className="text-primary font-medium"
                  >
                    + Use a custom connection string
                  </SelectItem>
                </SelectContent>
              </Select>

              {targetId === "custom" && (
                <div className="animate-in fade-in slide-in-from-top-2 pt-2 duration-300">
                  <Label
                    htmlFor="target-url"
                    className="text-muted-foreground mb-2 block text-xs font-semibold uppercase"
                  >
                    Connection URL
                  </Label>
                  <Input
                    id="target-url"
                    type="password"
                    placeholder="postgres://user:pass@host:5432/dbname"
                    value={targetUrl ?? ""}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="font-mono text-sm"
                  />
                  {targetUrl && !validateUrl(targetUrl) && (
                    <p className="text-destructive mt-1.5 flex items-center gap-1 text-xs font-medium">
                      <AlertCircle className="size-3" /> URL must start with
                      postgres://
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Migration Options */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings2 className="text-muted-foreground size-5" />
            Advanced Migration Options
          </CardTitle>
          <CardDescription>
            Tune your pg_dump and pg_restore configurations (Optional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Backup Options */}
          <Collapsible
            open={showBackupOptions}
            onOpenChange={setShowBackupOptions}
            className="bg-card overflow-hidden rounded-lg border transition-all"
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="hover:bg-muted/50 h-auto w-full justify-between rounded-none p-4"
              >
                <span className="font-medium">
                  Backup Configurations (pg_dump)
                </span>
                <ChevronDown
                  className={`text-muted-foreground size-4 transition-transform duration-200 ${showBackupOptions ? "rotate-180" : ""}`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="bg-muted/20 border-t p-4 pt-2">
              <Label className="text-muted-foreground mb-3 block text-xs font-semibold uppercase">
                Flags
              </Label>
              <div className="bg-background grid grid-cols-1 gap-4 rounded-md border p-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="b-dataOnly"
                    checked={backupFlags.dataOnly}
                    onCheckedChange={(c) => {
                      updateBackupFlag("dataOnly", !!c);
                      if (c) updateBackupFlag("schemaOnly", false);
                    }}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor="b-dataOnly"
                      className="cursor-pointer font-medium"
                    >
                      Data only (-a)
                    </Label>
                    <p className="text-muted-foreground text-xs">
                      Dump only the data, not the schema
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="b-schemaOnly"
                    checked={backupFlags.schemaOnly}
                    onCheckedChange={(c) => {
                      updateBackupFlag("schemaOnly", !!c);
                      if (c) updateBackupFlag("dataOnly", false);
                    }}
                    className="mt-0.5"
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor="b-schemaOnly"
                      className="cursor-pointer font-medium"
                    >
                      Schema only (-s)
                    </Label>
                    <p className="text-muted-foreground text-xs">
                      Dump only the object definitions
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="b-noOwner"
                    checked={backupFlags.noOwner}
                    onCheckedChange={(c) => updateBackupFlag("noOwner", !!c)}
                  />
                  <Label
                    htmlFor="b-noOwner"
                    className="cursor-pointer font-medium"
                  >
                    No owner (-O)
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="b-noPrivileges"
                    checked={backupFlags.noPrivileges}
                    onCheckedChange={(c) =>
                      updateBackupFlag("noPrivileges", !!c)
                    }
                  />
                  <Label
                    htmlFor="b-noPrivileges"
                    className="cursor-pointer font-medium"
                  >
                    No privileges (-x)
                  </Label>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible
            open={showRestoreOptions}
            onOpenChange={setShowRestoreOptions}
            className="bg-card overflow-hidden rounded-lg border transition-all"
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="hover:bg-muted/50 h-auto w-full justify-between rounded-none p-4"
              >
                <span className="font-medium">
                  Restore Configurations (pg_restore)
                </span>
                <ChevronDown
                  className={`text-muted-foreground size-4 transition-transform duration-200 ${showRestoreOptions ? "rotate-180" : ""}`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="bg-muted/20 border-t p-4 pt-2">
              <Label className="text-muted-foreground mb-3 block text-xs font-semibold uppercase">
                Flags
              </Label>
              <div className="bg-background grid grid-cols-1 gap-4 rounded-md border p-4 sm:grid-cols-2">
                {[
                  {
                    id: "r-clean",
                    key: "clean",
                    label: "Clean before restore (-c)",
                  },
                  {
                    id: "r-noOwner",
                    key: "noOwner",
                    label: "No owner (-O)",
                  },
                  {
                    id: "r-noPrivileges",
                    key: "noPrivileges",
                    label: "No privileges (-x)",
                  },
                  {
                    id: "r-singleTransaction",
                    key: "singleTransaction",
                    label: "Single transaction (-1)",
                  },
                  {
                    id: "r-exitOnError",
                    key: "exitOnError",
                    label: "Exit on error (-e)",
                  },
                  {
                    id: "r-ifExists",
                    key: "ifExists",
                    label: "IF EXISTS on DROP (--if-exists)",
                  },
                ].map((flag) => (
                  <div key={flag.id} className="flex items-center gap-3">
                    <Checkbox
                      id={flag.id}
                      checked={
                        restoreFlags[flag.key as keyof RestoreFlags] as boolean
                      }
                      onCheckedChange={(c) =>
                        updateRestoreFlag(flag.key as keyof RestoreFlags, !!c)
                      }
                    />
                    <Label
                      htmlFor={flag.id}
                      className="cursor-pointer font-medium"
                    >
                      {flag.label}
                    </Label>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
        <CardFooter className="bg-muted/20 flex items-center justify-between rounded-b-lg border-t px-6 py-4">
          <p className="text-muted-foreground text-sm">
            Review your settings before proceeding.
          </p>
          <Button
            size="lg"
            onClick={handleStartMigration}
            disabled={!canStartMigration}
            className="gap-2 shadow-md transition-transform active:scale-95"
          >
            <ArrowRightLeft className="size-4" />
            Start Migration
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
}
