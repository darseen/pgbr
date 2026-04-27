import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "./_utils/shared-columns";

export const usersTable = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  username: varchar({ length: 25 }).notNull(),
  password: varchar({ length: 255 }).notNull(),
  ...timestamps,
});
