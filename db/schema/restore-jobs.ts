import { RestoreFlags } from "@/types";
import { InferSelectModel, relations, sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { timestamps } from "./_utils/shared-columns";
import { usersTable } from "./auth";
import { databasesTable } from "./databases";

export const restoreJobStatus = [
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
  status: text({ enum: restoreJobStatus }).notNull(),
  userId: text().references(() => usersTable.id, {
    onDelete: "set null",
  }),
  backupPath: text().notNull(),
  flags: text({ mode: "json" }).$type<RestoreFlags>().notNull(),
  error: text(),
  startedAt: text()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  completedAt: text(),
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
