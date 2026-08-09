import { claim, releaseWorkerJobs } from "./claim.js";
import { complete, fail } from "./client.js";
import { publishJobEvent, subscribeQueueWakeups } from "./events.js";
import type { ClaimedJob, JobContext, QueueName } from "./types.js";

export type RunQueueOptions<T> = {
  queue: QueueName;
  workerId: string;
  concurrency: number;
  handler: (job: JobContext<T>) => Promise<unknown>;
  /** Backstop for a dropped notification. */
  pollIntervalMs?: number;
};

export type QueueRunner = {
  queue: QueueName;
  /** Stops polling, waits for in-flight jobs, then hands back whatever didn't finish. */
  stop: (drainTimeoutMs: number) => Promise<void>;
};

export function runQueue<T>(options: RunQueueOptions<T>): QueueRunner {
  const { queue, workerId, concurrency, handler } = options;
  const pollIntervalMs = options.pollIntervalMs ?? 5000;

  const inFlight = new Set<string>();
  let stopped = false;
  let pumping = false;

  async function execute(job: ClaimedJob) {
    const context: JobContext<T> = {
      id: job.id,
      data: job.payload as T,
      attempts: job.attempts,
      reportProgress: (payload) =>
        publishJobEvent({
          jobId: job.id,
          queue,
          userId: job.userId,
          event: "progress",
          data: payload,
        }),
    };

    try {
      await handler(context);
      await complete(job.id);
      await publishJobEvent({
        jobId: job.id,
        queue,
        userId: job.userId,
        event: "completed",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[${queue}] job ${job.id} failed:`, message);
      await fail(job.id, message);
      await publishJobEvent({
        jobId: job.id,
        queue,
        userId: job.userId,
        event: "failed",
      });
    }
  }

  async function pump() {
    if (pumping || stopped) return;
    pumping = true;

    try {
      while (!stopped) {
        const capacity = concurrency - inFlight.size;
        if (capacity <= 0) break;

        const jobs = await claim(queue, workerId, capacity);
        if (jobs.length === 0) break;

        for (const job of jobs) {
          inFlight.add(job.id);
          void execute(job).finally(() => {
            inFlight.delete(job.id);
            // Capacity freed up; there may be more waiting.
            setImmediate(() => void pump());
          });
        }
      }
    } catch (err) {
      console.error(`[${queue}] claim failed:`, err);
    } finally {
      pumping = false;
    }
  }

  const unsubscribe = subscribeQueueWakeups(queue, () => void pump());
  const timer = setInterval(() => void pump(), pollIntervalMs);
  void pump();

  return {
    queue,
    async stop(drainTimeoutMs: number) {
      stopped = true;
      clearInterval(timer);
      unsubscribe();

      const deadline = Date.now() + drainTimeoutMs;
      while (inFlight.size > 0 && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      if (inFlight.size > 0) {
        console.warn(
          `[${queue}] ${inFlight.size} job(s) still running at shutdown; requeueing`,
        );
      }
    },
  };
}

/** Called once after every runner has stopped, so a restart doesn't wait out the reaper. */
export async function releaseUnfinished(workerId: string) {
  try {
    const released = await releaseWorkerJobs(workerId);
    if (released > 0) console.log(`Requeued ${released} unfinished job(s)`);
  } catch (err) {
    console.error("Failed to requeue unfinished jobs:", err);
  }
}
