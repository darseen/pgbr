"use client";

import testStorageConnection from "@/actions/settings/storage/test";
import updateStorageSettings from "@/actions/settings/storage/update";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  storageSettingsSchema,
  StorageSettingsSchema,
} from "@/lib/zod/storage";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

interface StorageSettingsFormProps {
  initial: {
    configured: boolean;
    endpoint: string;
    region: string;
    bucket: string;
    accessKeyId: string;
    forcePathStyle: boolean;
  };
}

export default function StorageSettingsForm({
  initial,
}: StorageSettingsFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const form = useForm<StorageSettingsSchema>({
    resolver: zodResolver(storageSettingsSchema),
    defaultValues: {
      endpoint: initial.endpoint,
      region: initial.region,
      bucket: initial.bucket,
      accessKeyId: initial.accessKeyId,
      secretAccessKey: "",
      forcePathStyle: initial.forcePathStyle,
    },
  });

  async function onSave(data: StorageSettingsSchema) {
    setIsSaving(true);
    try {
      const { error } = await updateStorageSettings(data);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Storage settings saved");
      form.reset({ ...data, secretAccessKey: "" });
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  }

  async function onTest() {
    setIsTesting(true);
    try {
      const { data, error } = await testStorageConnection(form.getValues());
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(data?.message ?? "Connection successful");
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsTesting(false);
    }
  }

  const textFields: {
    name: keyof StorageSettingsSchema;
    label: string;
    placeholder: string;
    type?: string;
  }[] = [
    {
      name: "endpoint",
      label: "Endpoint",
      placeholder: "http://seaweedfs:8333",
    },
    { name: "region", label: "Region", placeholder: "us-east-1" },
    { name: "bucket", label: "Bucket", placeholder: "pgbr" },
    { name: "accessKeyId", label: "Access Key ID", placeholder: "access key" },
    {
      name: "secretAccessKey",
      label: "Secret Access Key",
      placeholder: initial.configured
        ? "Leave blank to keep current"
        : "secret access key",
      type: "password",
    },
  ];

  return (
    <form onSubmit={form.handleSubmit(onSave)} className="space-y-5">
      <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {textFields.map((f) => (
          <Controller
            key={f.name}
            name={f.name}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                className={f.name === "endpoint" ? "sm:col-span-2" : undefined}
              >
                <FieldLabel htmlFor={f.name}>{f.label}</FieldLabel>
                <Input
                  id={f.name}
                  type={f.type ?? "text"}
                  placeholder={f.placeholder}
                  value={(field.value as string) ?? ""}
                  onChange={field.onChange}
                  disabled={isSaving || isTesting}
                  aria-invalid={fieldState.invalid}
                  autoComplete="off"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        ))}
      </FieldGroup>

      <Controller
        name="forcePathStyle"
        control={form.control}
        render={({ field }) => (
          <Field orientation="horizontal">
            <Switch
              id="forcePathStyle"
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={isSaving || isTesting}
            />
            <FieldLabel htmlFor="forcePathStyle" className="m-0 font-normal">
              Force path-style addressing
            </FieldLabel>
          </Field>
        )}
      />
      <FieldDescription>
        Path-style is required for most self-hosted S3 servers. Disable it for
        AWS S3 and providers that use virtual-hosted buckets.
      </FieldDescription>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onTest}
          disabled={isSaving || isTesting}
          className="min-w-40"
        >
          {isTesting ? <Spinner className="size-4" /> : "Test Connection"}
        </Button>
        <Button
          type="submit"
          disabled={isSaving || isTesting}
          className="min-w-28"
        >
          {isSaving ? <Spinner className="size-4" /> : "Save"}
        </Button>
      </div>
    </form>
  );
}
