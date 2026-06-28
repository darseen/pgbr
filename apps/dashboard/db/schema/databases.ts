import { InferSelectModel, relations } from "drizzle-orm";
import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "./_utils/shared-columns";
import { usersTable } from "./auth";
import { backupJobsTable } from "./backup-jobs";
import { migrationJobsTable } from "./migration-jobs";
import { restoreJobsTable } from "./restore-jobs";

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
