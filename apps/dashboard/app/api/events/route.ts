import authorizeRequest from "@/lib/authorize-request";
import { subscribeJobEvents } from "@repo/queue";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Per-user job-event stream: emits a lightweight signal whenever one of the
// caller's jobs changes state, so open pages can refresh their server-rendered
// data. This is how background (scheduled) jobs become visible without a
// manual reload. "progress" rather than "active" marks a job's start because
// the worker inserts the DB row first and reports progress right after — by
// then a refresh has something new to render.
export async function GET(request: Request) {
  const { data, error: authError } = await authorizeRequest();
  if (authError) {
    return NextResponse.json(
      { error: { message: authError.message }, data: null },
      { status: 401 },
    );
  }
  const userId = data.user.id;

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

      // Events carry their owner, so the filter is a comparison rather than a
      // lookup per event. You're told when your own jobs move and nothing
      // else — another account's activity isn't even visible as a timing signal.
      const unsubscribe = subscribeJobEvents((event) => {
        if (event.userId !== userId) return;
        send(
          `data: ${JSON.stringify({ queue: event.queue, event: event.event })}\n\n`,
        );
      });

      // Comment frames keep the connection alive through proxies.
      const heartbeat = setInterval(() => send(": ping\n\n"), 25_000);

      function cleanup() {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
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
