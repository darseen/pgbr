import { db, backupJobsTable, databasesTable, restoreJobsTable } from "@repo/db";
import { decrypt } from "@repo/shared";
import { restoreSchema, type RestoreJobPayload } from "@repo/types";
import type { Job } from "bullmq";
import { and, eq } from "drizzle-orm";
import { spawn } from "node:child_process";
import path from "node:path";
import { getPgbrDataPath } from "../lib/paths.js";
import { buildPgRestoreArgs } from "../lib/pg-args.js";

// Client-supplied custom paths must stay inside the pgbr data directory so
// the restore job can't be pointed at arbitrary files on the worker.
function assertInsideDataDir(candidate: string) {
  const dataDir = path.resolve(getPgbrDataPath());
  const resolved = path.resolve(candidate);

  if (resolved !== dataDir && !resolved.startsWith(dataDir + path.sep)) {
    throw new Error(
      `Custom backup path must be inside the pgbr data directory (${dataDir})`,
    );
  }
}

export async function processRestore(job: Job<RestoreJobPayload>) {
  const { jobId, userId, databaseId, backupJobId, backupPath, flags: rawFlags } =
    job.data;

  if (!backupJobId && !backupPath) {
    throw new Error("Backup Job ID or custom path is required");
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

  let targetRestorePath = backupPath;
  if (targetRestorePath) assertInsideDataDir(targetRestorePath);

  if (backupJobId) {
    const [backupJob] = await db
      .select()
      .from(backupJobsTable)
      .where(and(eq(backupJobsTable.id, backupJobId), eq(backupJobsTable.userId, userId)));

    if (!backupJob) {
      throw new Error("Selected backup job not found");
    }
    targetRestorePath = backupJob.backupPath;
  }

  if (!targetRestorePath) {
    throw new Error("Backup Job ID or custom path is required");
  }

  const [restoreJob] = await db
    .insert(restoreJobsTable)
    .values({
      id: jobId,
      databaseId: database.id,
      userId,
      databaseName: database.name,
      status: "running",
      backupPath: targetRestorePath,
      flags,
    })
    .returning();

  await job.updateProgress(restoreJob!);

  const dbUrl = decrypt(database.url);
  const isPlainSql = targetRestorePath.endsWith(".sql");
  let command = "pg_restore";
  let args: string[] = [];

  if (isPlainSql) {
    command = "psql";
    args = ["-d", dbUrl, "-f", targetRestorePath];
    if (flags.singleTransaction) args.unshift("-1");
    if (flags.exitOnError) args.unshift("-v", "ON_ERROR_STOP=1");
  } else {
    args = buildPgRestoreArgs(targetRestorePath, flags, dbUrl);
  }

  return new Promise((resolve, reject) => {
    const restoreProcess = spawn(command, args, {
      stdio: ["ignore", "ignore", "pipe"],
    });

    let errorOutput = "";

    restoreProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    restoreProcess.on("close", async (code) => {
      try {
        const finalStatus = code === 0 ? "completed" : "failed";

        let errorMessage: string | null = null;
        if (code !== 0) {
          errorMessage = errorOutput.trim()
            ? errorOutput.trim()
            : `${command} exited with code ${code} (No standard error output)`;
        }

        const [updatedJob] = await db
          .update(restoreJobsTable)
          .set({
            status: finalStatus,
            error: errorMessage,
            completedAt: new Date().toISOString(),
          })
          .where(eq(restoreJobsTable.id, jobId))
          .returning();

        resolve(updatedJob);
      } catch (dbError) {
        reject(dbError);
      }
    });

    restoreProcess.on("error", async (err) => {
      try {
        await db
          .update(restoreJobsTable)
          .set({
            status: "failed",
            error: err.message,
            completedAt: new Date().toISOString(),
          })
          .where(eq(restoreJobsTable.id, jobId));
      } finally {
        reject(err);
      }
    });
  });
}
