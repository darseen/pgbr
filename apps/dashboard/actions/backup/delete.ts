"use server";

import { auth } from "@/lib/auth";
import { db } from "@repo/db";
import { backupJobsTable } from "@repo/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import fs from "node:fs/promises";

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

    const backupPaths: string[] = [];
    const backupJobsIds: string[] = [];

    backupJobs.forEach((job) => {
      if (job.status === "completed") backupPaths.push(job.backupPath);
      backupJobsIds.push(job.id);
    });

    await db
      .delete(backupJobsTable)
      .where(
        and(inArray(backupJobsTable.id, ids), eq(backupJobsTable.userId, userId)),
      );

    await Promise.all(
      backupPaths.map((path) => fs.rm(path, { recursive: true, force: true })),
    );

    return { data: { backupJobsIds }, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: { message: "Internal server error" } };
  }
}
