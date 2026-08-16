"use server";

import { db } from "@repo/db";
import { migrationJobsTable } from "@repo/db/schema";
import { recordActivity } from "@/lib/activity";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export default async function clearMigrations() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { data: null, error: { message: "Unauthorized" } };
  const userId = session.user.id;

  try {
    const deleted = await db
      .delete(migrationJobsTable)
      .where(eq(migrationJobsTable.userId, userId))
      .returning({ id: migrationJobsTable.id });

    await recordActivity({
      userId,
      action: "migrations.cleared",
      summary: `Cleared migration history (${deleted.length} ${deleted.length === 1 ? "job" : "jobs"})`,
      details: { count: deleted.length },
    });

    revalidatePath("/dashboard/activity");

    return { data: null, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: { message: "Internal server error" } };
  }
}
