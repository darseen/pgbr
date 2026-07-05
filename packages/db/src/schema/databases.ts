import type { InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "./_utils/shared-columns.js";
import { usersTable } from "./auth.js";
import { backupJobsTable } from "./backup-jobs.js";
import { migrationJobsTable } from "./migration-jobs.js";
import { restoreJobsTable } from "./restore-jobs.js";

export const databasesTable = pgTable("databases", {
  id: text().primaryKey(),
  userId: uuid().references(() => usersTable.id, { onDelete: "set null" }),
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
