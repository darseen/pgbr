export interface BackupFlags {
  format: "custom" | "plain" | "directory" | "tar";
  compress: boolean;
  dataOnly: boolean;
  schemaOnly: boolean;
  clean: boolean;
  noOwner: boolean;
  noPrivileges: boolean;
  verbose: boolean;
  jobs?: number;
  excludeTables?: string[];
  includeTables?: string[];
}

export interface RestoreFlags {
  dataOnly: boolean;
  schemaOnly: boolean;
  clean: boolean;
  noOwner: boolean;
  noPrivileges: boolean;
  verbose: boolean;
  jobs?: number;
  singleTransaction: boolean;
  exitOnError: boolean;
  ifExists: boolean;
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
