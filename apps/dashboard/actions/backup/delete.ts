"use server";

import { recordActivity } from "@/lib/activity";
import { auth } from "@/lib/auth";
import { db } from "@repo/db";
import { backupJobsTable } from "@repo/db/schema";
import { getStore } from "@repo/storage";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export default async function deleteBackupJobs(ids: string[]) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { data: null, error: { message: "Unauthorized" } };
  const userId = session.user.id;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return { data: null, error: { message: "Backup IDs are required" } };
  }

  try {
    const backupJobs = await db
      .select()
      .from(backupJobsTable)
      .where(
        and(inArray(backupJobsTable.id, ids), eq(backupJobsTable.userId, userId)),
      );

    if (backupJobs.length === 0) {
      return { data: null, error: { message: "No backups found" } };
    }

    const storageKeys: string[] = [];
    const backupJobsIds: string[] = [];

    backupJobs.forEach((job) => {
      if (job.status === "completed") storageKeys.push(job.storageKey);
      backupJobsIds.push(job.id);
    });

    await db
      .delete(backupJobsTable)
      .where(
        and(inArray(backupJobsTable.id, ids), eq(backupJobsTable.userId, userId)),
      );

    if (storageKeys.length > 0) {
      const store = await getStore();
      await Promise.all(
        storageKeys.map((key) =>
          store.deleteObject(key).catch((err) => {
            console.error(`Failed to delete artifact ${key}`, err);
          }),
        ),
      );
    }

    await recordActivity({
      userId,
      action: "backup.deleted",
      summary:
        backupJobs.length === 1
          ? `Deleted backup of ${backupJobs[0].databaseName}`
          : `Deleted ${backupJobs.length} backups`,
      details: {
        count: backupJobs.length,
        databases: [...new Set(backupJobs.map((job) => job.databaseName))],
        artifactsRemoved: storageKeys.length,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/backups");
    revalidatePath("/dashboard/activity");

    return { data: { backupJobsIds }, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: { message: "Internal server error" } };
  }
}
