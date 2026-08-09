"use server";

import { auth } from "@/lib/auth";
import { db } from "@repo/db";
import { backupSchedulesTable } from "@repo/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export default async function deleteSchedule(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { data: null, error: { message: "Unauthorized" } };
  const userId = session.user.id;

  if (!id) {
    return { data: null, error: { message: "ID is required" } };
  }

  try {
    // backup_jobs.scheduleId is set null by the FK; backup files are kept.
    const [deleted] = await db
      .delete(backupSchedulesTable)
      .where(
        and(
          eq(backupSchedulesTable.id, id),
          eq(backupSchedulesTable.userId, userId),
        ),
      )
      .returning();

    if (!deleted) {
      return { data: null, error: { message: "Schedule not found" } };
    }

    revalidatePath("/dashboard/schedules");
    return { data: null, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: { message: "Internal server error" } };
  }
}
