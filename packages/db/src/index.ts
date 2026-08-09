import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema/index.js";

// node-postgres defaults to 10 connections. The worker outgrows that on its
// own: WORKER_CONCURRENCY applies per queue, so the default 5 allows 15
// concurrent jobs, on top of three poll loops, the heartbeat, the reaper, and
// the scheduler tick.
const max = Number(process.env.DATABASE_POOL_MAX) || 20;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max,
});

export const db = drizzle(pool, { schema, casing: "snake_case" });

export * from "./schema/index.js";
