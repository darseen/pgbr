import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
  });

  try {
    const db = drizzle(pool, { casing: "snake_case" });
    const migrationsFolder = path.join(__dirname, "../drizzle");

    await migrate(db, { migrationsFolder });

    console.log("Database migrations completed successfully.");
  } catch (error) {
    console.error("Migration failed!");
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
