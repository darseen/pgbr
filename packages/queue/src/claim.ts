import {
  backupJobsTable,
  db,
  jobQueueTable,
  migrationJobsTable,
  restoreJobsTable,
} from "@repo/db";
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import type { ClaimedJob, QueueName } from "./types.js";

/** Six missed beats. Generous enough to survive a GC pause on a saturated worker. */
const STALE_AFTER = "90 seconds";

/** A job that reliably kills its worker must stop rather than loop forever. */
const STALL_LIMIT = 2;

/**
 * Take up to `limit` due jobs off `queue`. SKIP LOCKED means concurrent
 * workers never block each other, and the statement commits on its own — no
 * transaction is ever held open across a pg_dump.
 */
export async function claim(
  queue: QueueName,
  workerId: string,
  limit: number,
): Promise<ClaimedJob[]> {
  if (limit <= 0) return [];

  const result = await db.execute(sql`
    UPDATE job_queue q
       SET status = 'active',
           locked_by = ${workerId},
           locked_at = now(),
           heartbeat_at = now(),
           attempts = q.attempts + 1
      FROM (
        SELECT id FROM job_queue
         WHERE queue = ${queue}
           AND status = 'pending'
           AND run_at <= now()
         ORDER BY run_at, created_at
         FOR UPDATE SKIP LOCKED
         LIMIT ${limit}
      ) AS c
     WHERE q.id = c.id
    RETURNING q.id, q.queue, q.user_id AS "userId", q.payload, q.attempts
  `);

  return result.rows as unknown as ClaimedJob[];
}

/** One statement per worker per tick, not one per job. */
export async function heartbeat(workerId: string) {
  await db
    .update(jobQueueTable)
    .set({ heartbeatAt: new Date() })
    .where(
      and(
        eq(jobQueueTable.lockedBy, workerId),
        eq(jobQueueTable.status, "active"),
      ),
    );
}

/**
 * Requeue jobs whose worker stopped heartbeating. A stall isn't a failure, so
 * it doesn't consume maxAttempts — it has its own counter.
 */
export async function reap() {
  const reaped = await db
    .update(jobQueueTable)
    .set({
      status: sql`CASE WHEN ${jobQueueTable.stalls} + 1 >= ${STALL_LIMIT} THEN 'failed' ELSE 'pending' END`,
      stalls: sql`${jobQueueTable.stalls} + 1`,
      lockedBy: null,
      lockedAt: null,
      heartbeatAt: null,
      runAt: sql`now()`,
      lastError: sql`CASE WHEN ${jobQueueTable.stalls} + 1 >= ${STALL_LIMIT} THEN 'Worker stopped responding while running this job' ELSE ${jobQueueTable.lastError} END`,
      completedAt: sql`CASE WHEN ${jobQueueTable.stalls} + 1 >= ${STALL_LIMIT} THEN now() ELSE NULL END`,
    })
    .where(
      and(
        eq(jobQueueTable.status, "active"),
        lt(jobQueueTable.heartbeatAt, sql`now() - interval ${sql.raw(`'${STALE_AFTER}'`)}`),
      ),
    )
    .returning({
      id: jobQueueTable.id,
      queue: jobQueueTable.queue,
      status: jobQueueTable.status,
    });

  const dead = reaped.filter((row) => row.status === "failed");
  if (dead.length > 0) await closeAbandonedRows(dead);

  return {
    requeued: reaped.length - dead.length,
    failed: dead.length,
  };
}

/**
 * A job that stalls out for good leaves its history row in "running" forever
 * unless something closes it. Nothing else will — the worker that owned it is
 * gone.
 */
async function closeAbandonedRows(rows: { id: string; queue: QueueName }[]) {
  const error = "Worker stopped responding while running this job";
  const byQueue = {
    backup: rows.filter((r) => r.queue === "backup").map((r) => r.id),
    restore: rows.filter((r) => r.queue === "restore").map((r) => r.id),
    migrate: rows.filter((r) => r.queue === "migrate").map((r) => r.id),
  };

  const finalise = { status: "failed" as const, error, completedAt: new Date().toISOString() };

  if (byQueue.backup.length > 0) {
    await db
      .update(backupJobsTable)
      .set(finalise)
      .where(
        and(
          inArray(backupJobsTable.id, byQueue.backup),
          eq(backupJobsTable.status, "running"),
        ),
      );
  }
  if (byQueue.restore.length > 0) {
    await db
      .update(restoreJobsTable)
      .set(finalise)
      .where(
        and(
          inArray(restoreJobsTable.id, byQueue.restore),
          eq(restoreJobsTable.status, "running"),
        ),
      );
  }
  if (byQueue.migrate.length > 0) {
    await db
      .update(migrationJobsTable)
      .set(finalise)
      .where(
        and(
          inArray(migrationJobsTable.id, byQueue.migrate),
          eq(migrationJobsTable.status, "running"),
        ),
      );
  }
}

/** Hands a shutting-down worker's unfinished jobs straight back, rather than waiting out the reaper. */
export async function releaseWorkerJobs(workerId: string) {
  const released = await db
    .update(jobQueueTable)
    .set({
      status: "pending",
      lockedBy: null,
      lockedAt: null,
      heartbeatAt: null,
      runAt: sql`now()`,
    })
    .where(
      and(
        eq(jobQueueTable.lockedBy, workerId),
        eq(jobQueueTable.status, "active"),
      ),
    )
    .returning({ id: jobQueueTable.id });

  return released.length;
}

/** The domain tables hold the real history; finished queue rows are just bookkeeping. */
export async function purgeCompleted(olderThanDays = 7) {
  await db
    .delete(jobQueueTable)
    .where(
      and(
        inArray(jobQueueTable.status, ["completed", "failed"]),
        lt(
          jobQueueTable.completedAt,
          sql`now() - interval ${sql.raw(`'${olderThanDays} days'`)}`,
        ),
      ),
    );
}
