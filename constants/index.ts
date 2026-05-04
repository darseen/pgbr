import { BackupFlags, RestoreFlags } from "@/types";

export const DEFAULT_BACKUP_FLAGS: BackupFlags = {
  format: "custom",
  compress: true,
  dataOnly: false,
  schemaOnly: false,
  clean: false,
  noOwner: false,
  noPrivileges: false,
  verbose: true,
  jobs: 1,
};

export const DEFAULT_RESTORE_FLAGS: RestoreFlags = {
  dataOnly: false,
  schemaOnly: false,
  clean: true,
  noOwner: false,
  noPrivileges: false,
  verbose: true,
  jobs: 1,
  singleTransaction: false,
  exitOnError: true,
  ifExists: true,
};
