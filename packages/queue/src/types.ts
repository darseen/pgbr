import type { db } from "@repo/db";

export const QUEUE_NAMES = {
  backup: "backup",
  restore: "restore",
  migrate: "migrate",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

/** Accepts the shared `db` or a transaction, so an enqueue can join the write it belongs to. */
export type Executor =
  | typeof db
  | Parameters<Parameters<typeof db.transaction>[0]>[0];

/** A job handed to a processor. */
export type JobContext<T> = {
  id: string;
  data: T;
  attempts: number;
  reportProgress: (payload?: unknown) => Promise<void>;
};

export type ClaimedJob = {
  id: string;
  queue: QueueName;
  userId: string;
  payload: unknown;
  attempts: number;
};

export type JobEventName = "progress" | "completed" | "failed";

export type JobEvent = {
  jobId: string;
  queue: QueueName;
  userId: string;
  event: JobEventName;
  data?: unknown;
};
