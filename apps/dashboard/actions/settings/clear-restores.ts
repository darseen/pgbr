"use server";

import { db } from "@repo/db";
import { restoreJobsTable } from "@repo/db/schema";
import { recordActivity } from "@/lib/activity";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export default async function clearRestores() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { data: null, error: { message: "Unauthorized" } };
  const userId = session.user.id;

  try {
    const deleted = await db
      .delete(restoreJobsTable)
      .where(eq(restoreJobsTable.userId, userId))
      .returning({ id: restoreJobsTable.id });

    await recordActivity({
      userId,
      action: "restores.cleared",
      summary: `Cleared restore history (${deleted.length} ${deleted.length === 1 ? "job" : "jobs"})`,
      details: { count: deleted.length },
    });

    revalidatePath("/dashboard/activity");

    return { data: null, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: { message: "Internal server error" } };
  }
}
