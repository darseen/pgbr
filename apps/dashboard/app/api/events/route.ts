import authorizeRequest from "@/lib/authorize-request";
import {
  getBackupQueueEvents,
  getMigrateQueueEvents,
  getRestoreQueueEvents,
} from "@/lib/queue";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Global job-event stream: emits a lightweight signal whenever any job in
// any queue changes state, so open pages can refresh their server-rendered
// data. This is how background (scheduled) jobs become visible without a
// manual reload. "progress" rather than "active" marks a job's start because
// the worker inserts the DB row first and calls updateProgress right after —
// by then a refresh has something new to render.
export async function GET(request: Request) {
  const { error: authError } = await authorizeRequest();
  if (authError) {
    return NextResponse.json(
      { error: { message: authError.message }, data: null },
      { status: 401 },
    );
  }

  const queues = [
    ["backup", getBackupQueueEvents()],
    ["restore", getRestoreQueueEvents()],
    ["migrate", getMigrateQueueEvents()],
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

      const listeners = queues.map(([queue, queueEvents]) => {
        const emit = (event: string) => () => {
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
