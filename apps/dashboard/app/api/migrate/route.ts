import authorizeRequest from "@/lib/authorize-request";
import { getMigrateQueue, getMigrateQueueEvents } from "@/lib/queue";
import { ApiResponse } from "@/types";
import type { MigrateJobPayload } from "@repo/types";
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
  const jobId = randomUUID();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      type MigrationStatusPayload = {
        backupStatus: unknown;
        restoreStatus: unknown;
      };

      const sendEvent = (payload: ApiResponse<MigrationStatusPayload>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        );
      };

      const queueEvents = getMigrateQueueEvents();
      const onProgress = ({
        jobId: progressJobId,
        data: progressData,
      }: {
        jobId: string;
        data: unknown;
      }) => {
        if (progressJobId === jobId) {
          sendEvent({
            error: null,
            data: progressData as MigrationStatusPayload,
          });
        }
      };

      try {
        const payload: MigrateJobPayload = {
          jobId,
          userId,
          sourceId: body.sourceId,
          targetId: body.targetId,
          sourceUrl: body.sourceUrl,
          targetUrl: body.targetUrl,
          backupFlags: body.backupFlags,
          restoreFlags: body.restoreFlags,
        };

        const job = await getMigrateQueue().add("migrate", payload, {
          jobId,
        });

        queueEvents.on("progress", onProgress);

        try {
          const result = await job.waitUntilFinished(queueEvents);
          sendEvent({ error: null, data: result as MigrationStatusPayload });
        } catch (jobError) {
          sendEvent({
            error: {
              message:
                jobError instanceof Error
                  ? jobError.message
                  : "Migration failed. No detailed logs available.",
            },
            data: null,
          });
        } finally {
          controller.close();
        }
      } catch (error) {
        console.error("Migration Job Setup Error:", error);
        sendEvent({
          error: { message: "Failed to start migration processes" },
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
