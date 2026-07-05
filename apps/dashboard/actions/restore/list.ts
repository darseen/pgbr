"use server";

import { auth } from "@/lib/auth";
import { db } from "@repo/db";
import { restoreJobsTable } from "@repo/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";

export default async function listRestoreJobs(params?: {
  databaseId?: string;
  databaseName?: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { data: null, error: { message: "Unauthorized" } };
  const userId = session.user.id;

  try {
    if (params?.databaseId) {
      const [restoreJob] = await db
        .select()
        .from(restoreJobsTable)
        .where(
          and(
            eq(restoreJobsTable.databaseId, params.databaseId),
            eq(restoreJobsTable.userId, userId),
          ),
        );

      if (!restoreJob) {
        return { data: null, error: { message: "Database not found" } };
      }

      return { data: { restoreJob }, error: null };
    } else if (params?.databaseName) {
      const [restoreJob] = await db
        .select()
        .from(restoreJobsTable)
        .where(
          and(
            eq(restoreJobsTable.databaseName, params.databaseName),
            eq(restoreJobsTable.userId, userId),
          ),
        );

      if (!restoreJob) {
        return { data: null, error: { message: "Database not found" } };
      }

      return { data: { restoreJob }, error: null };
    } else {
      const restoreJobs = await db
        .select()
        .from(restoreJobsTable)
        .where(eq(restoreJobsTable.userId, userId))
        .orderBy(desc(restoreJobsTable.createdAt));

      return { data: { restoreJobs }, error: null };
    }
  } catch (error) {
    console.error(error);
    return { data: null, error: { message: "Internal server error" } };
  }
}
