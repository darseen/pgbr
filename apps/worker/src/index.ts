import {
  db,
  backupJobsTable,
  migrationJobsTable,
  restoreJobsTable,
} from "@repo/db";
import { createRedisConnection, QUEUE_NAMES } from "@repo/shared";
import { Worker } from "bullmq";
import { eq } from "drizzle-orm";
import { processBackup } from "./processors/backup.js";
import { processMigrate } from "./processors/migrate.js";
import { processRestore } from "./processors/restore.js";

const concurrency = Number(process.env.WORKER_CONCURRENCY) || 5;

// A crash or restart mid-job leaves rows stuck in "running" forever.
// Sweep them before accepting new jobs. Assumes a single worker instance.
async function failInterruptedJobs() {
  const error = "Job was interrupted by a worker restart";
  const completedAt = new Date().toISOString();

  try {
    await Promise.all([
      db
        .update(backupJobsTable)
        .set({ status: "failed", error, completedAt })
        .where(eq(backupJobsTable.status, "running")),
      db
        .update(restoreJobsTable)
        .set({ status: "failed", error, completedAt })
        .where(eq(restoreJobsTable.status, "running")),
      db
        .update(migrationJobsTable)
        .set({ status: "failed", error, completedAt })
        .where(eq(migrationJobsTable.status, "running")),
    ]);
  } catch (err) {
    console.error("Failed to sweep interrupted jobs:", err);
  }
}

await failInterruptedJobs();

const backupWorker = new Worker(QUEUE_NAMES.backup, processBackup, {
  connection: createRedisConnection(),
  concurrency,
});

const restoreWorker = new Worker(QUEUE_NAMES.restore, processRestore, {
  connection: createRedisConnection(),
  concurrency,
});

const migrateWorker = new Worker(QUEUE_NAMES.migrate, processMigrate, {
  connection: createRedisConnection(),
  concurrency,
});

for (const worker of [backupWorker, restoreWorker, migrateWorker]) {
  worker.on("error", (err) => {
    console.error(`[${worker.name}] worker error:`, err);
  });
}

async function shutdown() {
  console.log("Shutting down worker...");
  await Promise.all([
    backupWorker.close(),
    restoreWorker.close(),
    migrateWorker.close(),
  ]);
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
