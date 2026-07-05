export interface BackupJobPayload {
  jobId: string;
  userId: string;
  databaseId: string;
  flags: unknown;
}

export interface RestoreJobPayload {
  jobId: string;
  userId: string;
  databaseId: string;
  backupJobId?: string;
  backupPath?: string;
  flags: unknown;
}

export interface MigrateJobPayload {
  jobId: string;
  userId: string;
  sourceId?: string;
  targetId?: string;
  sourceUrl?: string;
  targetUrl?: string;
  backupFlags: unknown;
  restoreFlags: unknown;
}
