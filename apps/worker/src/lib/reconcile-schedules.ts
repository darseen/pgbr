import { db, backupSchedulesTable } from "@repo/db";
import {
  buildScheduleTemplate,
  createRedisConnection,
  QUEUE_NAMES,
} from "@repo/shared";
import { Queue } from "bullmq";

// Postgres is the source of truth for backup schedules; the BullMQ job
// schedulers in Redis are derived state. Re-registering everything on boot
// heals drift from Redis flushes or dashboard actions that died mid-sync.
export async function reconcileSchedules() {
  const queue = new Queue(QUEUE_NAMES.backup, {
    connection: createRedisConnection(),
  });

  try {
    const schedules = await db.select().from(backupSchedulesTable);
    const active = schedules.filter((s) => s.enabled && s.userId);

    for (const schedule of active) {
      await queue.upsertJobScheduler(...buildScheduleTemplate(schedule));
    }

    const activeIds = new Set(active.map((s) => s.id));
    const registered = await queue.getJobSchedulers(0, -1);
    const orphans = registered.filter((s) => s.key && !activeIds.has(s.key));

    for (const orphan of orphans) {
      await queue.removeJobScheduler(orphan.key);
    }

    console.log(
      `Reconciled backup schedules: ${active.length} active, ${orphans.length} orphaned scheduler(s) removed`,
    );
  } finally {
    await queue.close();
  }
}
