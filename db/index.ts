import { getPgbrDataPath } from "@/utils";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import * as schema from "./schema";

const pgbrDataPath = getPgbrDataPath();

if (!existsSync(pgbrDataPath)) {
  mkdirSync(pgbrDataPath, { recursive: true });
}

const sqlite = new Database(path.join(pgbrDataPath, "pgbr.db"));

export const db = drizzle({
  client: sqlite,
  schema,
  casing: "snake_case",
});
