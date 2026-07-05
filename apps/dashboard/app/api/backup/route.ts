import authorizeRequest from "@/lib/authorize-request";
import { getBackupQueue, getBackupQueueEvents } from "@/lib/queue";
import { ApiResponse } from "@/types";
import type { BackupJobPayload } from "@repo/types";
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
  const databaseId = body.databaseId as string | undefined;

  if (!databaseId) {
    return NextResponse.json(
      { error: { message: "Database ID is required" }, data: null },
      { status: 400 },
    );
  }

  const jobId = randomUUID();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (payload: ApiResponse<{ backupJob: unknown }>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        );
      };

      const queueEvents = getBackupQueueEvents();
      const onProgress = ({
        jobId: progressJobId,
        data: progressData,
      }: {
        jobId: string;
        data: unknown;
      }) => {
        if (progressJobId === jobId) {
          sendEvent({ error: null, data: { backupJob: progressData } });
        }
      };

      try {
        const payload: BackupJobPayload = {
          jobId,
          userId,
          databaseId,
          flags: body.flags,
        };

        const job = await getBackupQueue().add("backup", payload, { jobId });

        queueEvents.on("progress", onProgress);

        try {
          const result = await job.waitUntilFinished(queueEvents);
          sendEvent({ error: null, data: { backupJob: result } });
        } catch (jobError) {
          sendEvent({
            error: {
              message:
                jobError instanceof Error
                  ? jobError.message
                  : "Failed to run backup",
            },
            data: null,
          });
        } finally {
          controller.close();
        }
      } catch (error) {
        console.error("Stream initialization error:", error);
        sendEvent({
          error: { message: "Internal error occurred" },
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
