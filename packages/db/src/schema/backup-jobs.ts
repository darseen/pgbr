import type { BackupFlags } from "@repo/types";
import type { InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { integer, pgTable, text, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "./_utils/shared-columns.js";
import { usersTable } from "./auth.js";
import { backupSchedulesTable } from "./backup-schedules.js";
import { databasesTable } from "./databases.js";

export const backupJobStatus = [
  "pending",
  "running",
  "completed",
  "failed",
] as const;

export const backupJobsTable = pgTable("backup_jobs", {
  id: text().primaryKey(),
  databaseId: text().references(() => databasesTable.id, {
    onDelete: "set null",
  }),
  userId: uuid().references(() => usersTable.id, {
    onDelete: "set null",
  }),
  scheduleId: text().references(() => backupSchedulesTable.id, {
    onDelete: "set null",
  }),
  databaseName: text().notNull(),
  status: text({ enum: backupJobStatus }).notNull(),
  backupPath: text().notNull(),
  flags: jsonb().$type<BackupFlags>().notNull(),
  error: text(),
  size: integer().notNull().default(0),
  startedAt: timestamp({ mode: 'string' })
    .defaultNow()
    .notNull(),
  completedAt: timestamp({ mode: 'string' }),
  ...timestamps,
});

export const backupJobsRelations = relations(backupJobsTable, ({ one }) => ({
  database: one(databasesTable, {
    fields: [backupJobsTable.databaseId],
    references: [databasesTable.id],
  }),
  user: one(usersTable, {
    fields: [backupJobsTable.userId],
    references: [usersTable.id],
  }),
  schedule: one(backupSchedulesTable, {
    fields: [backupJobsTable.scheduleId],
    references: [backupSchedulesTable.id],
  }),
}));

export type BackupJob = InferSelectModel<typeof backupJobsTable>;
export type BackupJobStatus = InferSelectModel<
  typeof backupJobsTable
>["status"];
