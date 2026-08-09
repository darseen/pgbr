// A job's id is the queue row's id, which is also its history row's id, so no
// payload carries one.

export interface BackupJobPayload {
  userId: string;
  databaseId: string;
  /** Present when the job was produced by a backup schedule. */
  scheduleId?: string;
  flags: unknown;
}

export interface RestoreJobPayload {
  userId: string;
  databaseId: string;
  /** Restore from a tracked backup job. */
  backupJobId?: string;
  /** Object-store key of a user-uploaded custom source (in custom-uploads/). */
  customKey?: string;
  flags: unknown;
}

export interface MigrateJobPayload {
  userId: string;
  sourceId?: string;
  targetId?: string;
  sourceUrl?: string;
  targetUrl?: string;
  backupFlags: unknown;
  restoreFlags: unknown;
}
