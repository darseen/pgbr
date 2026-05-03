import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./db/schema/index.ts",
  dbCredentials: {
    url: process.env.DB_FILE_NAME!,
  },
  casing: "snake_case",
});
