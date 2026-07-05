"use server";

import { db } from "@repo/db";
import {
  backupJobsTable,
  backupSchedulesTable,
  databasesTable,
  migrationJobsTable,
  restoreJobsTable,
} from "@repo/db/schema";
import { auth } from "@/lib/auth";
import { getBackupQueue } from "@/lib/queue";
import { getBackupsPath } from "@repo/shared";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import fs from "node:fs/promises";

export default async function nuke() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { data: null, error: { message: "Unauthorized" } };

  try {
    const backupsPath = getBackupsPath();

    await db.transaction(async (tx) => {
      await tx.delete(backupSchedulesTable);
      await tx.delete(databasesTable);
      await tx.delete(backupJobsTable);
      await tx.delete(restoreJobsTable);
      await tx.delete(migrationJobsTable);
    });

    // Nuke wipes every database, so no job scheduler should survive.
    const queue = getBackupQueue();
    const schedulers = await queue.getJobSchedulers(0, -1);
    for (const scheduler of schedulers) {
      if (scheduler.key) await queue.removeJobScheduler(scheduler.key);
    }

    await fs.rm(backupsPath, { recursive: true, force: true });

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
