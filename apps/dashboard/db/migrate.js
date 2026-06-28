const { drizzle } = require('drizzle-orm/node-postgres');
const { migrate } = require('drizzle-orm/node-postgres/migrator');
const { Pool } = require('pg');
const path = require('node:path');

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
    });

    const db = drizzle(pool, { casing: 'snake_case' });
    const migrationsFolder = path.join(__dirname, '../drizzle');

    await migrate(db, { migrationsFolder });

    console.log('Database migrations completed successfully.');

    await pool.end();
  } catch (error) {
    console.error('Migration failed!');
    console.error(err);
    process.exit(1);
  }
}

main()
