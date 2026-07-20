import { MigrationJobStatus } from "@repo/db/schema";

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
