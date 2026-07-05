import type { BackupFlags, RestoreFlags } from "@repo/types";
import type { InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { integer, pgTable, text, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "./_utils/shared-columns.js";
import { usersTable } from "./auth.js";
import { databasesTable } from "./databases.js";

export const migrationJobStatus = [
  "pending",
  "running",
  "completed",
  "failed",
] as const;

export const migrationJobsTable = pgTable("migration_jobs", {
  id: text().primaryKey(),
  userId: uuid().references(() => usersTable.id, {
    onDelete: "set null",
  }),
  sourceDatabaseId: text().references(() => databasesTable.id, {
    onDelete: "set null",
  }),
  targetDatabaseId: text().references(() => databasesTable.id, {
    onDelete: "set null",
  }),
  sourceDatabaseUrl: text(),
  targetDatabaseUrl: text(),
  sourceDatabaseName: text(),
  targetDatabaseName: text(),
  startedAt: timestamp({ mode: 'string' })
    .defaultNow()
    .notNull(),
  completedAt: timestamp({ mode: 'string' }),
  error: text(),
  backupFlags: jsonb().$type<BackupFlags>().notNull(),
  restoreFlags: jsonb().$type<RestoreFlags>().notNull(),
  status: text({ enum: migrationJobStatus }).notNull(),
  size: integer().notNull().default(0),
  ...timestamps,
});

export const migrationJobsRelations = relations(
  migrationJobsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [migrationJobsTable.userId],
      references: [usersTable.id],
    }),
    sourceDatabase: one(databasesTable, {
      fields: [migrationJobsTable.sourceDatabaseId],
      references: [databasesTable.id],
    }),
    targetDatabase: one(databasesTable, {
      fields: [migrationJobsTable.targetDatabaseId],
      references: [databasesTable.id],
    }),
  }),
);

export type MigrationJob = InferSelectModel<typeof migrationJobsTable>;
export type MigrationJobStatus = InferSelectModel<
  typeof migrationJobsTable
>["status"];
