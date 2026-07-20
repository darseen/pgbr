"use server";

import { auth } from "@/lib/auth";
import { getBackupQueue } from "@/lib/queue";
import { db } from "@repo/db";
import {
  backupJobsTable,
  backupSchedulesTable,
  databasesTable,
  migrationJobsTable,
  restoreJobsTable,
} from "@repo/db/schema";
import { getStore } from "@repo/storage";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export default async function nuke() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { data: null, error: { message: "Unauthorized" } };
  const userId = session.user.id;

  try {
    // Everything below is scoped to the caller, matching clearRestores and
    // clearMigrations. Nuke wipes *your* data, not the instance's.
    const [ownedSchedules, ownedBackups, ownedRestores] = await Promise.all([
      db
        .select({ id: backupSchedulesTable.id })
        .from(backupSchedulesTable)
        .where(eq(backupSchedulesTable.userId, userId)),
      db
        .select({ storageKey: backupJobsTable.storageKey })
        .from(backupJobsTable)
        .where(eq(backupJobsTable.userId, userId)),
      db
        .select({ storageKey: restoreJobsTable.storageKey })
        .from(restoreJobsTable)
        .where(eq(restoreJobsTable.userId, userId)),
    ]);

    // Collected before the rows go away — they're the only record of which
    // objects in the bucket are this user's.
    const ownedKeys = [
      ...new Set(
        [...ownedBackups, ...ownedRestores]
          .map((row) => row.storageKey)
          .filter(Boolean),
      ),
    ];

    await db.transaction(async (tx) => {
      await tx
        .delete(backupSchedulesTable)
        .where(eq(backupSchedulesTable.userId, userId));
      await tx.delete(databasesTable).where(eq(databasesTable.userId, userId));
      await tx.delete(backupJobsTable).where(eq(backupJobsTable.userId, userId));
      await tx
        .delete(restoreJobsTable)
        .where(eq(restoreJobsTable.userId, userId));
      await tx
        .delete(migrationJobsTable)
        .where(eq(migrationJobsTable.userId, userId));
    });

    // Only the schedulers derived from the schedules just deleted; another
    // user's repeat jobs must keep running.
    const queue = getBackupQueue();
    for (const schedule of ownedSchedules) {
      await queue.removeJobScheduler(schedule.id);
    }

    // Storage settings are intentionally preserved; only artifacts are removed.
    const store = await getStore();
    await store.deleteObjects(ownedKeys);

    revalidatePath("/dashboard");

    return { data: null, error: null };
  } catch (error) {
    console.error(error);
    return {
      data: null,
      error: { message: "Internal server error" },
    };
  }
}
