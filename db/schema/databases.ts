import { InferSelectModel, relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { timestamps } from "./_utils/shared-columns";
import { usersTable } from "./users";

export const databasesTable = sqliteTable("databases", {
  id: text().primaryKey(),
  userId: text().references(() => usersTable.id, { onDelete: "set null" }),
  name: text().notNull().unique(),
  url: text().notNull(),
  backupCount: integer().default(0).notNull(),
  ...timestamps,
});

export const databasesRelations = relations(databasesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [databasesTable.userId],
    references: [usersTable.id],
  }),
}));

export type Database = InferSelectModel<typeof databasesTable>;
