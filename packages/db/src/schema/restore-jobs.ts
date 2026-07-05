import type { RestoreFlags } from "@repo/types";
import type { InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { pgTable, text, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "./_utils/shared-columns.js";
import { usersTable } from "./auth.js";
import { databasesTable } from "./databases.js";

export const restoreJobStatus = [
  "pending",
  "running",
  "completed",
  "failed",
] as const;

export const restoreJobsTable = pgTable("restore_jobs", {
  id: text().primaryKey(),
  databaseId: text().references(() => databasesTable.id, {
    onDelete: "set null",
  }),
  databaseName: text().notNull(),
  status: text({ enum: restoreJobStatus }).notNull(),
  userId: uuid().references(() => usersTable.id, {
    onDelete: "set null",
  }),
  // Object-store key the restore read from (a tracked backup's key, or the
  // temporary key of a user-uploaded custom source).
  storageKey: text().notNull(),
  flags: jsonb().$type<RestoreFlags>().notNull(),
  error: text(),
  startedAt: timestamp({ mode: 'string' })
    .defaultNow()
    .notNull(),
  completedAt: timestamp({ mode: 'string' }),
  ...timestamps,
});

export const restoreJobsRelations = relations(restoreJobsTable, ({ one }) => ({
  database: one(databasesTable, {
    fields: [restoreJobsTable.databaseId],
    references: [databasesTable.id],
  }),
  user: one(usersTable, {
    fields: [restoreJobsTable.userId],
    references: [usersTable.id],
  }),
}));

export type RestoreJob = InferSelectModel<typeof restoreJobsTable>;
export type RestoreJobStatus = InferSelectModel<
  typeof restoreJobsTable
>["status"];
