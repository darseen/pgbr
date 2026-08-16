import { ActivityEventAction, MigrationJobStatus } from "@repo/db/schema";
import { BackupFlags, RestoreFlags } from "@repo/types";

export type { BackupFlags, RestoreFlags } from "@repo/types";

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

type SuccessResponse<T> = {
  data: T;
  error: null;
};

type ErrorResponse = {
  data: null;
  error: { message: string };
};

// What the migrate flow needs to name a saved database. Deliberately excludes
// `url`: the worker resolves the credential from the id, so the connection
// string has no reason to reach the browser.
export type DatabaseOption = {
  id: string;
  name: string;
};

export type MigrationStep = "configure" | "migrating" | "complete";

export type MigrationState = {
  currentStep: MigrationStep;
  error?: string | null;
  status: MigrationJobStatus;
};

export const ACTIVITY_KINDS = [
  "backup",
  "restore",
  "migration",
  "event",
] as const;

export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

export type ActivityStatus = MigrationJobStatus | "logged";

// One row of the activity feed. Built on the server from the three job tables
// plus activity_events, deliberately narrow: connection strings live on the
// migration rows and must not travel to the browser.
export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  title: string;
  subtitle: string | null;
  status: ActivityStatus;
  // ISO 8601, UTC. The job tables store naive timestamps, so they are
  // normalized here rather than in every component that renders them.
  timestamp: string;
  completedAt: string | null;
  databaseName: string | null;
  storageKey: string | null;
  size: number | null;
  error: string | null;
  backupFlags: BackupFlags | null;
  restoreFlags: RestoreFlags | null;
  action: ActivityEventAction | null;
  details: Record<string, unknown> | null;
};

export type ActivityRef = {
  kind: ActivityKind;
  id: string;
};
