import { db, backupJobsTable, databasesTable, restoreJobsTable } from "@repo/db";
import { decrypt } from "@repo/shared";
import { CUSTOM_UPLOADS_PREFIX, getStore } from "@repo/storage";
import { restoreSchema, type RestoreJobPayload } from "@repo/types";
import type { Job } from "bullmq";
import { and, eq } from "drizzle-orm";
import path from "node:path";
import { untarToDir } from "../lib/archive.js";
import { buildPgRestoreArgs } from "../lib/pg-args.js";
import { cleanupScratch, createScratchDir } from "../lib/paths.js";
import { runProcess } from "../lib/run-process.js";

export async function processRestore(job: Job<RestoreJobPayload>) {
  const { jobId, userId, databaseId, backupJobId, customKey, flags: rawFlags } =
    job.data;

  if (!backupJobId && !customKey) {
    throw new Error("A tracked backup or a custom source is required");
  }

  const flagResult = restoreSchema.safeParse(rawFlags ?? {});
  if (!flagResult.success) {
    throw new Error(flagResult.error.issues[0]?.message ?? "Invalid restore flags");
  }
  const flags = flagResult.data;

  const [database] = await db
    .select()
    .from(databasesTable)
    .where(and(eq(databasesTable.id, databaseId), eq(databasesTable.userId, userId)));

  if (!database) {
    throw new Error("Database not found");
  }

  const store = await getStore();

  // Resolve which object to restore from and whether it's a collapsed
  // directory-format tarball that must be expanded before restore.
  let storageKey: string;
  let sourceFormat: string | undefined = flags.format;

  if (backupJobId) {
    const [backupJob] = await db
      .select()
      .from(backupJobsTable)
      .where(and(eq(backupJobsTable.id, backupJobId), eq(backupJobsTable.userId, userId)));

    if (!backupJob) {
      throw new Error("Selected backup job not found");
    }
    storageKey = backupJob.storageKey;
    sourceFormat = backupJob.flags?.format ?? flags.format;
  } else {
    // Custom source: a user-uploaded object. Validate the reference before use.
    storageKey = customKey!;
    if (!(await store.objectExists(storageKey))) {
      throw new Error("Custom source not found in storage");
    }
  }

  const [restoreJob] = await db
    .insert(restoreJobsTable)
    .values({
      id: jobId,
      databaseId: database.id,
      userId,
      databaseName: database.name,
      status: "running",
      storageKey,
      flags,
    })
    .onConflictDoUpdate({
      target: restoreJobsTable.id,
      set: { status: "running", storageKey, error: null, completedAt: null },
    })
    .returning();

  await job.updateProgress(restoreJob!);

  const scratchDir = await createScratchDir("pgbr-restore-");
  try {
    const downloadPath = path.join(scratchDir, path.basename(storageKey));
    await store.downloadToFile(storageKey, downloadPath);

    // Directory-format artifacts are tarballs; expand into a directory that
    // pg_restore -Fd can read. Everything else restores from the file directly.
    let targetRestorePath = downloadPath;
    if (sourceFormat === "directory") {
      targetRestorePath = await untarToDir(
        downloadPath,
        path.join(scratchDir, "extract"),
      );
    }

    const dbUrl = decrypt(database.url);
    const isPlainSql = downloadPath.endsWith(".sql");

    let command = "pg_restore";
    let args: string[];
    if (isPlainSql) {
      command = "psql";
      args = ["-d", dbUrl, "-f", targetRestorePath];
      if (flags.singleTransaction) args.unshift("-1");
      if (flags.exitOnError) args.unshift("-v", "ON_ERROR_STOP=1");
    } else {
      args = buildPgRestoreArgs(targetRestorePath, flags, dbUrl);
    }

    const result = await runProcess(command, args);

    if (result.code !== 0) {
      throw new Error(
        result.stderr.trim()
          ? result.stderr.trim()
          : `${command} exited with code ${result.code} (No standard error output)`,
      );
    }

    const [updatedJob] = await db
      .update(restoreJobsTable)
      .set({ status: "completed", error: null, completedAt: new Date().toISOString() })
      .where(eq(restoreJobsTable.id, jobId))
      .returning();

    return updatedJob;
  } catch (err) {
    // Any failure after the row exists (download, extract, spawn, non-zero
    // exit) must be recorded so the row never stays stuck in "running".
    await db
      .update(restoreJobsTable)
      .set({
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
        completedAt: new Date().toISOString(),
      })
      .where(eq(restoreJobsTable.id, jobId));
    throw err;
  } finally {
    // A custom-uploaded source is a throwaway; remove it once consumed.
    if (storageKey.startsWith(CUSTOM_UPLOADS_PREFIX)) {
      try {
        await store.deleteObject(storageKey);
      } catch (cleanupErr) {
        console.error("Failed to delete custom restore source", cleanupErr);
      }
    }
    await cleanupScratch(scratchDir);
  }
}
