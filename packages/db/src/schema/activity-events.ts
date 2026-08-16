import type { InferSelectModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./auth.js";

// Actions that leave no row of their own behind — the job tables record what
// ran, this records what was removed or reconfigured.
export const activityEventAction = [
  "database.deleted",
  "schedule.deleted",
  "backup.deleted",
  "restore.deleted",
  "migration.deleted",
  "restores.cleared",
  "migrations.cleared",
  "storage.updated",
  "data.nuked",
] as const;

export const activityEventsTable = pgTable(
  "activity_events",
  {
    id: uuid()
      .default(sql`pg_catalog.gen_random_uuid()`)
      .primaryKey(),
    userId: uuid().references(() => usersTable.id, { onDelete: "cascade" }),
    action: text({ enum: activityEventAction }).notNull(),
    summary: text().notNull(),
    details: jsonb().$type<Record<string, unknown>>(),
    // withTimezone, unlike the job tables: an audit row is ordered against
    // rows written by other processes, so the offset has to be in the value.
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("activity_events_user_idx").on(t.userId, t.createdAt)],
);

export const activityEventsRelations = relations(
  activityEventsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [activityEventsTable.userId],
      references: [usersTable.id],
    }),
  }),
);

export type ActivityEvent = InferSelectModel<typeof activityEventsTable>;
export type ActivityEventAction = ActivityEvent["action"];
