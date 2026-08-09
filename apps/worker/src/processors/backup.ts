import { db, backupJobsTable, databasesTable } from "@repo/db";
import type { JobContext } from "@repo/queue";
import { decrypt, pgConnection } from "@repo/shared";
import { buildBackupKey, getStore } from "@repo/storage";
import { backupSchema, type BackupJobPayload } from "@repo/types";
import { and, eq, sql } from "drizzle-orm";
import path from "node:path";
import { tarDirectory } from "../lib/archive.js";
import { buildPgDumpArgs } from "../lib/pg-args.js";
import { cleanupScratch, createScratchDir } from "../lib/paths.js";
import { pruneScheduleBackups } from "../lib/retention.js";
import { runProcess } from "../lib/run-process.js";

export async function processBackup(job: JobContext<BackupJobPayload>) {
  const { userId, databaseId, scheduleId, flags: rawFlags } = job.data;

  // The queue row's id is the history row's id, and it's stable across a
  // re-delivery — which keeps the idempotent upsert below from orphaning a
  // "running" row when a worker dies and another picks the job up.
  const rowId = job.id;

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

  const storageKey = buildBackupKey(rowId, flags.format, flags.compress);

  // Idempotent insert: a requeued job re-runs this processor, so re-inserting
  // the same row id must not crash a retry.
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

  await job.reportProgress(backupJob!);

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

    const source = pgConnection(decrypt(database.url));
    const args = buildPgDumpArgs(dumpTarget, flags, source.url);

    const result = await runProcess("pg_dump", args, source.env);

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
