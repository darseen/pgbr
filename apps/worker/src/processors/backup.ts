import { db, backupJobsTable, databasesTable } from "@repo/db";
import { decrypt } from "@repo/shared";
import { backupSchema, type BackupJobPayload } from "@repo/types";
import type { Job } from "bullmq";
import { and, eq, sql } from "drizzle-orm";
import { format } from "date-fns";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { getBackupsPath } from "../lib/paths.js";
import { buildPgDumpArgs, getDirectorySize } from "../lib/pg-args.js";
import { pruneScheduleBackups } from "../lib/retention.js";

export async function processBackup(job: Job<BackupJobPayload>) {
  const { jobId, userId, databaseId, scheduleId, flags: rawFlags } = job.data;

  // User-triggered jobs carry a dashboard-generated UUID; scheduled jobs
  // don't (BullMQ scheduler job ids look like "repeat:<id>:<ts>", unusable
  // as a filename suffix), so generate the row id here instead.
  const rowId = jobId ?? randomUUID();

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

  const extensionMap: Record<string, string> = {
    custom: "backup",
    plain: "sql",
    directory: "dir",
    tar: "tar",
  };

  // Sanitize the name so it can't inject path separators, use 24-hour time,
  // and suffix with the job id so concurrent backups of the same database
  // can never overwrite each other.
  const safeName = database.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
  const fileName = `${safeName}_${timestamp}_${rowId.slice(0, 8)}.${extensionMap[flags.format]}`;
  const backupDir = getBackupsPath();

  await fs.mkdir(backupDir, { recursive: true });
  const backupPath = path.join(backupDir, fileName);

  const [backupJob] = await db
    .insert(backupJobsTable)
    .values({
      id: rowId,
      databaseId: database.id,
      userId,
      scheduleId: scheduleId ?? null,
      databaseName: database.name,
      status: "running",
      backupPath,
      flags,
    })
    .returning();

  await job.updateProgress(backupJob!);

  const args = buildPgDumpArgs(backupPath, flags, decrypt(database.url));

  return new Promise((resolve, reject) => {
    const pgDumpProcess = spawn("pg_dump", args, {
      stdio: ["ignore", "ignore", "pipe"],
    });

    let errorOutput = "";

    pgDumpProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    pgDumpProcess.on("close", async (code) => {
      try {
        const finalStatus = code === 0 ? "completed" : "failed";

        let errorMessage: string | null = null;
        if (code !== 0) {
          errorMessage = errorOutput.trim()
            ? errorOutput.trim()
            : `pg_dump exited with code ${code} (No standard error output)`;
        }

        let size = 0;
        if (code === 0) {
          try {
            const stat = await fs.stat(backupPath);
            if (stat.isDirectory()) {
              size = await getDirectorySize(backupPath);
            } else {
              size = stat.size;
            }
          } catch (error) {
            console.error("Failed to calculate backup size", error);
          }
        }

        const [updatedJob] = await db
          .update(backupJobsTable)
          .set({
            status: finalStatus,
            error: errorMessage,
            completedAt: new Date().toISOString(),
            size,
          })
          .where(eq(backupJobsTable.id, rowId))
          .returning();

        if (code === 0) {
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
        }

        resolve(updatedJob);
      } catch (dbError) {
        reject(dbError);
      }
    });

    pgDumpProcess.on("error", async (err) => {
      try {
        await db
          .update(backupJobsTable)
          .set({
            status: "failed",
            error: err.message,
            completedAt: new Date().toISOString(),
          })
          .where(eq(backupJobsTable.id, rowId));
      } finally {
        reject(err);
      }
    });
  });
}
