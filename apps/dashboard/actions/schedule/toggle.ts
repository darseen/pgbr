"use server";

import { auth } from "@/lib/auth";
import { db } from "@repo/db";
import { backupSchedulesTable } from "@repo/db/schema";
import { nextOccurrence } from "@repo/queue";
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

    // Clearing next_run_at is what stops a schedule; setting it is what starts
    // one. Nothing else needs telling.
    const [schedule] = await db
      .update(backupSchedulesTable)
      .set({
        enabled,
        nextRunAt: enabled
          ? nextOccurrence(existing.cronExpression, existing.timezone)
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
