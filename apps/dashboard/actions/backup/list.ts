"use server";

import { auth } from "@/lib/auth";
import { db } from "@repo/db";
import { backupJobsTable } from "@repo/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";

export default async function listBackupJobs(params?: {
  databaseId?: string;
  databaseName?: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { data: null, error: { message: "Unauthorized" } };
  const userId = session.user.id;

  try {
    if (params?.databaseId) {
      const [backupJob] = await db
        .select()
        .from(backupJobsTable)
        .where(
          and(
            eq(backupJobsTable.databaseId, params.databaseId),
            eq(backupJobsTable.userId, userId),
          ),
        );

      if (!backupJob) {
        return { data: null, error: { message: "Database not found" } };
      }

      return { data: { backupJob }, error: null };
    } else if (params?.databaseName) {
      const [backupJob] = await db
        .select()
        .from(backupJobsTable)
        .where(
          and(
            eq(backupJobsTable.databaseName, params.databaseName),
            eq(backupJobsTable.userId, userId),
          ),
        );

      if (!backupJob) {
        return { data: null, error: { message: "Database not found" } };
      }

      return { data: { backupJob }, error: null };
    } else {
      const backupJobs = await db
        .select()
        .from(backupJobsTable)
        .where(eq(backupJobsTable.userId, userId))
        .orderBy(desc(backupJobsTable.createdAt));

      return { data: { backupJobs }, error: null };
    }
  } catch (error) {
    console.error(error);
    return { data: null, error: { message: "Internal server error" } };
  }
}
