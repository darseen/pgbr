import { getPgbrDataPath } from "@/utils";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import * as schema from "./schema";

const pgbrDataPath = path.join(getPgbrDataPath(), "pgbr.db");

const sqlite = new Database(pgbrDataPath);

export const db = drizzle({
  client: sqlite,
  schema,
  casing: "snake_case",
});
