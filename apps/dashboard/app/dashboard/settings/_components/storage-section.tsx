"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StorageStatus } from "@/actions/settings/storage/status";
import { AlertTriangle, CheckCircle2, Pencil } from "lucide-react";
import { useState } from "react";
import StorageSettingsForm from "./storage-settings-form";

interface StorageSectionProps {
  status: StorageStatus;
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-mono text-sm break-all">{value}</dd>
    </div>
  );
}

export default function StorageSection({ status }: StorageSectionProps) {
  const [reconfigure, setReconfigure] = useState(false);

  const initial = {
    configured: status.source === "settings",
    endpoint: status.endpoint,
    region: status.region,
    bucket: status.bucket,
    accessKeyId: status.accessKeyId,
    forcePathStyle: status.forcePathStyle,
  };

  // Reachable and not actively editing → read-only summary.
  if (status.ok && !reconfigure) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <CheckCircle2 className="text-success size-5" />
          <span className="font-medium">
            Object storage is configured and reachable
          </span>
          <Badge variant="secondary">
            {status.source === "environment"
              ? "Environment variables"
              : "Dashboard settings"}
          </Badge>
        </div>

        <dl className="grid grid-cols-1 gap-3 rounded-md border p-4 sm:grid-cols-2">
          <Meta label="Endpoint" value={status.endpoint} />
          <Meta label="Bucket" value={status.bucket} />
          <Meta label="Region" value={status.region} />
          <Meta label="Access Key ID" value={status.accessKeyId} />
          <Meta
            label="Path-style addressing"
            value={status.forcePathStyle ? "Enabled" : "Disabled"}
          />
        </dl>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setReconfigure(true)}
        >
          <Pencil className="mr-2 size-4" />
          Reconfigure
        </Button>
      </div>
    );
  }

  // Unreachable, or the user chose to reconfigure → show the form.
  return (
    <div className="space-y-4">
      {!status.ok ? (
        <div className="border-destructive/30 bg-destructive/5 flex items-start gap-2 rounded-md border p-3 text-sm">
          <AlertTriangle className="text-destructive mt-0.5 size-4 shrink-0" />
          <div>
            <p className="text-destructive font-medium">
              Object storage is not reachable
            </p>
            <p className="text-muted-foreground">
              {status.message}. Configure a connection below.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-sm">
            Saving overrides the environment configuration and is stored
            encrypted in the database.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReconfigure(false)}
          >
            Cancel
          </Button>
        </div>
      )}

      <StorageSettingsForm initial={initial} />
    </div>
  );
}
