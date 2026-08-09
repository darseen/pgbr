import { backupSchedulesTable, db } from "@repo/db";
import type { BackupJobPayload } from "@repo/types";
import { and, eq, isNotNull, isNull, lte, or, sql } from "drizzle-orm";
import parser from "cron-parser";
import { randomUUID } from "node:crypto";
import { enqueue } from "./client.js";
import { QUEUE_NAMES } from "./types.js";

/** Arbitrary but stable; scopes the advisory lock to the scheduler tick. */
const SCHEDULER_LOCK_KEY = 4919042;

export function nextOccurrence(expression: string, timezone: string): Date {
  return parser
    .parseExpression(expression, { tz: timezone, currentDate: new Date() })
    .next()
    .toDate();
}

/**
 * Fires every schedule that has come due and computes the next occurrence. The
 * schedule row is the scheduler, so there is no derived state to reconcile.
 *
 * The advisory lock is transaction-scoped, so exactly one replica ticks and the
 * lock releases itself however the transaction ends.
 */
export async function tickSchedules(): Promise<number> {
  return db.transaction(async (tx) => {
    const lock = await tx.execute(
      sql`SELECT pg_try_advisory_xact_lock(${SCHEDULER_LOCK_KEY}) AS locked`,
    );
    if (!lock.rows[0]?.locked) return 0;

    const due = await tx
      .select()
      .from(backupSchedulesTable)
      .where(
        and(
          eq(backupSchedulesTable.enabled, true),
          isNotNull(backupSchedulesTable.userId),
          or(
            isNull(backupSchedulesTable.nextRunAt),
            lte(backupSchedulesTable.nextRunAt, new Date()),
          ),
        ),
      )
      .for("update");

    let fired = 0;

    for (const schedule of due) {
      let next: Date;
      try {
        next = nextOccurrence(schedule.cronExpression, schedule.timezone);
      } catch (err) {
        console.error(
          `Schedule ${schedule.id} has an unparseable cron expression; skipping:`,
          err,
        );
        continue;
      }

      // A null next_run_at means this schedule has never been scheduled — a
      // fresh upgrade, or one just enabled. Compute its next occurrence without
      // firing, so upgrading doesn't stampede every schedule at once.
      if (schedule.nextRunAt) {
        const payload: BackupJobPayload = {
          userId: schedule.userId!,
          databaseId: schedule.databaseId,
          scheduleId: schedule.id,
          flags: schedule.flags,
        };

        await enqueue(tx, {
          id: randomUUID(),
          queue: QUEUE_NAMES.backup,
          userId: schedule.userId!,
          payload,
        });
        fired++;
      }

      await tx
        .update(backupSchedulesTable)
        .set({ nextRunAt: next })
        .where(eq(backupSchedulesTable.id, schedule.id));
    }

    return fired;
  });
}
