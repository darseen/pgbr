"use server";

import { auth } from "@/lib/auth";
import { db } from "@repo/db";
import { restoreJobsTable } from "@repo/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";

export default async function deleteRestoreJobs(ids: string[]) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { data: null, error: { message: "Unauthorized" } };
  const userId = session.user.id;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return { data: null, error: { message: "IDs array is required" } };
  }

  try {
    const restoreJobs = await db
      .select()
      .from(restoreJobsTable)
      .where(
        and(inArray(restoreJobsTable.id, ids), eq(restoreJobsTable.userId, userId)),
      );

    if (restoreJobs.length === 0) {
      return { data: null, error: { message: "No restore jobs found" } };
    }

    const restoreJobsIds = restoreJobs.map((job) => job.id);

    await db
      .delete(restoreJobsTable)
      .where(
        and(inArray(restoreJobsTable.id, ids), eq(restoreJobsTable.userId, userId)),
      );

    return { data: { restoreJobsIds }, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: { message: "Internal server error" } };
  }
}
