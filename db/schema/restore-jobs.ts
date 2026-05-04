import { InferSelectModel, relations, sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { databasesTable } from "./databases";

export const backupJobStatus = [
  "pending",
  "running",
  "completed",
  "failed",
] as const;

export const restoreJobsTable = sqliteTable("restore_jobs", {
  id: text().primaryKey(),
  databaseId: text().references(() => databasesTable.id, {
    onDelete: "set null",
  }),
  databaseName: text().notNull(),
  status: text({ enum: backupJobStatus }).notNull(),
  backupPath: text().notNull(),
  flags: text().notNull(),
  error: text(),
  startedAt: text()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  completedAt: text(),
});

export const restoreJobsRelations = relations(restoreJobsTable, ({ one }) => ({
  database: one(databasesTable, {
    fields: [restoreJobsTable.databaseId],
    references: [databasesTable.id],
  }),
}));

export type RestoreJob = InferSelectModel<typeof restoreJobsTable>;
