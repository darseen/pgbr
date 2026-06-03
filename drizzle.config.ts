import { defineConfig } from "drizzle-kit";
import path from "node:path";

const pgbrDataUrl = path.join(
  `file:${process.env.PGBR_DATA ?? "./data"}`,
  "pgbr.db",
);

export default defineConfig({
  dialect: "sqlite",
  schema: "./db/schema/index.ts",
  dbCredentials: {
    url: pgbrDataUrl,
  },
  casing: "snake_case",
});
