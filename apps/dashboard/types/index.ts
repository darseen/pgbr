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

export type MigrationStep = "configure" | "migrating" | "complete";

export type MigrationState = {
  currentStep: MigrationStep;
  error?: string | null;
  status: MigrationJobStatus;
};
