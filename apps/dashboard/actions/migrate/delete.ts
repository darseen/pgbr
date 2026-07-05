"use server";

import { auth } from "@/lib/auth";
import { db } from "@repo/db";
import { migrationJobsTable } from "@repo/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";

export default async function deleteMigrationJobs(ids: string[]) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { data: null, error: { message: "Unauthorized" } };
  const userId = session.user.id;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return { data: null, error: { message: "IDs array is required" } };
  }

  try {
    const migrationJobs = await db
      .select()
      .from(migrationJobsTable)
      .where(
        and(
          inArray(migrationJobsTable.id, ids),
          eq(migrationJobsTable.userId, userId),
        ),
      );

    if (migrationJobs.length === 0) {
      return { data: null, error: { message: "No migration jobs found" } };
    }

    const migrationJobsIds = migrationJobs.map((job) => job.id);

    await db
      .delete(migrationJobsTable)
      .where(
        and(
          inArray(migrationJobsTable.id, ids),
          eq(migrationJobsTable.userId, userId),
        ),
      );

    return { data: { migrationJobsIds }, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: { message: "Internal server error" } };
  }
}
