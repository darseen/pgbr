import { defineConfig } from "drizzle-kit";
import path from "node:path";
import { getPgbrDataPath } from "./utils";

const pgbrDataUrl = path.join(`file:${getPgbrDataPath()}`, "pgbr.db");

export default defineConfig({
  dialect: "sqlite",
  schema: "./db/schema/index.ts",
  dbCredentials: {
    url: pgbrDataUrl,
  },
  casing: "snake_case",
});
