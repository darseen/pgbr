import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, Bomb, HardDrive, Trash2 } from "lucide-react";
import { Metadata } from "next";
import { ReactNode } from "react";
import getStorageStatus from "@/actions/settings/storage/status";
import { PageHeader, PageShell } from "../_components/page-shell";
import ClearMigrationsDialog from "./_components/clear-migrations-dialog";
import ClearRestoresDialog from "./_components/clear-restores-dialog";
import NukeDialog from "./_components/nuke-dialog";
import StorageSection from "./_components/storage-section";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function Page() {
  const { data: storageStatus } = await getStorageStatus();

  return (
    <PageShell width="narrow">
      <PageHeader
        title="Settings"
        description="Manage application settings and data"
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HardDrive className="text-muted-foreground size-5" />
              <CardTitle>Storage</CardTitle>
            </div>
            <CardDescription>
              S3-compatible object store where backup artifacts live. Defaults
              to SeaweedFS; point it at any other S3-compatible store for
              durability and scale.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {storageStatus ? (
              <StorageSection status={storageStatus} />
            ) : (
              <p className="text-muted-foreground text-sm">
                Unable to load storage status.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="ring-destructive/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-destructive size-5" />
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </div>
            <CardDescription>
              Irreversible actions that affect your data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DangerRow
              icon={<Trash2 className="text-destructive size-5" />}
              title="Clear Migration Logs"
              description="Permanently delete all migration job history and logs. This action cannot be undone."
            >
              <ClearMigrationsDialog />
            </DangerRow>

            <DangerRow
              icon={<Trash2 className="text-destructive size-5" />}
              title="Clear Restore Logs"
              description="Permanently delete all restore job history and logs. This action cannot be undone, but your actual backup files will remain intact."
            >
              <ClearRestoresDialog />
            </DangerRow>

            <DangerRow
              icon={<Bomb className="text-destructive size-5" />}
              title="Nuke Everything"
              description="Permanently delete all database records and backup files from disk. This action cannot be undone."
            >
              <NukeDialog />
            </DangerRow>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

function DangerRow({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="border-destructive/30 bg-destructive/5 rounded-lg border p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="bg-destructive/10 flex size-10 shrink-0 items-center justify-center rounded-full">
          {icon}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1">
            <h3 className="font-semibold">{title}</h3>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
