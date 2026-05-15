import { db } from "@/db";
import {
  backupJobsTable,
  databasesTable,
  RestoreJob,
  restoreJobsTable,
} from "@/db/schema";
import { ApiResponse } from "@/types";
import { and, desc, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { buildPgRestoreArgs } from "../_utils";
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
        .from(restoreJobsTable)
        .where(
          and(
            eq(restoreJobsTable.databaseId, databaseId),
            eq(restoreJobsTable.userId, userId),
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
        .from(restoreJobsTable)
        .where(
          and(
            eq(restoreJobsTable.databaseName, databaseName),
            eq(restoreJobsTable.userId, userId),
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
      const restoreJobs = await db
        .select()
        .from(restoreJobsTable)
        .where(eq(restoreJobsTable.userId, userId))
        .orderBy(desc(restoreJobsTable.createdAt));

      return NextResponse.json({ data: { restoreJobs }, error: null });
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
  const { databaseId, backupJobId, backupPath, flags } = body;

  if (!databaseId) {
    return NextResponse.json(
      { error: { message: "Database ID is required" }, data: null },
      { status: 400 },
    );
  }

  if (!backupJobId && !backupPath) {
    return NextResponse.json(
      {
        error: { message: "Backup Job ID or custom path is required" },
        data: null,
      },
      { status: 400 },
    );
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

    let targetRestorePath = backupPath;

    if (backupJobId) {
      const [backupJob] = await db
        .select()
        .from(backupJobsTable)
        .where(
          and(
            eq(backupJobsTable.id, backupJobId),
            eq(backupJobsTable.userId, userId),
          ),
        );

      if (!backupJob) {
        return NextResponse.json(
          { error: { message: "Selected backup job not found" }, data: null },
          { status: 404 },
        );
      }
      targetRestorePath = backupJob.backupPath;
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const sendEvent = (
          payload: ApiResponse<{ restoreJob: RestoreJob }>,
        ) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
          );
        };

        const jobId = randomUUID();

        try {
          const isPlainSql = targetRestorePath.endsWith(".sql");
          let command = "pg_restore";
          let args: string[] = [];

          if (isPlainSql) {
            command = "psql";
            args = ["-d", database.url, "-f", targetRestorePath];
            if (flags.singleTransaction) args.unshift("-1");
            if (flags.exitOnError) args.unshift("-v", "ON_ERROR_STOP=1");
          } else {
            args = buildPgRestoreArgs(targetRestorePath, flags, database.url);
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

          sendEvent({ error: null, data: { restoreJob } });

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

              let errorMessage = null;
              if (code !== 0) {
                errorMessage = errorOutput.trim()
                  ? errorOutput.trim()
                  : `pg_restore exited with code ${code} (No standard error output)`;
              }

              const [updatedJob] = await db
                .update(restoreJobsTable)
                .set({
                  status: finalStatus,
                  error: errorMessage,
                  completedAt: new Date().toISOString(),
                })
                .where(eq(restoreJobsTable.id, jobId!))
                .returning();

              sendEvent({
                error: null,
                data: { restoreJob: updatedJob },
              });
            } catch (error) {
              console.error("Failed to update database after pg_dump", error);
              sendEvent({
                error: { message: "Failed to save final status" },
                data: null,
              });
            } finally {
              controller.close();
            }
          });

          restoreProcess.on("error", async (error) => {
            sendEvent({
              error: { message: error.message || `Failed to spawn ${command}` },
              data: null,
            });

            await db
              .update(restoreJobsTable)
              .set({
                status: "failed",
                error: error.message,
                completedAt: new Date().toISOString(),
              })
              .where(eq(restoreJobsTable.id, jobId));

            controller.close();
          });
        } catch (error: unknown) {
          console.error("Stream initialization error:", error);
          sendEvent({
            error: { message: "Internal error occurred during restore" },
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
      { error: { message: "Restore initialization failed" }, data: null },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { data, error: authError } = await authorizeRequest(request);

  if (authError) {
    return NextResponse.json(
      { error: { message: authError.message }, data: null },
      { status: 401 },
    );
  }
  const userId = data.user.id;

  const body = await request.json();
  const { ids } = body;

  if (!ids || !Array.isArray(ids || ids.length === 0)) {
    return NextResponse.json(
      { error: { message: "IDs array is required" }, data: null },
      { status: 400 },
    );
  }
  try {
    const restoreJobs = await db
      .select()
      .from(restoreJobsTable)
      .where(
        and(
          inArray(restoreJobsTable.id, ids),
          eq(restoreJobsTable.userId, userId),
        ),
      );

    if (restoreJobs.length === 0) {
      return NextResponse.json(
        { error: { message: "No restore jobs found" }, data: null },
        { status: 404 },
      );
    }
    const restoreJobsIds: string[] = [];

    restoreJobs.forEach((job) => {
      restoreJobsIds.push(job.id);
    });

    await db.delete(restoreJobsTable).where(inArray(restoreJobsTable.id, ids));

    return NextResponse.json({ data: { restoreJobsIds }, error: null });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: { message: "Internal server error" }, data: null },
      { status: 500 },
    );
  }
}
