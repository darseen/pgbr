"use server";

import { auth } from "@/lib/auth";
import { db } from "@repo/db";
import { databasesTable } from "@repo/db/schema";
import { enqueue, QUEUE_NAMES } from "@repo/queue";
import { restoreSchema, type RestoreJobPayload } from "@repo/types";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { randomUUID } from "node:crypto";

// Enqueues a restore and returns immediately; job state reaches the UI
// through the /api/events stream and the job history tables. The worker
// re-checks backup-job ownership and path containment before restoring.
export default async function runRestore(input: {
  databaseId: string;
  backupJobId?: string;
  customKey?: string;
  flags: unknown;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { data: null, error: { message: "Unauthorized" } };
  const userId = session.user.id;

  if (!input.databaseId) {
    return { data: null, error: { message: "Database ID is required" } };
  }

  if (!input.backupJobId && !input.customKey) {
    return {
      data: null,
      error: { message: "A tracked backup or a custom source is required" },
    };
  }

  const flagResult = restoreSchema.safeParse(input.flags ?? {});
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
    const payload: RestoreJobPayload = {
      userId,
      databaseId: input.databaseId,
      backupJobId: input.backupJobId,
      customKey: input.customKey,
      flags: flagResult.data,
    };

    await enqueue(db, {
      id: jobId,
      queue: QUEUE_NAMES.restore,
      userId,
      payload,
    });

    return { data: { jobId }, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: { message: "Internal server error" } };
  }
}
