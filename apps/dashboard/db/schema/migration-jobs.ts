import { BackupFlags, RestoreFlags } from "@/types";
import { InferSelectModel, relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { timestamps } from "./_utils/shared-columns";
import { usersTable } from "./auth";
import { databasesTable } from "./databases";

export const migrationJobStatus = [
  "pending",
  "running",
  "completed",
  "failed",
] as const;

export const migrationJobsTable = sqliteTable("migration_jobs", {
  id: text().primaryKey(),
  userId: text().references(() => usersTable.id, {
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
  startedAt: text()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  completedAt: text(),
  error: text(),
  backupFlags: text({ mode: "json" }).$type<BackupFlags>().notNull(),
  restoreFlags: text({ mode: "json" }).$type<RestoreFlags>().notNull(),
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
