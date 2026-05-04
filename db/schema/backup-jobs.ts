import { InferSelectModel, relations, sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { timestamps } from "./_utils/shared-columns";
import { databasesTable } from "./databases";

export const backupJobStatus = [
  "pending",
  "running",
  "completed",
  "failed",
] as const;

export const backupJobsTable = sqliteTable("backup_jobs", {
  id: text().primaryKey(),
  databaseId: text().references(() => databasesTable.id, {
    onDelete: "cascade",
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
  ...timestamps,
});

export const backupJobsRelations = relations(backupJobsTable, ({ one }) => ({
  database: one(databasesTable, {
    fields: [backupJobsTable.databaseId],
    references: [databasesTable.id],
  }),
}));

export type BackupJob = InferSelectModel<typeof backupJobsTable>;
