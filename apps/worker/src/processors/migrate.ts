import { db, databasesTable, migrationJobsTable } from "@repo/db";
import { decrypt, encrypt } from "@repo/shared";
import { migrationSchema, type MigrateJobPayload } from "@repo/types";
import type { Job } from "bullmq";
import { eq } from "drizzle-orm";
import { spawn } from "node:child_process";
import { buildPgDumpArgs, buildPgRestoreArgs } from "../lib/pg-args.js";

type DatabaseData = { url: string; name: string | null; id: string | null };

async function getDbUrl({
  databaseId,
  databaseUrl,
}: {
  databaseId?: string | undefined;
  databaseUrl?: string | undefined;
}): Promise<DatabaseData | null> {
  if (databaseId && databaseId !== "custom") {
    const [database] = await db
      .select()
      .from(databasesTable)
      .where(eq(databasesTable.id, databaseId));

    if (!database) return null;

    return {
      url: decrypt(database.url),
      name: database.name,
      id: database.id,
    };
  } else if (databaseUrl) {
    return {
      url: databaseUrl,
      name: null,
      id: null,
    };
  } else {
    return null;
  }
}

export async function processMigrate(job: Job<MigrateJobPayload>) {
  const { jobId, userId, sourceId, targetId, sourceUrl, targetUrl, backupFlags, restoreFlags } =
    job.data;

  const result = migrationSchema.safeParse({
    sourceId,
    targetId,
    sourceUrl,
    targetUrl,
    backupFlags,
    restoreFlags,
  });

  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Invalid migration request");
  }

  const sourceDb = await getDbUrl({
    databaseId: result.data.sourceId,
    databaseUrl: result.data.sourceUrl,
  });
  const targetDb = await getDbUrl({
    databaseId: result.data.targetId,
    databaseUrl: result.data.targetUrl,
  });

  if (!sourceDb) throw new Error("Source database is required");
  if (!targetDb) throw new Error("Target database is required");
  if (sourceDb.url === targetDb.url) {
    throw new Error("Source and target databases cannot be the same");
  }

  await db.insert(migrationJobsTable).values({
    id: jobId,
    userId,
    targetDatabaseId: targetDb.id,
    sourceDatabaseId: sourceDb.id,
    sourceDatabaseUrl: encrypt(sourceDb.url),
    targetDatabaseUrl: encrypt(targetDb.url),
    sourceDatabaseName: sourceDb.name,
    targetDatabaseName: targetDb.name,
    backupFlags: result.data.backupFlags,
    restoreFlags: result.data.restoreFlags,
    status: "running",
  });

  await job.updateProgress({ backupStatus: "running", restoreStatus: "running" });

  const safeBackupFlags = { ...result.data.backupFlags, format: "custom" as const, jobs: 1 };
  const safeRestoreFlags = { ...result.data.restoreFlags, jobs: 1 };

  const dumpArgs = buildPgDumpArgs(null, safeBackupFlags, sourceDb.url);
  const restoreArgs = buildPgRestoreArgs("", safeRestoreFlags, targetDb.url).filter(
    (arg) => arg !== "",
  );

  return new Promise((resolve, reject) => {
    const dumpProcess = spawn("pg_dump", dumpArgs, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    const restoreProcess = spawn("pg_restore", restoreArgs, {
      stdio: ["pipe", "ignore", "pipe"],
    });

    let dumpErrorOutput = "";
    let restoreErrorOutput = "";

    dumpProcess.stderr.on("data", (d) => (dumpErrorOutput += d.toString()));
    restoreProcess.stderr.on("data", (d) => (restoreErrorOutput += d.toString()));

    dumpProcess.stdout.pipe(restoreProcess.stdin);

    dumpProcess.stdout.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code !== "EPIPE") {
        console.error("pg_dump stdout error:", err);
      }
    });

    let dumpClosed = false;
    let restoreClosed = false;
    let dumpCode: number | null = null;
    let restoreCode: number | null = null;
    let isFinalizing = false;

    const extractErrorLog = (log: string) => {
      if (!log.trim()) return "";
      const lines = log.split(/\r?\n/);
      const errorLines = lines.filter(
        (l) =>
          l.toLowerCase().includes("error:") || l.toLowerCase().includes("fatal:"),
      );

      if (errorLines.length > 0) {
        return errorLines.join("\n");
      }

      return null;
    };

    const checkCompletion = async () => {
      if (!dumpClosed || !restoreClosed) return;
      if (isFinalizing) return;
      isFinalizing = true;

      const dumpSuccess = dumpCode === 0;
      const restoreSuccess = restoreCode === 0;

      const finalStatus = dumpSuccess && restoreSuccess ? "completed" : "failed";

      const errorMessages: string[] = [];

      const cleanDumpError = extractErrorLog(dumpErrorOutput);
      const cleanRestoreError = extractErrorLog(restoreErrorOutput);

      if (!dumpSuccess && cleanDumpError) errorMessages.push(cleanDumpError);
      if (!restoreSuccess && cleanRestoreError) errorMessages.push(cleanRestoreError);

      let combinedError = errorMessages.length > 0 ? errorMessages.join("\n\n") : null;

      if (combinedError && combinedError.length > 3000) {
        combinedError = combinedError.substring(0, 3000) + "... (truncated)";
      }

      try {
        await db
          .update(migrationJobsTable)
          .set({
            status: finalStatus,
            error: combinedError,
            completedAt: new Date().toISOString(),
          })
          .where(eq(migrationJobsTable.id, jobId));

        if (finalStatus === "failed") {
          reject(
            new Error(combinedError || "Migration failed. No detailed logs available."),
          );
        } else {
          resolve({ backupStatus: "completed", restoreStatus: "completed" });
        }
      } catch (error) {
        reject(error);
      }
    };

    dumpProcess.on("close", (code) => {
      dumpClosed = true;
      dumpCode = code;
      if (!restoreClosed) {
        restoreProcess.stdin.end();
      }
      checkCompletion();
    });

    restoreProcess.on("close", (code) => {
      restoreClosed = true;
      restoreCode = code;
      if (!dumpClosed) {
        dumpProcess.kill();
      }
      checkCompletion();
    });

    dumpProcess.on("error", (err) => {
      dumpErrorOutput += `Spawn Error: ${err.message}`;
      dumpClosed = true;
      if (!restoreClosed) restoreProcess.stdin.end();
      checkCompletion();
    });

    restoreProcess.on("error", (err) => {
      restoreErrorOutput += `Spawn Error: ${err.message}`;
      restoreClosed = true;
      if (!dumpClosed) dumpProcess.kill();
      checkCompletion();
    });
  });
}
