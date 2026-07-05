"use server";

import { auth } from "@/lib/auth";
import { getBackupQueue } from "@/lib/queue";
import { db } from "@repo/db";
import { databasesTable } from "@repo/db/schema";
import { backupSchema, type BackupJobPayload } from "@repo/types";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { randomUUID } from "node:crypto";

// Enqueues a backup and returns immediately; job state reaches the UI
// through the /api/events stream and the job history tables.
export default async function runBackup(input: {
  databaseId: string;
  flags: unknown;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { data: null, error: { message: "Unauthorized" } };
  const userId = session.user.id;

  if (!input.databaseId) {
    return { data: null, error: { message: "Database ID is required" } };
  }

  const flagResult = backupSchema.safeParse(input.flags);
  if (!flagResult.success) {
    return {
      data: null,
      error: { message: flagResult.error.issues[0].message },
    };
  }

  try {
    const [database] = await db
      .select()
      .from(databasesTable)
      .where(
        and(
          eq(databasesTable.id, input.databaseId),
          eq(databasesTable.userId, userId),
        ),
      );

    if (!database) {
      return { data: null, error: { message: "Database not found" } };
    }

    const jobId = randomUUID();
    const payload: BackupJobPayload = {
      jobId,
      userId,
      databaseId: input.databaseId,
      flags: flagResult.data,
    };

    await getBackupQueue().add("backup", payload, { jobId });

    return { data: { jobId }, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: { message: "Internal server error" } };
  }
}
