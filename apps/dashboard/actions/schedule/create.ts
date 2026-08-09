"use server";

import { auth } from "@/lib/auth";
import { scheduleSchema, splitScheduleInput } from "@/lib/zod/schedule";
import { db } from "@repo/db";
import { backupSchedulesTable, databasesTable } from "@repo/db/schema";
import { nextOccurrence } from "@repo/queue";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { randomUUID } from "node:crypto";

export default async function createSchedule(input: unknown) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { data: null, error: { message: "Unauthorized" } };
  const userId = session.user.id;

  const result = scheduleSchema.safeParse(input);
  if (!result.success) {
    return { data: null, error: { message: result.error.issues[0].message } };
  }
  const { scheduleFields, flags } = splitScheduleInput(result.data);

  try {
    const [database] = await db
      .select()
      .from(databasesTable)
      .where(
        and(
          eq(databasesTable.id, scheduleFields.databaseId),
          eq(databasesTable.userId, userId),
        ),
      );

    if (!database) {
      return { data: null, error: { message: "Database not found" } };
    }

    // The row is the scheduler: next_run_at is what makes it fire, so there's
    // no second system to register with and nothing to roll back.
    const [schedule] = await db
      .insert(backupSchedulesTable)
      .values({
        id: randomUUID(),
        userId,
        ...scheduleFields,
        flags,
        nextRunAt: scheduleFields.enabled
          ? nextOccurrence(scheduleFields.cronExpression, scheduleFields.timezone)
          : null,
      })
      .returning();

    revalidatePath("/dashboard/schedules");
    return { data: { schedule }, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: { message: "Internal server error" } };
  }
}
