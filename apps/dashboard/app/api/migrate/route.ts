import { db } from "@/db";
import { databasesTable, migrationJobsTable } from "@/db/schema";
import { migrationSchema } from "@/lib/zod/migration";
import { ApiResponse, BackupFlags, RestoreFlags } from "@/types";
import { and, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { decrypt, encrypt } from "../../../utils/encryption";
import { buildPgDumpArgs, buildPgRestoreArgs } from "../_utils";
import authorizeRequest from "../_utils/authorize-request";

type DatabaseData = { url: string; name: string | null; id: string | null };

export async function POST(request: NextRequest) {
  const { data, error: authError } = await authorizeRequest();

  if (authError) {
    return NextResponse.json(
      { error: { message: authError.message }, data: null },
      { status: 401 },
    );
  }

  const userId = data.user.id;
  const body = await request.json();

  const migrationData = {
    sourceId: body.sourceId,
    targetId: body.targetId,
    sourceUrl: body.sourceUrl,
    targetUrl: body.targetUrl,
    backupFlags: body.backupFlags,
    restoreFlags: body.restoreFlags,
  };

  const result = migrationSchema.safeParse(migrationData);

  if (!result.success) {
    return NextResponse.json(
      { error: { message: result.error.issues[0].message }, data: null },
      { status: 400 },
    );
  }

  try {
    const sourceDb: DatabaseData | null = await getDbUrl({
      databaseId: result.data.sourceId,
      databaseUrl: result.data.sourceUrl,
    });
    const targetDb: DatabaseData | null = await getDbUrl({
      databaseId: result.data.targetId,
      databaseUrl: result.data.targetUrl,
    });

    if (!sourceDb)
      return NextResponse.json(
        { error: { message: "Source database is required" }, data: null },
        { status: 404 },
      );

    if (!targetDb)
      return NextResponse.json(
        { error: { message: "Target database is required" }, data: null },
        { status: 404 },
      );

    if (sourceDb.url === targetDb.url)
      return NextResponse.json(
        {
          error: { message: "Source and target databases cannot be the same" },
          data: null,
        },
        { status: 400 },
      );

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const sendEvent = (
          payload: ApiResponse<{ backupStatus: string; restoreStatus: string }>,
        ) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
          );
        };

        const jobId = randomUUID();

        try {
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

          sendEvent({
            error: null,
            data: { backupStatus: "running", restoreStatus: "running" },
          });

          const safeBackupFlags: BackupFlags = {
            ...result.data.backupFlags,
            format: "custom",
            jobs: 1,
          };
          const safeRestoreFlags: RestoreFlags = {
            ...result.data.restoreFlags,
            jobs: 1,
          };

          const dumpArgs = buildPgDumpArgs(null, safeBackupFlags, sourceDb.url);

          const restoreArgs = buildPgRestoreArgs(
            "",
            safeRestoreFlags,
            targetDb.url,
          ).filter((arg) => arg !== "");

          const dumpProcess = spawn("pg_dump", dumpArgs, {
            stdio: ["ignore", "pipe", "pipe"],
          });

          const restoreProcess = spawn("pg_restore", restoreArgs, {
            stdio: ["pipe", "ignore", "pipe"],
          });

          let dumpErrorOutput = "";
          let restoreErrorOutput = "";

          dumpProcess.stderr.on(
            "data",
            (d) => (dumpErrorOutput += d.toString()),
          );
          restoreProcess.stderr.on(
            "data",
            (d) => (restoreErrorOutput += d.toString()),
          );

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
                l.toLowerCase().includes("error:") ||
                l.toLowerCase().includes("fatal:"),
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

            const finalStatus =
              dumpSuccess && restoreSuccess ? "completed" : "failed";

            const errorMessages = [];

            const cleanDumpError = extractErrorLog(dumpErrorOutput);
            const cleanRestoreError = extractErrorLog(restoreErrorOutput);

            if (!dumpSuccess && cleanDumpError)
              errorMessages.push(cleanDumpError);
            if (!restoreSuccess && cleanRestoreError)
              errorMessages.push(cleanRestoreError);

            let combinedError =
              errorMessages.length > 0 ? errorMessages.join("\n\n") : null;

            if (combinedError && combinedError.length > 3000) {
              combinedError =
                combinedError.substring(0, 3000) + "... (truncated)";
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
                sendEvent({
                  error: {
                    // Send the actual combinedError so the UI can display it
                    message:
                      combinedError ||
                      "Migration failed. No detailed logs available.",
                  },
                  data: null,
                });
              } else {
                sendEvent({
                  error: null,
                  data: {
                    backupStatus: "completed",
                    restoreStatus: "completed",
                  },
                });
              }
            } catch (error) {
              console.error(
                "Failed to update migration job final status",
                error,
              );
              sendEvent({
                error: { message: "Failed to save final status to database" },
                data: null,
              });
            } finally {
              controller.close();
            }
          };

          dumpProcess.on("close", (code) => {
            dumpClosed = true;
            dumpCode = code;
            // If pg_dump closes early, close pg_restore's stdin to finish it gracefully
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
        } catch (error) {
          console.error("Migration Job Setup Error:", error);
          sendEvent({
            error: { message: "Failed to start migration processes" },
            data: null,
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: { message: "Internal server error" }, data: null },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { data, error: authError } = await authorizeRequest();

  if (authError) {
    return NextResponse.json(
      { error: { message: authError.message }, data: null },
      { status: 401 },
    );
  }

  const userId = data.user.id;
  const body = await request.json();

  const { ids } = body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { error: { message: "IDs array is required" }, data: null },
      { status: 400 },
    );
  }

  try {
    const migrationJobs = await db
      .select()
      .from(migrationJobsTable)
      .where(
        and(
          inArray(migrationJobsTable.id, ids),
          eq(migrationJobsTable.userId, userId),
        ),
      );

    if (migrationJobs.length === 0) {
      return NextResponse.json(
        { error: { message: "No migration jobs found" }, data: null },
        { status: 404 },
      );
    }
    const migrationJobsIds: string[] = migrationJobs.map((job) => job.id);

    await db
      .delete(migrationJobsTable)
      .where(
        and(
          inArray(migrationJobsTable.id, ids),
          eq(migrationJobsTable.userId, userId),
        ),
      );

    return NextResponse.json({ data: { migrationJobsIds }, error: null });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: { message: "Internal server error" }, data: null },
      { status: 500 },
    );
  }
}

async function getDbUrl({
  databaseId,
  databaseUrl,
}: {
  databaseId?: string;
  databaseUrl?: string;
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
