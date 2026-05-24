import { InferSelectModel, relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { timestamps } from "./_utils/shared-columns";
import { usersTable } from "./auth";
import { backupJobsTable } from "./backup-jobs";
import { migrationJobsTable } from "./migration-jobs";
import { restoreJobsTable } from "./restore-jobs";

export const databasesTable = sqliteTable("databases", {
  id: text().primaryKey(),
  userId: text().references(() => usersTable.id, { onDelete: "set null" }),
  name: text().notNull().unique(),
  url: text().notNull(),
  backupCount: integer().default(0).notNull(),
  ...timestamps,
});

export const databasesRelations = relations(
  databasesTable,
  ({ one, many }) => ({
    user: one(usersTable, {
      fields: [databasesTable.userId],
      references: [usersTable.id],
    }),
    backupJobs: many(backupJobsTable),
    restoreJobs: many(restoreJobsTable),
    migrationJobs: many(migrationJobsTable),
  }),
);

export type Database = InferSelectModel<typeof databasesTable>;
