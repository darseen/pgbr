"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { BackupSchema } from "@repo/types";
import { Settings2 } from "lucide-react";
import { useState } from "react";
import { Controller, type FieldValues, type UseFormReturn } from "react-hook-form";

interface BackupFlagsFieldsProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  disabled: boolean;
}

// The pg_dump flags fieldset shared by the one-off backup dialog and the
// schedule form. The generic + cast lets it plug into any form whose schema
// extends the backup flags (RHF generics don't compose otherwise).
export default function BackupFlagsFields<T extends FieldValues>({
  form: genericForm,
  disabled,
}: BackupFlagsFieldsProps<T>) {
  const form = genericForm as unknown as UseFormReturn<BackupSchema>;
  const [showAdvanced, setShowAdvanced] = useState(false);

  const format = form.watch("format");
  const isDirectory = format === "directory";
  const isTar = format === "tar";
  const isClean = form.watch("clean");

  const handleArrayInput = (val: string): string[] => {
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  return (
    <>
      {/* Basic Options */}
      <FieldGroup className="grid grid-cols-2 gap-4">
        <Controller
          name="format"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="format">Output Format</FieldLabel>
              <Select
                value={field.value}
                onValueChange={(v) => {
                  const newFormat = v as BackupSchema["format"];
                  field.onChange(newFormat);
                  if (newFormat === "tar") form.setValue("compress", false);
                  if (newFormat !== "directory") form.setValue("jobs", 1);
                }}
                disabled={disabled}
              >
                <SelectTrigger
                  id="format"
                  className="w-full"
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom (-Fc)</SelectItem>
                  <SelectItem value="plain">Plain SQL (-Fp)</SelectItem>
                  <SelectItem value="directory">Directory (-Fd)</SelectItem>
                  <SelectItem value="tar">Tar (-Ft)</SelectItem>
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                disabled={disabled || !isDirectory}
                aria-invalid={fieldState.invalid}
              />
              {!isDirectory && (
                <FieldDescription className="mt-1 text-xs">
                  Only available for directory format
                </FieldDescription>
              )}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <SeparatorWithText>Options</SeparatorWithText>

      {/* Quick Options */}
      <FieldGroup className="grid grid-cols-2 gap-3">
        <Controller
          name="compress"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="compress"
                  checked={field.value as boolean}
                  onCheckedChange={field.onChange}
                  disabled={disabled || isTar}
                  aria-invalid={fieldState.invalid}
                />
                <FieldLabel
                  htmlFor="compress"
                  className="m-0 cursor-pointer text-sm font-normal"
                >
                  Compress output (-Z)
                </FieldLabel>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="verbose"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="verbose"
                  checked={field.value as boolean}
                  onCheckedChange={field.onChange}
                  disabled={disabled}
                  aria-invalid={fieldState.invalid}
                />
                <FieldLabel
                  htmlFor="verbose"
                  className="m-0 cursor-pointer text-sm font-normal"
                >
                  Verbose output
                </FieldLabel>
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                          if (c) form.setValue("schemaOnly", false);
                        }}
                        disabled={disabled}
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
                          if (c) form.setValue("dataOnly", false);
                        }}
                        disabled={disabled}
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
                        disabled={disabled}
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
                        disabled={disabled || !isClean}
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

              {[
                { name: "create", label: "Create DB (-C)" },
                { name: "noOwner", label: "No owner (-O)" },
                { name: "noPrivileges", label: "No privileges (-x)" },
                { name: "inserts", label: "Use inserts (--inserts)" },
              ].map((item) => (
                <Controller
                  key={item.name}
                  name={item.name as keyof BackupSchema}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={item.name}
                          checked={field.value as boolean}
                          onCheckedChange={field.onChange}
                          disabled={disabled}
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
                name="excludeSchemas"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="excludeSchemas" className="text-sm">
                      Exclude Schemas (-N)
                    </FieldLabel>
                    <Input
                      id="excludeSchemas"
                      placeholder="e.g. audit, public_temp"
                      value={field.value?.join(", ") || ""}
                      onChange={(e) =>
                        field.onChange(handleArrayInput(e.target.value))
                      }
                      disabled={disabled}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="includeSchemas"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="includeSchemas" className="text-sm">
                      Include Schemas (-n)
                    </FieldLabel>
                    <Input
                      id="includeSchemas"
                      placeholder="e.g. public, app_data"
                      value={field.value?.join(", ") || ""}
                      onChange={(e) =>
                        field.onChange(handleArrayInput(e.target.value))
                      }
                      disabled={disabled}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="excludeTables"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="excludeTables" className="text-sm">
                      Exclude Tables (-T)
                    </FieldLabel>
                    <Input
                      id="excludeTables"
                      placeholder="e.g. logs, migrations"
                      value={field.value?.join(", ") || ""}
                      onChange={(e) =>
                        field.onChange(handleArrayInput(e.target.value))
                      }
                      disabled={disabled}
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
                  <Field data-invalid={fieldState.invalid}>
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
                      disabled={disabled}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="excludeTableData"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="sm:col-span-2"
                  >
                    <FieldLabel htmlFor="excludeTableData" className="text-sm">
                      Exclude Table Data (--exclude-table-data)
                    </FieldLabel>
                    <Input
                      id="excludeTableData"
                      placeholder="e.g. logs, events (exports schema, skips data)"
                      value={field.value?.join(", ") || ""}
                      onChange={(e) =>
                        field.onChange(handleArrayInput(e.target.value))
                      }
                      disabled={disabled}
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
    </>
  );
}
