import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// Ephemeral, container-local scratch for the duration of a single job. Never a
// durable or shared volume — pg_dump/pg_restore can only work on local files,
// so every job stages bytes here and then uploads to / downloads from the
// object store.
export async function createScratchDir(prefix = "pgbr-job-"): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

// Best-effort, unconditional cleanup. Scratch is throwaway, so failures here
// must never surface as job failures.
export async function cleanupScratch(dir: string): Promise<void> {
  try {
    await rm(dir, { recursive: true, force: true });
  } catch (error) {
    console.error(`Failed to clean up scratch dir ${dir}`, error);
  }
}
