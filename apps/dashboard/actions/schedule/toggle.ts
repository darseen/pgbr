"use server";

import { auth } from "@/lib/auth";
import { getBackupQueue } from "@/lib/queue";
import { db } from "@repo/db";
import { backupSchedulesTable } from "@repo/db/schema";
import { buildScheduleTemplate } from "@repo/shared";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export default async function toggleSchedule(id: string, enabled: boolean) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { data: null, error: { message: "Unauthorized" } };
  const userId = session.user.id;

  if (!id) {
    return { data: null, error: { message: "ID is required" } };
  }

  try {
    const [schedule] = await db
      .update(backupSchedulesTable)
      .set({ enabled })
      .where(
        and(
          eq(backupSchedulesTable.id, id),
          eq(backupSchedulesTable.userId, userId),
        ),
      )
      .returning();

    if (!schedule) {
      return { data: null, error: { message: "Schedule not found" } };
    }

    if (schedule.enabled) {
      await getBackupQueue().upsertJobScheduler(
        ...buildScheduleTemplate(schedule),
      );
    } else {
      await getBackupQueue().removeJobScheduler(schedule.id);
    }

    revalidatePath("/dashboard/schedules");
    return { data: { schedule }, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: { message: "Internal server error" } };
  }
}
