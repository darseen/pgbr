import { pool } from "@repo/db";
import {
  closeListener,
  heartbeat,
  purgeCompleted,
  QUEUE_NAMES,
  reap,
  releaseUnfinished,
  runQueue,
  tickSchedules,
} from "@repo/queue";
import { getStore } from "@repo/storage";
import { hostname } from "node:os";
import { randomUUID } from "node:crypto";
import { processBackup } from "./processors/backup.js";
import { processMigrate } from "./processors/migrate.js";
import { processRestore } from "./processors/restore.js";

const concurrency = Number(process.env.WORKER_CONCURRENCY) || 5;

// Identifies this process's claims. Unique per boot, so a restarted worker
// never mistakes a previous incarnation's jobs for its own.
const workerId = `${hostname()}:${process.pid}:${randomUUID().slice(0, 8)}`;

const HEARTBEAT_MS = 15_000;
const REAP_MS = 60_000;
const SCHEDULER_MS = 30_000;
const PURGE_MS = 6 * 60 * 60 * 1000;

// Interruption recovery: every worker stamps heartbeat_at on the jobs it holds,
// and the reaper requeues anything whose worker went quiet. Processors upsert
// their job row idempotently, so a re-delivery converges rather than
// duplicating or orphaning state.

// Auto-provision the configured bucket so a fresh install works with zero
// setup. Best-effort: an external store where the bucket already exists (and
// the credentials can't create buckets) is fine.
try {
  const store = await getStore();
  await store.ensureBucket();
} catch (err) {
  console.error("Failed to ensure storage bucket on startup:", err);
}

const runners = [
  runQueue({
    queue: QUEUE_NAMES.backup,
    workerId,
    concurrency,
    handler: processBackup,
  }),
  runQueue({
    queue: QUEUE_NAMES.restore,
    workerId,
    concurrency,
    handler: processRestore,
  }),
  runQueue({
    queue: QUEUE_NAMES.migrate,
    workerId,
    concurrency,
    handler: processMigrate,
  }),
];

async function safely(what: string, run: () => Promise<unknown>) {
  try {
    await run();
  } catch (err) {
    console.error(`${what} failed:`, err);
  }
}

const intervals = [
  setInterval(() => void safely("Heartbeat", () => heartbeat(workerId)), HEARTBEAT_MS),
  setInterval(() => void safely("Reaper", reap), REAP_MS),
  setInterval(() => void safely("Scheduler tick", tickSchedules), SCHEDULER_MS),
  setInterval(() => void safely("Queue purge", () => purgeCompleted()), PURGE_MS),
];

// One pass at boot so a schedule that came due while every worker was down
// fires promptly rather than waiting for the first tick.
await safely("Scheduler tick", tickSchedules);

console.log(`Worker ${workerId} ready (concurrency ${concurrency} per queue)`);

let shuttingDown = false;

async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("Shutting down worker...");

  for (const interval of intervals) clearInterval(interval);

  // Docker gives us stop_grace_period (300s in the shipped compose); leave
  // headroom to hand back whatever didn't finish before we're killed.
  await Promise.all(runners.map((runner) => runner.stop(270_000)));
  await releaseUnfinished(workerId);
  await closeListener();
  await pool.end().catch(() => {});

  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
