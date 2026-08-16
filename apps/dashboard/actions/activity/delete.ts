"use server";

import { auth } from "@/lib/auth";
import { ACTIVITY_KINDS, type ActivityKind, type ActivityRef } from "@/types";
import { db } from "@repo/db";
import {
  activityEventsTable,
  backupJobsTable,
  migrationJobsTable,
  restoreJobsTable,
} from "@repo/db/schema";
import { getStore } from "@repo/storage";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

// Deleting from the activity page is not itself logged: an audit row for
// "cleared the audit log" would refill the page the user just emptied.
export default async function deleteActivity(refs: ActivityRef[]) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { data: null, error: { message: "Unauthorized" } };
  const userId = session.user.id;

  if (!Array.isArray(refs) || refs.length === 0) {
    return { data: null, error: { message: "No activities selected" } };
  }

  const byKind = {} as Record<ActivityKind, string[]>;
  for (const kind of ACTIVITY_KINDS) byKind[kind] = [];

  for (const ref of refs) {
    if (!ref?.id || !ACTIVITY_KINDS.includes(ref.kind)) {
      return { data: null, error: { message: "Invalid activity reference" } };
    }
    byKind[ref.kind].push(ref.id);
  }

  try {
    // Collected before the rows go, since they are the only record of which
    // objects in the bucket belong to these jobs.
    let storageKeys: string[] = [];
    if (byKind.backup.length > 0) {
      const jobs = await db
        .select({
          storageKey: backupJobsTable.storageKey,
          status: backupJobsTable.status,
        })
        .from(backupJobsTable)
        .where(
          and(
            inArray(backupJobsTable.id, byKind.backup),
            eq(backupJobsTable.userId, userId),
          ),
        );

      storageKeys = jobs
        .filter((job) => job.status === "completed" && job.storageKey)
        .map((job) => job.storageKey);
    }

    let deleted = 0;

    await db.transaction(async (tx) => {
      if (byKind.backup.length > 0) {
        const rows = await tx
          .delete(backupJobsTable)
          .where(
            and(
              inArray(backupJobsTable.id, byKind.backup),
              eq(backupJobsTable.userId, userId),
            ),
          )
          .returning({ id: backupJobsTable.id });
        deleted += rows.length;
      }

      if (byKind.restore.length > 0) {
        const rows = await tx
          .delete(restoreJobsTable)
          .where(
            and(
              inArray(restoreJobsTable.id, byKind.restore),
              eq(restoreJobsTable.userId, userId),
            ),
          )
          .returning({ id: restoreJobsTable.id });
        deleted += rows.length;
      }

      if (byKind.migration.length > 0) {
        const rows = await tx
          .delete(migrationJobsTable)
          .where(
            and(
              inArray(migrationJobsTable.id, byKind.migration),
              eq(migrationJobsTable.userId, userId),
            ),
          )
          .returning({ id: migrationJobsTable.id });
        deleted += rows.length;
      }

      if (byKind.event.length > 0) {
        const rows = await tx
          .delete(activityEventsTable)
          .where(
            and(
              inArray(activityEventsTable.id, byKind.event),
              eq(activityEventsTable.userId, userId),
            ),
          )
          .returning({ id: activityEventsTable.id });
        deleted += rows.length;
      }
    });

    // The rows are already gone; a store that is down must not be reported as
    // a failed delete, or the user retries something that cannot come back.
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
