import { createRedisConnection, QUEUE_NAMES } from "@repo/shared";
import { getStore } from "@repo/storage";
import { Worker } from "bullmq";
import { reconcileSchedules } from "./lib/reconcile-schedules.js";
import { processBackup } from "./processors/backup.js";
import { processMigrate } from "./processors/migrate.js";
import { processRestore } from "./processors/restore.js";

const concurrency = Number(process.env.WORKER_CONCURRENCY) || 5;

// Interruption recovery is handled by BullMQ's built-in stalled-job detection:
// if a worker dies mid-job, the job's lock expires and another worker
// reprocesses it. Processors upsert their job row idempotently, so a
// re-delivery converges rather than duplicating or orphaning state. This
// replaces the old global "mark every running row failed on boot" sweep, which
// was unsafe once more than one worker can run at a time.

// Schedules live in Postgres; the BullMQ job schedulers in Redis are derived
// state that a single worker reconciles on boot. Gate it behind a short Redis
// lock so exactly one replica runs the (idempotent) reconcile pass.
async function reconcileSchedulesOnce() {
  const redis = createRedisConnection();
  try {
    const gotLock = await redis.set(
      "pgbr:reconcile-lock",
      String(process.pid),
      "EX",
      60,
      "NX",
    );
    if (!gotLock) {
      console.log("Another worker is reconciling schedules; skipping");
      return;
    }
    await reconcileSchedules();
  } finally {
    await redis.quit();
  }
}

try {
  await reconcileSchedulesOnce();
} catch (err) {
  console.error("Failed to reconcile backup schedules:", err);
}

// Auto-provision the configured bucket so a fresh install works with zero
// setup. Best-effort: an external store where the bucket already exists (and
// the credentials can't create buckets) is fine.
try {
  const store = await getStore();
  await store.ensureBucket();
} catch (err) {
  console.error("Failed to ensure storage bucket on startup:", err);
}

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
