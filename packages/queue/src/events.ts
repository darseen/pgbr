import { db } from "@repo/db";
import { sql } from "drizzle-orm";
import pg from "pg";
import type { JobEvent, QueueName } from "./types.js";

const JOBS_CHANNEL = "pgbr_jobs";
const EVENTS_CHANNEL = "pgbr_events";

/** NOTIFY caps payloads at 8000 bytes. */
const MAX_PAYLOAD = 7000;

type Handler = (payload: string) => void;

/**
 * One connection per process, LISTENing on both channels and fanning out
 * in-process. LISTEN occupies its connection for as long as it holds the
 * subscription, so this deliberately sits outside the shared pool.
 */
class PgListener {
  private client: pg.Client | null = null;
  private connecting: Promise<void> | null = null;
  private handlers = new Map<string, Set<Handler>>([
    [JOBS_CHANNEL, new Set()],
    [EVENTS_CHANNEL, new Set()],
  ]);
  private retryDelay = 1000;
  private closed = false;

  subscribe(channel: string, handler: Handler): () => void {
    const handlers = this.handlers.get(channel);
    if (!handlers) throw new Error(`Unknown channel: ${channel}`);

    handlers.add(handler);
    void this.ensureConnected();

    return () => {
      handlers.delete(handler);
    };
  }

  private ensureConnected(): Promise<void> {
    if (this.closed || this.client) return Promise.resolve();
    if (this.connecting) return this.connecting;

    this.connecting = this.connect()
      .catch((err) => {
        console.error("Event listener failed to connect:", err);
        this.scheduleReconnect();
      })
      .finally(() => {
        this.connecting = null;
      });

    return this.connecting;
  }

  private async connect() {
    const client = new pg.Client({
      connectionString: process.env.DATABASE_URL,
    });
    let dead = false;

    const die = (err?: Error) => {
      if (dead) return;
      dead = true;
      if (err) console.error("Event listener connection lost:", err.message);
      if (this.client === client) this.client = null;
      client.removeAllListeners();
      void client.end().catch(() => {});
      this.scheduleReconnect();
    };

    client.on("notification", (message) => {
      const handlers = this.handlers.get(message.channel);
      if (!handlers) return;
      for (const handler of handlers) {
        try {
          handler(message.payload ?? "");
        } catch (err) {
          console.error("Event handler threw:", err);
        }
      }
    });
    client.on("error", die);
    client.on("end", () => die());

    await client.connect();
    await client.query(`LISTEN ${JOBS_CHANNEL}`);
    await client.query(`LISTEN ${EVENTS_CHANNEL}`);

    this.client = client;
    this.retryDelay = 1000;
  }

  private scheduleReconnect() {
    if (this.closed) return;
    // Nothing is listening; reconnect lazily on the next subscribe instead.
    const listeners = [...this.handlers.values()].reduce(
      (n, set) => n + set.size,
      0,
    );
    if (listeners === 0) return;

    const delay = this.retryDelay;
    this.retryDelay = Math.min(delay * 2, 30_000);
    setTimeout(() => void this.ensureConnected(), delay).unref?.();
  }

  async close() {
    this.closed = true;
    const client = this.client;
    this.client = null;
    if (client) {
      client.removeAllListeners();
      await client.end().catch(() => {});
    }
  }
}

// Cached on globalThis so Next.js HMR reuses one connection instead of opening
// a new one per reload.
const globalForListener = globalThis as unknown as {
  __pgbrListener?: PgListener;
};

function listener(): PgListener {
  return (globalForListener.__pgbrListener ??= new PgListener());
}

/**
 * Announce a job state change. Best-effort: an event is a hint to refresh, and
 * losing one is never worth failing the job that produced it.
 */
export async function publishJobEvent(event: JobEvent) {
  let payload = JSON.stringify(event);
  if (payload.length > MAX_PAYLOAD) {
    payload = JSON.stringify({ ...event, data: undefined });
  }

  try {
    await db.execute(sql`SELECT pg_notify(${EVENTS_CHANNEL}, ${payload})`);
  } catch (err) {
    console.error("Failed to publish job event:", err);
  }
}

/** Subscribe to job state changes. Returns an unsubscribe function. */
export function subscribeJobEvents(handler: (event: JobEvent) => void) {
  return listener().subscribe(EVENTS_CHANNEL, (payload) => {
    try {
      handler(JSON.parse(payload) as JobEvent);
    } catch {
      // A malformed payload is not worth tearing the subscription down.
    }
  });
}

/**
 * Wake on newly-enqueued work. Notifications are fire-and-forget, so callers
 * poll as well — a missed wake-up costs latency, never a lost job.
 */
export function subscribeQueueWakeups(
  queue: QueueName,
  handler: () => void,
) {
  return listener().subscribe(JOBS_CHANNEL, (payload) => {
    if (payload === queue) handler();
  });
}

export async function closeListener() {
  const existing = globalForListener.__pgbrListener;
  if (!existing) return;
  globalForListener.__pgbrListener = undefined;
  await existing.close();
}
