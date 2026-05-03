import { sql } from "drizzle-orm";
import { text } from "drizzle-orm/sqlite-core";

export const timestamps = {
  created_at: text().default(sql`(CURRENT_TIMESTAMP)`),
  updated_at: text().default(sql`(CURRENT_TIMESTAMP)`),
};
