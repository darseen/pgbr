import { relations } from "drizzle-orm";
import { pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "./_utils/shared-columns";
import { usersTable } from "./users";

export const databasesTable = pgTable("databases", {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => usersTable.id),
  name: varchar({ length: 255 }).notNull(),
  url: text().notNull(),
  ...timestamps,
});

export const databasesRelations = relations(databasesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [databasesTable.userId],
    references: [usersTable.id],
  }),
}));
