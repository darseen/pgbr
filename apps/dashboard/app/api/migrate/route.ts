import authorizeRequest from "@/lib/authorize-request";
import { ApiResponse } from "@/types";
import { db, migrationJobsTable } from "@repo/db";
import { enqueue, QUEUE_NAMES, subscribeJobEvents } from "@repo/queue";
import type { MigrateJobPayload } from "@repo/types";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

type MigrationStatusPayload = {
  backupStatus: unknown;
  restoreStatus: unknown;
};

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
      let closed = false;

      const sendEvent = (payload: ApiResponse<MigrationStatusPayload>) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
          );
        } catch {
          closed = true;
        }
      };

      const finish = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          // Already closed by the client disconnecting.
        }
      };

      // Subscribe before enqueueing, so a job that finishes immediately can't
      // complete in the gap between the insert and the listener attaching.
      let settle: () => void = () => {};
      const settled = new Promise<void>((resolve) => {
        settle = resolve;
      });

      const unsubscribe = subscribeJobEvents(async (event) => {
        if (event.jobId !== jobId) return;

        if (event.event === "progress") {
          sendEvent({
            error: null,
            data: event.data as MigrationStatusPayload,
          });
          return;
        }

        if (event.event === "completed") {
          sendEvent({
            error: null,
            data: { backupStatus: "completed", restoreStatus: "completed" },
          });
          settle();
          return;
        }

        // The event carries no message; the job's row holds the tool's stderr.
        const [row] = await db
          .select({ error: migrationJobsTable.error })
          .from(migrationJobsTable)
          .where(eq(migrationJobsTable.id, jobId));

        sendEvent({
          error: {
            message:
              row?.error ?? "Migration failed. No detailed logs available.",
          },
          data: null,
        });
        settle();
      });

      request.signal.addEventListener("abort", () => settle());

      try {
        const payload: MigrateJobPayload = {
          userId,
          sourceId: body.sourceId,
          targetId: body.targetId,
          sourceUrl: body.sourceUrl,
          targetUrl: body.targetUrl,
          backupFlags: body.backupFlags,
          restoreFlags: body.restoreFlags,
        };

        await enqueue(db, {
          id: jobId,
          queue: QUEUE_NAMES.migrate,
          userId,
          payload,
        });

        await settled;
      } catch (error) {
        console.error("Migration Job Setup Error:", error);
        sendEvent({
          error: { message: "Failed to start migration processes" },
          data: null,
        });
      } finally {
        unsubscribe();
        finish();
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
