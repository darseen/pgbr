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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
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
import { BackupJob, Database } from "@repo/db/schema";
import { restoreSchema, RestoreSchema } from "@repo/types";
import type { ApiResponse } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Settings2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
  const [error, setError] = useState<string | null>(null);

  const completedBackups = backupJobs.filter(
    (j) => j.databaseId === database.id && j.status === "completed",
  );

  const form = useForm<RestoreSchema>({
    resolver: zodResolver(restoreSchema),
    defaultValues: DEFAULT_RESTORE_FLAGS,
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const isClean = form.watch("clean");

  const handleArrayInput = (val: string): string[] => {
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  async function onSubmit(data: RestoreSchema) {
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
          flags: data,
        }),
      });

      event.addEventListener("message", (e: object) => {
        if ("data" in e && typeof e.data === "string") {
          const response = JSON.parse(e.data);

          if (response.error) {
            setError(response.error.message);
            setIsLoading(false);
            return;
          }

          router.refresh();
          setOpen(false);
          setSelectedBackup("");
          setCustomPath("");
          form.reset(DEFAULT_RESTORE_FLAGS);
          setError(null);
          setIsLoading(false);
        }
      });

      event.addEventListener("error", (e: object) => {
        if ("data" in e && typeof e.data === "string") {
          const response = JSON.parse(e.data) as ApiResponse<null>;

          if (response.error) {
            setError(response.error.message);
            setIsLoading(false);
            return;
          }
        }
      });
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Upload className="mr-2 size-4" />
          Restore
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto md:min-w-lg">
        <DialogHeader className="mb-2 flex-col items-center justify-center">
          <DialogTitle>Restore Database</DialogTitle>
          <DialogDescription>
            Restore {database.name} from a backup with custom pg_restore flags.
          </DialogDescription>
        </DialogHeader>
        <form
          id="restore-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5"
        >
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <FieldGroup className="space-y-2">
              <FieldLabel htmlFor="backup-select">Select Backup</FieldLabel>
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
                <FieldDescription className="text-sm">
                  No completed backups available for this database.
                </FieldDescription>
              )}
            </FieldGroup>

            <FieldGroup className="space-y-2">
              <FieldLabel htmlFor="custom-path">
                Or Custom Backup Path
              </FieldLabel>
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
            </FieldGroup>
          </div>

          <SeparatorWithText>Options</SeparatorWithText>

          <FieldGroup className="grid grid-cols-2 gap-4">
            <Controller
              name="format"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="format">Format</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={(v) =>
                      field.onChange(v as RestoreSchema["format"])
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger
                      id="format"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom (c)</SelectItem>
                      <SelectItem value="directory">Directory</SelectItem>
                      <SelectItem value="tar">Tar</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="jobs"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="jobs">Parallel Jobs (-j)</FieldLabel>
                  <Input
                    type="number"
                    id="jobs"
                    min={1}
                    max={16}
                    value={field.value || 1}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      field.onChange(val);
                      if (val > 1) form.setValue("singleTransaction", false);
                    }}
                    disabled={isLoading}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          {/* Advanced Options */}
          <Collapsible
            open={showAdvanced}
            onOpenChange={setShowAdvanced}
            className="overflow-hidden rounded-md border"
          >
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="hover:bg-muted/50 h-auto w-full justify-between rounded-none p-4"
              >
                <div className="flex items-center">
                  <Settings2 className="text-muted-foreground mr-2 size-4" />
                  <span className="font-medium">Advanced Configurations</span>
                </div>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="bg-muted/20 space-y-5 border-t p-4">
              <div className="space-y-3">
                <Label className="text-muted-foreground text-xs font-semibold uppercase">
                  Toggles
                </Label>
                <FieldGroup className="bg-background grid grid-cols-1 gap-4 rounded-md border p-3 sm:grid-cols-2">
                  <Controller
                    name="dataOnly"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="dataOnly"
                            checked={field.value as boolean}
                            onCheckedChange={(c) => {
                              field.onChange(c);
                              if (c)
                                form.setValue("schemaOnly", false, {
                                  shouldValidate: true,
                                });
                            }}
                            disabled={isLoading}
                            aria-invalid={fieldState.invalid}
                          />
                          <FieldLabel
                            htmlFor="dataOnly"
                            className="m-0 cursor-pointer text-sm font-normal"
                          >
                            Data only (-a)
                          </FieldLabel>
                        </div>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="schemaOnly"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="schemaOnly"
                            checked={field.value as boolean}
                            onCheckedChange={(c) => {
                              field.onChange(c);
                              if (c)
                                form.setValue("dataOnly", false, {
                                  shouldValidate: true,
                                });
                            }}
                            disabled={isLoading}
                            aria-invalid={fieldState.invalid}
                          />
                          <FieldLabel
                            htmlFor="schemaOnly"
                            className="m-0 cursor-pointer text-sm font-normal"
                          >
                            Schema only (-s)
                          </FieldLabel>
                        </div>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="clean"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="clean"
                            checked={field.value as boolean}
                            onCheckedChange={(c) => {
                              field.onChange(c);
                              if (!c) form.setValue("ifExists", false);
                            }}
                            disabled={isLoading}
                            aria-invalid={fieldState.invalid}
                          />
                          <FieldLabel
                            htmlFor="clean"
                            className="m-0 cursor-pointer text-sm font-normal"
                          >
                            Clean (-c)
                          </FieldLabel>
                        </div>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="ifExists"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="ifExists"
                            checked={field.value as boolean}
                            onCheckedChange={field.onChange}
                            disabled={isLoading || !isClean}
                            aria-invalid={fieldState.invalid}
                          />
                          <FieldLabel
                            htmlFor="ifExists"
                            className={`m-0 cursor-pointer text-sm font-normal ${!isClean ? "text-muted-foreground" : ""}`}
                          >
                            If exists (--if-exists)
                          </FieldLabel>
                        </div>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="singleTransaction"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="singleTransaction"
                            checked={field.value as boolean}
                            onCheckedChange={(c) => {
                              field.onChange(c);
                              if (c) form.setValue("jobs", 1);
                            }}
                            disabled={isLoading}
                            aria-invalid={fieldState.invalid}
                          />
                          <FieldLabel
                            htmlFor="singleTransaction"
                            className="m-0 cursor-pointer text-sm font-normal"
                          >
                            Single transaction (-1)
                          </FieldLabel>
                        </div>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  {[
                    { name: "create", label: "Create DB (-C)" },
                    { name: "noOwner", label: "No owner (-O)" },
                    { name: "noPrivileges", label: "No privileges (-x)" },
                    { name: "disableTriggers", label: "Disable triggers" },
                    { name: "exitOnError", label: "Exit on error (-e)" },
                    { name: "verbose", label: "Verbose output" },
                  ].map((item) => (
                    <Controller
                      key={item.name}
                      name={item.name as keyof RestoreSchema}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={item.name}
                              checked={field.value as boolean}
                              onCheckedChange={field.onChange}
                              disabled={isLoading}
                              aria-invalid={fieldState.invalid}
                            />
                            <FieldLabel
                              htmlFor={item.name}
                              className="m-0 cursor-pointer text-sm font-normal"
                            >
                              {item.label}
                            </FieldLabel>
                          </div>
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  ))}
                </FieldGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-muted-foreground text-xs font-semibold uppercase">
                  Filters (Comma Separated)
                </Label>
                <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Controller
                    name="includeSchemas"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel
                          htmlFor="includeSchemas"
                          className="text-sm"
                        >
                          Include Schemas (-n)
                        </FieldLabel>
                        <Input
                          id="includeSchemas"
                          placeholder="e.g. public, app_data"
                          value={field.value?.join(", ") || ""}
                          onChange={(e) =>
                            field.onChange(handleArrayInput(e.target.value))
                          }
                          disabled={isLoading}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="excludeSchemas"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel
                          htmlFor="excludeSchemas"
                          className="text-sm"
                        >
                          Exclude Schemas (-N)
                        </FieldLabel>
                        <Input
                          id="excludeSchemas"
                          placeholder="e.g. audit, public_temp"
                          value={field.value?.join(", ") || ""}
                          onChange={(e) =>
                            field.onChange(handleArrayInput(e.target.value))
                          }
                          disabled={isLoading}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="includeTables"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field
                        data-invalid={fieldState.invalid}
                        className="sm:col-span-2"
                      >
                        <FieldLabel htmlFor="includeTables" className="text-sm">
                          Include Tables (-t)
                        </FieldLabel>
                        <Input
                          id="includeTables"
                          placeholder="e.g. users, products"
                          value={field.value?.join(", ") || ""}
                          onChange={(e) =>
                            field.onChange(handleArrayInput(e.target.value))
                          }
                          disabled={isLoading}
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </FieldGroup>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="restore-form"
              disabled={isLoading}
              className="min-w-30"
            >
              {isLoading ? <Spinner className="size-4" /> : "Start Restore"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
