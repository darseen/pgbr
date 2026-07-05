import authorizeRequest from "@/lib/authorize-request";
import { getRestoreQueue, getRestoreQueueEvents } from "@/lib/queue";
import { ApiResponse } from "@/types";
import type { RestoreJobPayload } from "@repo/types";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

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
  const { databaseId, backupJobId, backupPath } = body;

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

  const jobId = randomUUID();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (payload: ApiResponse<{ restoreJob: unknown }>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        );
      };

      const queueEvents = getRestoreQueueEvents();
      const onProgress = ({
        jobId: progressJobId,
        data: progressData,
      }: {
        jobId: string;
        data: unknown;
      }) => {
        if (progressJobId === jobId) {
          sendEvent({ error: null, data: { restoreJob: progressData } });
        }
      };

      try {
        const payload: RestoreJobPayload = {
          jobId,
          userId,
          databaseId,
          backupJobId,
          backupPath,
          flags: body.flags,
        };

        const job = await getRestoreQueue().add("restore", payload, {
          jobId,
        });

        queueEvents.on("progress", onProgress);

        try {
          const result = await job.waitUntilFinished(queueEvents);
          sendEvent({ error: null, data: { restoreJob: result } });
        } catch (jobError) {
          sendEvent({
            error: {
              message:
                jobError instanceof Error
                  ? jobError.message
                  : "Failed to run restore",
            },
            data: null,
          });
        } finally {
          controller.close();
        }
      } catch (error) {
        console.error("Stream initialization error:", error);
        sendEvent({
          error: { message: "Internal error occurred during restore" },
          data: null,
        });
        controller.close();
      } finally {
        queueEvents.off("progress", onProgress);
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
}
