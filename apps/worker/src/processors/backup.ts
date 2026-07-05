import { db, backupJobsTable, databasesTable } from "@repo/db";
import { decrypt } from "@repo/shared";
import { buildBackupKey, getStore } from "@repo/storage";
import { backupSchema, type BackupJobPayload } from "@repo/types";
import type { Job } from "bullmq";
import { and, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { tarDirectory } from "../lib/archive.js";
import { buildPgDumpArgs } from "../lib/pg-args.js";
import { cleanupScratch, createScratchDir } from "../lib/paths.js";
import { pruneScheduleBackups } from "../lib/retention.js";
import { runProcess } from "../lib/run-process.js";

export async function processBackup(job: Job<BackupJobPayload>) {
  const { jobId, userId, databaseId, scheduleId, flags: rawFlags } = job.data;

  // User-triggered jobs carry a dashboard-generated UUID. Scheduled jobs don't,
  // so fall back to the BullMQ job id: it's stable across a stalled-job
  // re-delivery, which keeps the idempotent upsert below from orphaning a
  // "running" row when a worker crashes and another reprocesses the job.
  const rowId = jobId ?? job.id ?? randomUUID();

  const flagResult = backupSchema.safeParse(rawFlags);
  if (!flagResult.success) {
    throw new Error(flagResult.error.issues[0]?.message ?? "Invalid backup flags");
  }
  const flags = flagResult.data;

  const [database] = await db
    .select()
    .from(databasesTable)
    .where(and(eq(databasesTable.id, databaseId), eq(databasesTable.userId, userId)));

  if (!database) {
    throw new Error("Database not found");
  }

  const storageKey = buildBackupKey(rowId, flags.format);

  // Idempotent insert: a stalled job re-delivered by BullMQ re-runs this
  // processor; re-inserting the same row id must not crash a retry.
  const [backupJob] = await db
    .insert(backupJobsTable)
    .values({
      id: rowId,
      databaseId: database.id,
      userId,
      scheduleId: scheduleId ?? null,
      databaseName: database.name,
      status: "running",
      storageKey,
      flags,
    })
    .onConflictDoUpdate({
      target: backupJobsTable.id,
      set: { status: "running", storageKey, error: null, completedAt: null },
    })
    .returning();

  await job.updateProgress(backupJob!);

  const scratchDir = await createScratchDir("pgbr-backup-");
  try {
    // Directory-format dumps write a directory that we then collapse into a
    // single tar artifact; every other format writes a single file directly.
    const isDirectory = flags.format === "directory";
    const dumpTarget = isDirectory
      ? path.join(scratchDir, "dump")
      : path.join(scratchDir, "artifact");
    const artifactPath = isDirectory
      ? path.join(scratchDir, "artifact.tar")
      : dumpTarget;

    const args = buildPgDumpArgs(dumpTarget, flags, decrypt(database.url));

    const result = await runProcess("pg_dump", args);

    if (result.code !== 0) {
      throw new Error(
        result.stderr.trim()
          ? result.stderr.trim()
          : `pg_dump exited with code ${result.code} (No standard error output)`,
      );
    }

    if (isDirectory) {
      await tarDirectory(dumpTarget, artifactPath);
    }

    const store = await getStore();
    const { size } = await store.uploadFile(artifactPath, storageKey);

    const [updatedJob] = await db
      .update(backupJobsTable)
      .set({
        status: "completed",
        error: null,
        completedAt: new Date().toISOString(),
        size,
      })
      .where(eq(backupJobsTable.id, rowId))
      .returning();

    await db
      .update(databasesTable)
      .set({ backupCount: sql`${databasesTable.backupCount} + 1` })
      .where(eq(databasesTable.id, databaseId));

    // Retention failures must not fail an otherwise successful backup.
    try {
      await pruneScheduleBackups(scheduleId);
    } catch (retentionError) {
      console.error("Failed to prune scheduled backups", retentionError);
    }

    return updatedJob;
  } catch (err) {
    // Any failure after the row exists (dump, non-zero exit, tar, upload) must
    // be recorded so the row never stays stuck in "running".
    await db
      .update(backupJobsTable)
      .set({
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
        completedAt: new Date().toISOString(),
      })
      .where(eq(backupJobsTable.id, rowId));
    throw err;
  } finally {
    await cleanupScratch(scratchDir);
  }
}
