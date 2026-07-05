"use server";

import { auth } from "@/lib/auth";
import { getBackupQueue } from "@/lib/queue";
import { scheduleSchema, splitScheduleInput } from "@/lib/zod/schedule";
import { db } from "@repo/db";
import { backupSchedulesTable, databasesTable } from "@repo/db/schema";
import { buildScheduleTemplate } from "@repo/shared";
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

    const [schedule] = await db
      .insert(backupSchedulesTable)
      .values({
        id: randomUUID(),
        userId,
        ...scheduleFields,
        flags,
      })
      .returning();

    if (schedule!.enabled) {
      // DB first, Redis second; roll the row back if registration fails so
      // the user never sees a schedule that silently doesn't run. The
      // worker's boot reconciliation is a backstop, not the primary path.
      try {
        await getBackupQueue().upsertJobScheduler(
          ...buildScheduleTemplate(schedule!),
        );
      } catch (redisError) {
        console.error(redisError);
        await db
          .delete(backupSchedulesTable)
          .where(eq(backupSchedulesTable.id, schedule!.id));
        return {
          data: null,
          error: { message: "Failed to register the schedule. Please try again." },
        };
      }
    }

    revalidatePath("/dashboard/schedules");
    return { data: { schedule }, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: { message: "Internal server error" } };
  }
}
