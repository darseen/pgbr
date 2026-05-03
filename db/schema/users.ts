import { InferSelectModel } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { timestamps } from "./_utils/shared-columns";

export const usersTable = sqliteTable("users", {
  id: text().primaryKey(),
  username: text({ length: 25 }).notNull(),
  password: text({ length: 255 }).notNull(),
  ...timestamps,
});

export type User = InferSelectModel<typeof usersTable>;
