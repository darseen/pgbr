import type { BackupFlags } from "@repo/types";
import type { InferSelectModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "./_utils/shared-columns.js";
import { usersTable } from "./auth.js";
import { backupJobsTable } from "./backup-jobs.js";
import { databasesTable } from "./databases.js";

export const backupSchedulesTable = pgTable("backup_schedules", {
  id: text().primaryKey(),
  userId: uuid().references(() => usersTable.id, { onDelete: "cascade" }),
  databaseId: text()
    .notNull()
    .references(() => databasesTable.id, { onDelete: "cascade" }),
  name: text().notNull(),
  cronExpression: text().notNull(),
  timezone: text().notNull().default("UTC"),
  enabled: boolean().notNull().default(true),
  flags: jsonb().$type<BackupFlags>().notNull(),
  keepLast: integer(),
  // When this schedule next fires. NULL means "not computed yet" — the worker
  // derives it from the cron expression without firing, which is what keeps an
  // upgrade from stampeding every pre-existing schedule at once.
  nextRunAt: timestamp({ withTimezone: true }),
  ...timestamps,
}, (t) => [
  index("backup_schedules_due_idx").on(t.nextRunAt).where(sql`enabled`),
]);

export const backupSchedulesRelations = relations(
  backupSchedulesTable,
  ({ one, many }) => ({
    database: one(databasesTable, {
      fields: [backupSchedulesTable.databaseId],
      references: [databasesTable.id],
    }),
    user: one(usersTable, {
      fields: [backupSchedulesTable.userId],
      references: [usersTable.id],
    }),
    backupJobs: many(backupJobsTable),
  }),
);

export type BackupSchedule = InferSelectModel<typeof backupSchedulesTable>;
