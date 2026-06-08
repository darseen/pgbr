import { MigrationJobStatus } from "@/db/schema";

export interface BackupFlags {
  format: "custom" | "plain" | "directory" | "tar";
  compress: boolean;
  dataOnly: boolean;
  schemaOnly: boolean;
  clean: boolean;
  create: boolean;
  ifExists: boolean;
  noOwner: boolean;
  noPrivileges: boolean;
  verbose: boolean;
  jobs?: number;
  inserts?: boolean;
  excludeSchemas?: string[];
  includeSchemas?: string[];
  excludeTables?: string[];
  includeTables?: string[];
  excludeTableData?: string[];
}

export interface RestoreFlags {
  format: "custom" | "directory" | "tar";
  dataOnly: boolean;
  schemaOnly: boolean;
  clean: boolean;
  create: boolean;
  noOwner: boolean;
  noPrivileges: boolean;
  disableTriggers: boolean;
  verbose: boolean;
  jobs?: number;
  singleTransaction: boolean;
  exitOnError: boolean;
  ifExists: boolean;
  excludeSchemas?: string[];
  includeSchemas?: string[];
  includeTables?: string[];
}

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
