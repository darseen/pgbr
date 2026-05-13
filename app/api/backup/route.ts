import { DEFAULT_BACKUP_FLAGS } from "@/constants";
import { db } from "@/db";
import { BackupJob, backupJobsTable, databasesTable } from "@/db/schema";
import { ApiResponse, BackupFlags } from "@/types";
import { getPgbrDataPath } from "@/utils";
import { format } from "date-fns";
import { and, desc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { buildPgDumpArgs } from "../_utils";
import authorizeRequest from "../_utils/authorize-request";

export async function GET(request: NextRequest) {
  const { data, error: authError } = await authorizeRequest(request);

  if (authError) {
    return NextResponse.json(
      { error: { message: authError.message }, data: null },
      { status: 401 },
    );
  }
  const userId = data.user.id;

  const searchParams = request.nextUrl.searchParams;
  const databaseId = searchParams.get("id") as string;
  const databaseName = searchParams.get("name") as string;

  try {
    if (databaseId) {
      const [database] = await db
        .select()
        .from(backupJobsTable)
        .where(
          and(
            eq(backupJobsTable.databaseId, databaseId),
            eq(backupJobsTable.userId, userId),
          ),
        );

      if (!database) {
        return NextResponse.json(
          { error: { message: "Database not found" }, data: null },
          { status: 404 },
        );
      }

      return NextResponse.json({ data: { database }, error: null });
    } else if (databaseName) {
      const [database] = await db
        .select()
        .from(backupJobsTable)
        .where(
          and(
            eq(backupJobsTable.databaseName, databaseName),
            eq(backupJobsTable.userId, userId),
          ),
        );

      if (!database) {
        return NextResponse.json(
          { error: { message: "Database not found" }, data: null },
          { status: 404 },
        );
      }

      return NextResponse.json({ data: { database }, error: null });
    } else {
      const backupJobs = await db
        .select()
        .from(backupJobsTable)
        .where(eq(backupJobsTable.userId, userId))
        .orderBy(desc(backupJobsTable.createdAt));

      return NextResponse.json({ data: { backupJobs }, error: null });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: { message: "Internal server error" }, data: null },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const { data, error: authError } = await authorizeRequest(request);

  if (authError) {
    return NextResponse.json(
      { error: { message: authError.message }, data: null },
      { status: 401 },
    );
  }
  const userId = data.user.id;

  const body = await request.json();
  const databaseId = body.databaseId as string | undefined;
  let flags = body.flags as BackupFlags | undefined;

  if (!databaseId) {
    return NextResponse.json(
      { error: { message: "Database ID is required" }, data: null },
      { status: 400 },
    );
  } else if (!flags) {
    flags = DEFAULT_BACKUP_FLAGS;
  }

  try {
    const [database] = await db
      .select()
      .from(databasesTable)
      .where(
        and(
          eq(databasesTable.id, databaseId),
          eq(databasesTable.userId, userId),
        ),
      );

    if (!database) {
      return NextResponse.json(
        { error: { message: "Database not found" }, data: null },
        { status: 404 },
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const sendEvent = (payload: ApiResponse<{ backupJob: BackupJob }>) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
          );
        };

        const jobId = randomUUID();

        try {
          const extensionMap: Record<string, string> = {
            custom: "backup",
            plain: "sql",
            directory: "dir",
            tar: "tar",
          };

          const fileName = `${database.name}_${format(new Date(), "yyyy-MM-dd hh:mm:ss").replace(" ", "-")}.${extensionMap[flags.format]}`;
          const backupDir = path.join(getPgbrDataPath(), "backups");

          await fs.mkdir(backupDir, { recursive: true });
          const backupPath = path.join(backupDir, fileName);

          const [backupJob] = await db
            .insert(backupJobsTable)
            .values({
              id: jobId,
              databaseId: database.id,
              userId,
              databaseName: database.name,
              status: "running",
              backupPath: backupPath,
              flags,
            })
            .returning();

          sendEvent({ error: null, data: { backupJob } });

          const args = buildPgDumpArgs(backupPath, flags, database.url);

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

              let errorMessage = null;
              if (code !== 0) {
                errorMessage = errorOutput.trim()
                  ? errorOutput.trim()
                  : `pg_dump exited with code ${code} (No standard error output)`;
              }

              const [[updatedJob]] = await Promise.all([
                db
                  .update(backupJobsTable)
                  .set({
                    status: finalStatus,
                    error: errorMessage,
                    completedAt: new Date().toISOString(),
                  })
                  .where(eq(backupJobsTable.id, jobId!))
                  .returning(),
                db
                  .update(databasesTable)
                  .set({
                    backupCount: sql`${databasesTable.backupCount} + 1`,
                  })
                  .where(eq(databasesTable.id, databaseId)),
              ]);

              sendEvent({
                error: null,
                data: { backupJob: updatedJob },
              });
            } catch (dbError) {
              console.error("Failed to update database after pg_dump", dbError);
              sendEvent({
                error: { message: "Failed to save final status" },
                data: null,
              });
            } finally {
              controller.close();
            }
          });

          pgDumpProcess.on("error", async (err) => {
            sendEvent({
              error: { message: err.message || "Failed to spawn pg_dump" },
              data: null,
            });

            await db
              .update(backupJobsTable)
              .set({
                status: "failed",
                error: err.message,
                completedAt: new Date().toISOString(),
              })
              .where(eq(backupJobsTable.id, jobId));

            controller.close();
          });
        } catch (error: unknown) {
          console.error("Stream initialization error:", error);
          sendEvent({
            error: { message: "Internal error occurred" },
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
      { error: { message: "Backup initialization failed" }, data: null },
      { status: 500 },
    );
  }
}
