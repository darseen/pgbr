export interface BackupJobPayload {
  /** Present for user-triggered runs (SSE correlation); absent for scheduled runs. */
  jobId?: string;
  userId: string;
  databaseId: string;
  /** Present when the job was produced by a backup schedule. */
  scheduleId?: string;
  flags: unknown;
}

export interface RestoreJobPayload {
  jobId: string;
  userId: string;
  databaseId: string;
  /** Restore from a tracked backup job. */
  backupJobId?: string;
  /** Object-store key of a user-uploaded custom source (in custom-uploads/). */
  customKey?: string;
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
