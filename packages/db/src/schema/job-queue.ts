import type { InferSelectModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth.js";

export const jobQueueStatus = [
  "pending",
  "active",
  "completed",
  "failed",
] as const;

export const jobQueueName = ["backup", "restore", "migrate"] as const;

export const jobQueueTable = pgTable(
  "job_queue",
  {
    // Shares its value with the domain row in backup_jobs / restore_jobs /
    // migration_jobs, so a queue entry and its history row are the same job.
    id: text().primaryKey(),
    queue: text({ enum: jobQueueName }).notNull(),
    userId: uuid()
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    payload: jsonb().notNull(),
    status: text({ enum: jobQueueStatus }).notNull().default("pending"),
    runAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    attempts: integer().notNull().default(0),
    maxAttempts: integer().notNull().default(1),
    // Stalls are counted separately from attempts: a worker dying is not the
    // job failing, but a job that reliably kills workers must still stop.
    stalls: integer().notNull().default(0),
    lockedBy: text(),
    lockedAt: timestamp({ withTimezone: true }),
    heartbeatAt: timestamp({ withTimezone: true }),
    lastError: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    // Predicates must match the claim and reap queries exactly, or Postgres
    // won't use these.
    index("job_queue_claim_idx")
      .on(t.queue, t.runAt)
      .where(sql`status = 'pending'`),
    index("job_queue_reap_idx")
      .on(t.heartbeatAt)
      .where(sql`status = 'active'`),
    index("job_queue_user_idx").on(t.userId),
  ],
);

export const jobQueueRelations = relations(jobQueueTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [jobQueueTable.userId],
    references: [usersTable.id],
  }),
}));

export type JobQueueRow = InferSelectModel<typeof jobQueueTable>;
export type JobQueueStatus = JobQueueRow["status"];
export type JobQueueName = JobQueueRow["queue"];
