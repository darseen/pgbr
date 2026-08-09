"use server";

import { auth } from "@/lib/auth";
import { scheduleSchema, splitScheduleInput } from "@/lib/zod/schedule";
import { db } from "@repo/db";
import { backupSchedulesTable } from "@repo/db/schema";
import { nextOccurrence } from "@repo/queue";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export default async function updateSchedule(id: string, input: unknown) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { data: null, error: { message: "Unauthorized" } };
  const userId = session.user.id;

  if (!id) {
    return { data: null, error: { message: "ID is required" } };
  }

  const result = scheduleSchema.safeParse(input);
  if (!result.success) {
    return { data: null, error: { message: result.error.issues[0].message } };
  }
  const { scheduleFields, flags } = splitScheduleInput(result.data);

  try {
    const [existing] = await db
      .select()
      .from(backupSchedulesTable)
      .where(
        and(
          eq(backupSchedulesTable.id, id),
          eq(backupSchedulesTable.userId, userId),
        ),
      );

    if (!existing) {
      return { data: null, error: { message: "Schedule not found" } };
    }

    // The database a schedule points at is fixed after creation.
    if (scheduleFields.databaseId !== existing.databaseId) {
      return {
        data: null,
        error: { message: "A schedule's database cannot be changed" },
      };
    }

    // Recomputing next_run_at in the same statement means a pattern or timezone
    // edit propagates to the next run with no second write to keep in step.
    const [schedule] = await db
      .update(backupSchedulesTable)
      .set({
        ...scheduleFields,
        flags,
        nextRunAt: scheduleFields.enabled
          ? nextOccurrence(scheduleFields.cronExpression, scheduleFields.timezone)
          : null,
      })
      .where(eq(backupSchedulesTable.id, id))
      .returning();

    revalidatePath("/dashboard/schedules");
    return { data: { schedule }, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: { message: "Internal server error" } };
  }
}
