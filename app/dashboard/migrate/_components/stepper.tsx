"use client";

import { DEFAULT_BACKUP_FLAGS, DEFAULT_RESTORE_FLAGS } from "@/constants";
import { Database, MigrationJobStatus } from "@/db/schema";
import {
  ApiResponse,
  BackupFlags,
  MigrationState,
  RestoreFlags,
} from "@/types";
import { useState } from "react";
import { toast } from "sonner";
import { SSE } from "sse.js";
import ConfigForm from "./config-form";
import MigrationComplete from "./migration-complete";
import MigrationProgress from "./migration-progress";
import StepsHeader from "./steps-header";

interface Props {
  databases: Database[];
}

export default function Stepper({ databases }: Props) {
  const [migration, setMigration] = useState<MigrationState>({
    currentStep: "configure",
    status: "pending",
  });

  const [backupFlags, setBackupFlags] =
    useState<BackupFlags>(DEFAULT_BACKUP_FLAGS);
  const [restoreFlags, setRestoreFlags] = useState<RestoreFlags>({
    ...DEFAULT_RESTORE_FLAGS,
    noOwner: true,
  });

  const [sourceId, setSourceId] = useState<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [targetUrl, setTargetUrl] = useState<string | null>(null);

  function validateUrl(url: string | null): boolean {
    if (!url) return false;
    return url.startsWith("postgres://") || url.startsWith("postgresql://");
  }

  const isSourceValid =
    !!sourceId && (sourceId !== "custom" || validateUrl(sourceUrl));
  const isTargetValid =
    !!targetId && (targetId !== "custom" || validateUrl(targetUrl));

  const canStartMigration = isSourceValid && isTargetValid;

  async function handleStartMigration() {
    if (!canStartMigration) return;

    setMigration({
      currentStep: "migrating",
      status: "running",
      error: null,
    });

    const finalSourceUrl =
      sourceId === "custom"
        ? sourceUrl
        : databases.find((db) => db.id === sourceId)?.url;

    const finalTargetUrl =
      targetId === "custom"
        ? targetUrl
        : databases.find((db) => db.id === targetId)?.url;

    const event = new SSE("/api/migrate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      payload: JSON.stringify({
        sourceId,
        targetId,
        sourceUrl: finalSourceUrl,
        targetUrl: finalTargetUrl,
        backupFlags,
        restoreFlags,
      }),
    });

    event.addEventListener("message", (e: object) => {
      if ("data" in e && typeof e.data === "string") {
        const response = JSON.parse(e.data) as ApiResponse<{
          backupStatus: MigrationJobStatus;
          restoreStatus: MigrationJobStatus;
        }>;

        const { data, error } = response;

        if (error) {
          setMigration((prev) => ({
            ...prev,
            status: "failed",
            error: error.message,
          }));
          return toast.error(error.message);
        }

        // Logic to determine overall status from backend's response
        const { backupStatus, restoreStatus } = data;

        if (backupStatus === "failed" || restoreStatus === "failed") {
          setMigration((prev) => ({ ...prev, status: "failed" }));
        } else if (
          backupStatus === "completed" &&
          restoreStatus === "completed"
        ) {
          // If both processes finished successfully, automatically advance to Complete step
          setMigration({
            currentStep: "complete",
            status: "completed",
            error: null,
          });
        } else {
          setMigration((prev) => ({ ...prev, status: "running" }));
        }
      }
    });

    event.addEventListener("error", (e: object) => {
      if ("data" in e && typeof e.data === "string") {
        const response = JSON.parse(e.data) as ApiResponse<null>;
        const { error } = response;

        if (error) {
          setMigration((prev) => ({
            ...prev,
            status: "failed",
            error: error.message,
          }));
          toast.error(error.message);
        }
      }
    });
  }

  function handleReset() {
    setMigration({
      currentStep: "configure",
      status: "pending",
    });
    setSourceId("");
    setTargetId("");
    setSourceUrl("");
    setTargetUrl("");
    setBackupFlags(DEFAULT_BACKUP_FLAGS);
    setRestoreFlags(DEFAULT_RESTORE_FLAGS);
  }

  return (
    <main className="container mx-auto max-w-4xl px-4 py-10">
      <StepsHeader migration={migration} />

      {migration.currentStep === "configure" && (
        <ConfigForm
          databases={databases}
          backupFlags={backupFlags}
          setBackupFlags={setBackupFlags}
          restoreFlags={restoreFlags}
          setRestoreFlags={setRestoreFlags}
          sourceId={sourceId}
          setSourceId={setSourceId}
          targetId={targetId}
          setTargetId={setTargetId}
          sourceUrl={sourceUrl}
          setSourceUrl={setSourceUrl}
          targetUrl={targetUrl}
          setTargetUrl={setTargetUrl}
          handleStartMigration={handleStartMigration}
          canStartMigration={canStartMigration}
        />
      )}

      {migration.currentStep === "migrating" && (
        <MigrationProgress migration={migration} handleReset={handleReset} />
      )}

      {migration.currentStep === "complete" && (
        <MigrationComplete handleReset={handleReset} />
      )}
    </main>
  );
}
