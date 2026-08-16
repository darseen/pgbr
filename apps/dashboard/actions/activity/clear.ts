"use server";

import { auth } from "@/lib/auth";
import { db } from "@repo/db";
import {
  activityEventsTable,
  backupJobsTable,
  migrationJobsTable,
  restoreJobsTable,
} from "@repo/db/schema";
import { getStore } from "@repo/storage";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

// Wipes the caller's whole feed. Databases and schedules survive — this clears
// history, not configuration — but the artifacts of the deleted backup jobs go
// with them, exactly as deleting those jobs one by one would.
export default async function clearActivity() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { data: null, error: { message: "Unauthorized" } };
  const userId = session.user.id;

  try {
    const backups = await db
      .select({
        storageKey: backupJobsTable.storageKey,
        status: backupJobsTable.status,
      })
      .from(backupJobsTable)
      .where(eq(backupJobsTable.userId, userId));

    const storageKeys = [
      ...new Set(
        backups
          .filter((job) => job.status === "completed" && job.storageKey)
          .map((job) => job.storageKey),
      ),
    ];

    let deleted = 0;

    await db.transaction(async (tx) => {
      const backupRows = await tx
        .delete(backupJobsTable)
        .where(eq(backupJobsTable.userId, userId))
        .returning({ id: backupJobsTable.id });
      const restoreRows = await tx
        .delete(restoreJobsTable)
        .where(eq(restoreJobsTable.userId, userId))
        .returning({ id: restoreJobsTable.id });
      const migrationRows = await tx
        .delete(migrationJobsTable)
        .where(eq(migrationJobsTable.userId, userId))
        .returning({ id: migrationJobsTable.id });
      const eventRows = await tx
        .delete(activityEventsTable)
        .where(eq(activityEventsTable.userId, userId))
        .returning({ id: activityEventsTable.id });

      deleted =
        backupRows.length +
        restoreRows.length +
        migrationRows.length +
        eventRows.length;
    });

    // The rows are already gone; a store that is down must not be reported as
    // a failed clear, or the user retries something that cannot come back.
    if (storageKeys.length > 0) {
      try {
        const store = await getStore();
        await store.deleteObjects(storageKeys);
      } catch (storageError) {
        console.error("Failed to delete backup artifacts", storageError);
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/activity");
    revalidatePath("/dashboard/backups");

    return { data: { deleted }, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: { message: "Internal server error" } };
  }
}
