import { db, jobQueueTable } from "@repo/db";
import { and, eq, sql } from "drizzle-orm";
import type { Executor, QueueName } from "./types.js";

export type EnqueueInput = {
  /** Also becomes the domain row's id, so a queue entry and its history row are one job. */
  id: string;
  queue: QueueName;
  userId: string;
  payload: unknown;
  runAt?: Date;
  maxAttempts?: number;
};

/**
 * Insert a job. Pass a transaction to make enqueueing atomic with the row it
 * belongs to — the notification only fires if that transaction commits.
 */
export async function enqueue(executor: Executor, input: EnqueueInput) {
  await executor.insert(jobQueueTable).values({
    id: input.id,
    queue: input.queue,
    userId: input.userId,
    payload: input.payload,
    status: "pending",
    ...(input.runAt ? { runAt: input.runAt } : {}),
    ...(input.maxAttempts ? { maxAttempts: input.maxAttempts } : {}),
  });
}

export async function complete(id: string) {
  await db
    .update(jobQueueTable)
    .set({
      status: "completed",
      completedAt: new Date(),
      lockedBy: null,
      lockedAt: null,
      heartbeatAt: null,
      lastError: null,
    })
    .where(eq(jobQueueTable.id, id));
}

/**
 * Record a processor failure. Terminal once attempts reach maxAttempts, which
 * is the default of 1 for every queue pgbr runs — a failed dump fails
 * identically on retry, so nothing is retried automatically.
 */
export async function fail(id: string, error: string) {
  const terminal = sql`${jobQueueTable.attempts} >= ${jobQueueTable.maxAttempts}`;

  const [row] = await db
    .update(jobQueueTable)
    .set({
      status: sql`CASE WHEN ${terminal} THEN 'failed' ELSE 'pending' END`,
      lastError: error,
      lockedBy: null,
      lockedAt: null,
      heartbeatAt: null,
      runAt: sql`CASE WHEN ${terminal} THEN ${jobQueueTable.runAt} ELSE now() + interval '30 seconds' END`,
      completedAt: sql`CASE WHEN ${terminal} THEN now() ELSE NULL END`,
    })
    .where(eq(jobQueueTable.id, id))
    .returning({ status: jobQueueTable.status });

  return row?.status;
}

/** Cancels a user's queued-but-unstarted jobs. Running jobs are left alone. */
export async function cancelPendingForUser(executor: Executor, userId: string) {
  await executor
    .delete(jobQueueTable)
    .where(
      and(
        eq(jobQueueTable.userId, userId),
        eq(jobQueueTable.status, "pending"),
      ),
    );
}
