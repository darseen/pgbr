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
import { Database } from "@repo/db/schema";
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

  const handleArrayInput = (val: string): string[] => {
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-500">
      <div className="flex flex-col items-stretch gap-6 md:flex-row">
        {/* Source Database Card */}
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
          <div className="bg-background text-muted-foreground hidden rounded-full border p-3 shadow-sm md:flex">
            <ArrowRight className="size-5" />
          </div>
          <div className="bg-background text-muted-foreground rounded-full border p-2 shadow-sm md:hidden">
            <ArrowDown className="size-4" />
          </div>
        </div>

        {/* Target Database Card */}
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
        <CardContent className="space-y-4">
          {/* BACKUP OPTIONS */}
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
            <CollapsibleContent className="bg-muted/20 space-y-4 border-t p-4 pt-3">
              <Label className="text-muted-foreground block text-xs font-semibold uppercase">
                Toggles
              </Label>
              <div className="bg-background grid grid-cols-1 gap-4 rounded-md border p-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="b-dataOnly"
                    checked={backupFlags.dataOnly}
                    onCheckedChange={(c) => {
                      updateBackupFlag("dataOnly", !!c);
                      if (c) updateBackupFlag("schemaOnly", false);
                    }}
                  />
                  <Label
                    htmlFor="b-dataOnly"
                    className="cursor-pointer leading-none font-medium"
                  >
                    Data only (-a)
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="b-schemaOnly"
                    checked={backupFlags.schemaOnly}
                    onCheckedChange={(c) => {
                      updateBackupFlag("schemaOnly", !!c);
                      if (c) updateBackupFlag("dataOnly", false);
                    }}
                  />
                  <Label
                    htmlFor="b-schemaOnly"
                    className="cursor-pointer leading-none font-medium"
                  >
                    Schema only (-s)
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="b-clean"
                    checked={backupFlags.clean}
                    onCheckedChange={(c) => {
                      updateBackupFlag("clean", !!c);
                      if (!c) updateBackupFlag("ifExists", false);
                    }}
                  />
                  <Label
                    htmlFor="b-clean"
                    className="cursor-pointer leading-none font-medium"
                  >
                    Clean (-c)
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="b-ifExists"
                    checked={backupFlags.ifExists}
                    disabled={!backupFlags.clean}
                    onCheckedChange={(c) => updateBackupFlag("ifExists", !!c)}
                  />
                  <Label
                    htmlFor="b-ifExists"
                    className={`cursor-pointer leading-none font-medium ${!backupFlags.clean ? "text-muted-foreground" : ""}`}
                  >
                    IF EXISTS on DROP
                  </Label>
                </div>
                {[
                  { id: "b-create", key: "create", label: "Create DB (-C)" },
                  { id: "b-noOwner", key: "noOwner", label: "No owner (-O)" },
                  {
                    id: "b-noPrivileges",
                    key: "noPrivileges",
                    label: "No privileges (-x)",
                  },
                  {
                    id: "b-inserts",
                    key: "inserts",
                    label: "Use inserts (--inserts)",
                  },
                ].map((flag) => (
                  <div key={flag.id} className="flex items-center gap-3">
                    <Checkbox
                      id={flag.id}
                      checked={
                        backupFlags[flag.key as keyof BackupFlags] as boolean
                      }
                      onCheckedChange={(c) =>
                        updateBackupFlag(flag.key as keyof BackupFlags, !!c)
                      }
                    />
                    <Label
                      htmlFor={flag.id}
                      className="cursor-pointer leading-none font-medium"
                    >
                      {flag.label}
                    </Label>
                  </div>
                ))}
              </div>

              <Label className="text-muted-foreground mt-4 block text-xs font-semibold uppercase">
                Filters (Comma Separated)
              </Label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="b-excludeSchemas" className="text-sm">
                    Exclude Schemas (-N)
                  </Label>
                  <Input
                    id="b-excludeSchemas"
                    placeholder="e.g. audit, public_temp"
                    value={backupFlags.excludeSchemas?.join(", ") || ""}
                    onChange={(e) =>
                      updateBackupFlag(
                        "excludeSchemas",
                        handleArrayInput(e.target.value),
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="b-includeSchemas" className="text-sm">
                    Include Schemas (-n)
                  </Label>
                  <Input
                    id="b-includeSchemas"
                    placeholder="e.g. public, app_data"
                    value={backupFlags.includeSchemas?.join(", ") || ""}
                    onChange={(e) =>
                      updateBackupFlag(
                        "includeSchemas",
                        handleArrayInput(e.target.value),
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="b-excludeTables" className="text-sm">
                    Exclude Tables (-T)
                  </Label>
                  <Input
                    id="b-excludeTables"
                    placeholder="e.g. logs, migrations"
                    value={backupFlags.excludeTables?.join(", ") || ""}
                    onChange={(e) =>
                      updateBackupFlag(
                        "excludeTables",
                        handleArrayInput(e.target.value),
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="b-includeTables" className="text-sm">
                    Include Tables (-t)
                  </Label>
                  <Input
                    id="b-includeTables"
                    placeholder="e.g. users, products"
                    value={backupFlags.includeTables?.join(", ") || ""}
                    onChange={(e) =>
                      updateBackupFlag(
                        "includeTables",
                        handleArrayInput(e.target.value),
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="b-excludeTableData" className="text-sm">
                    Exclude Table Data (--exclude-table-data)
                  </Label>
                  <Input
                    id="b-excludeTableData"
                    placeholder="e.g. logs, events (exports schema, skips data)"
                    value={backupFlags.excludeTableData?.join(", ") || ""}
                    onChange={(e) =>
                      updateBackupFlag(
                        "excludeTableData",
                        handleArrayInput(e.target.value),
                      )
                    }
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* RESTORE OPTIONS */}
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
            <CollapsibleContent className="bg-muted/20 space-y-4 border-t p-4 pt-3">
              <Label className="text-muted-foreground block text-xs font-semibold uppercase">
                Toggles
              </Label>
              <div className="bg-background grid grid-cols-1 gap-4 rounded-md border p-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="r-dataOnly"
                    checked={restoreFlags.dataOnly}
                    onCheckedChange={(c) => {
                      updateRestoreFlag("dataOnly", !!c);
                      if (c) updateRestoreFlag("schemaOnly", false);
                    }}
                  />
                  <Label
                    htmlFor="r-dataOnly"
                    className="cursor-pointer leading-none font-medium"
                  >
                    Data only (-a)
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="r-schemaOnly"
                    checked={restoreFlags.schemaOnly}
                    onCheckedChange={(c) => {
                      updateRestoreFlag("schemaOnly", !!c);
                      if (c) updateRestoreFlag("dataOnly", false);
                    }}
                  />
                  <Label
                    htmlFor="r-schemaOnly"
                    className="cursor-pointer leading-none font-medium"
                  >
                    Schema only (-s)
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="r-clean"
                    checked={restoreFlags.clean}
                    onCheckedChange={(c) => {
                      updateRestoreFlag("clean", !!c);
                      if (!c) updateRestoreFlag("ifExists", false);
                    }}
                  />
                  <Label
                    htmlFor="r-clean"
                    className="cursor-pointer leading-none font-medium"
                  >
                    Clean (-c)
                  </Label>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="r-ifExists"
                    checked={restoreFlags.ifExists}
                    disabled={!restoreFlags.clean}
                    onCheckedChange={(c) => updateRestoreFlag("ifExists", !!c)}
                  />
                  <Label
                    htmlFor="r-ifExists"
                    className={`cursor-pointer leading-none font-medium ${!restoreFlags.clean ? "text-muted-foreground" : ""}`}
                  >
                    IF EXISTS on DROP
                  </Label>
                </div>
                {[
                  { id: "r-create", key: "create", label: "Create DB (-C)" },
                  { id: "r-noOwner", key: "noOwner", label: "No owner (-O)" },
                  {
                    id: "r-noPrivileges",
                    key: "noPrivileges",
                    label: "No privileges (-x)",
                  },
                  {
                    id: "r-disableTriggers",
                    key: "disableTriggers",
                    label: "Disable triggers",
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
                      className="cursor-pointer leading-none font-medium"
                    >
                      {flag.label}
                    </Label>
                  </div>
                ))}
              </div>

              <Label className="text-muted-foreground mt-4 block text-xs font-semibold uppercase">
                Filters (Comma Separated)
              </Label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="r-includeSchemas" className="text-sm">
                    Include Schemas (-n)
                  </Label>
                  <Input
                    id="r-includeSchemas"
                    placeholder="e.g. public, app_data"
                    value={restoreFlags.includeSchemas?.join(", ") || ""}
                    onChange={(e) =>
                      updateRestoreFlag(
                        "includeSchemas",
                        handleArrayInput(e.target.value),
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="r-excludeSchemas" className="text-sm">
                    Exclude Schemas (-N)
                  </Label>
                  <Input
                    id="r-excludeSchemas"
                    placeholder="e.g. audit, public_temp"
                    value={restoreFlags.excludeSchemas?.join(", ") || ""}
                    onChange={(e) =>
                      updateRestoreFlag(
                        "excludeSchemas",
                        handleArrayInput(e.target.value),
                      )
                    }
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="r-includeTables" className="text-sm">
                    Include Tables (-t)
                  </Label>
                  <Input
                    id="r-includeTables"
                    placeholder="e.g. users, products"
                    value={restoreFlags.includeTables?.join(", ") || ""}
                    onChange={(e) =>
                      updateRestoreFlag(
                        "includeTables",
                        handleArrayInput(e.target.value),
                      )
                    }
                  />
                </div>
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
