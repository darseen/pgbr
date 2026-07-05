import type { BackupJobPayload } from "@repo/types";
import { QUEUE_NAMES } from "./queue-names.js";

export interface SchedulableBackup {
  id: string;
  userId: string | null;
  databaseId: string;
  cronExpression: string;
  timezone: string;
  flags: unknown;
}

// Postgres is the source of truth for job history; without these caps the
// scheduler's repeat jobs accumulate in Redis forever.
export const SCHEDULED_JOB_OPTS = {
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 100 },
};

// Single source of truth for the args passed to
// queue.upsertJobScheduler(...) — used by both the dashboard actions and the
// worker's boot reconciliation so the two can never drift.
export function buildScheduleTemplate(schedule: SchedulableBackup) {
  if (!schedule.userId) {
    throw new Error(`Backup schedule ${schedule.id} has no owner`);
  }

  const data: BackupJobPayload = {
    userId: schedule.userId,
    databaseId: schedule.databaseId,
    scheduleId: schedule.id,
    flags: schedule.flags,
  };

  return [
    schedule.id,
    { pattern: schedule.cronExpression, tz: schedule.timezone },
    { name: QUEUE_NAMES.backup, data, opts: SCHEDULED_JOB_OPTS },
  ] as const;
}
