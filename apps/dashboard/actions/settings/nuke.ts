"use server";

import { auth } from "@/lib/auth";
import { db } from "@repo/db";
import {
  backupJobsTable,
  backupSchedulesTable,
  databasesTable,
  migrationJobsTable,
  restoreJobsTable,
} from "@repo/db/schema";
import { cancelPendingForUser } from "@repo/queue";
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
    const [ownedBackups, ownedRestores] = await Promise.all([
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
      // Queued-but-unstarted work goes too, so nuke doesn't leave a backup to
      // fire against rows that no longer exist. Another user's jobs are
      // untouched, and anything already running is left to finish.
      await cancelPendingForUser(tx, userId);
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
