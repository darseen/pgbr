import authorizeRequest from "@/lib/authorize-request";
import {
  getBackupQueue,
  getBackupQueueEvents,
  getMigrateQueue,
  getMigrateQueueEvents,
  getRestoreQueue,
  getRestoreQueueEvents,
} from "@/lib/queue";
import type { Queue } from "bullmq";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Per-user job-event stream: emits a lightweight signal whenever one of the
// caller's jobs changes state, so open pages can refresh their server-rendered
// data. This is how background (scheduled) jobs become visible without a
// manual reload. "progress" rather than "active" marks a job's start because
// the worker inserts the DB row first and calls updateProgress right after —
// by then a refresh has something new to render.
export async function GET(request: Request) {
  const { data, error: authError } = await authorizeRequest();
  if (authError) {
    return NextResponse.json(
      { error: { message: authError.message }, data: null },
      { status: 401 },
    );
  }
  const userId = data.user.id;

  // Queue events are instance-wide, so each one is matched back to its job to
  // see who owns it. Without this every user is told when anyone's job runs —
  // no data, but a timing signal that isn't theirs to see.
  async function ownsJob(queue: Queue, jobId: string) {
    try {
      const job = await queue.getJob(jobId);
      return job?.data?.userId === userId;
    } catch {
      return false;
    }
  }

  const queues = [
    ["backup", getBackupQueue(), getBackupQueueEvents()],
    ["restore", getRestoreQueue(), getRestoreQueueEvents()],
    ["migrate", getMigrateQueue(), getMigrateQueueEvents()],
  ] as const;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let closed = false;

      const send = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          cleanup();
        }
      };

      const listeners = queues.map(([queue, jobQueue, queueEvents]) => {
        const emit =
          (event: string) =>
          async ({ jobId }: { jobId: string }) => {
            if (closed) return;
            if (!(await ownsJob(jobQueue, jobId))) return;
            send(`data: ${JSON.stringify({ queue, event })}\n\n`);
          };
        const handlers = {
          progress: emit("progress"),
          completed: emit("completed"),
          failed: emit("failed"),
        };
        queueEvents.on("progress", handlers.progress);
        queueEvents.on("completed", handlers.completed);
        queueEvents.on("failed", handlers.failed);
        return { queueEvents, handlers };
      });

      // Comment frames keep the connection alive through proxies.
      const heartbeat = setInterval(() => send(": ping\n\n"), 25_000);

      function cleanup() {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        for (const { queueEvents, handlers } of listeners) {
          queueEvents.off("progress", handlers.progress);
          queueEvents.off("completed", handlers.completed);
          queueEvents.off("failed", handlers.failed);
        }
        try {
          controller.close();
        } catch {
          // Already closed by the client disconnecting.
        }
      }

      request.signal.addEventListener("abort", cleanup);
      send(": connected\n\n");
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
