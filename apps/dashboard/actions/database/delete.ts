"use server";

import { recordActivity } from "@/lib/activity";
import { auth } from "@/lib/auth";
import { db } from "@repo/db";
import { databasesTable } from "@repo/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export default async function deleteDatabase(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { data: null, error: { message: "Unauthorized" } };
  const userId = session.user.id;

  if (!id) {
    return { data: null, error: { message: "ID is required" } };
  }

  try {
    // The FK cascade takes the schedule rows with it, and a schedule row is
    // the whole schedule — there's nothing else to unregister.
    const [deleted] = await db
      .delete(databasesTable)
      .where(and(eq(databasesTable.id, id), eq(databasesTable.userId, userId)))
      .returning({ id: databasesTable.id, name: databasesTable.name });

    if (!deleted) {
      return { data: null, error: { message: "Database not found" } };
    }

    await recordActivity({
      userId,
      action: "database.deleted",
      summary: `Deleted database connection ${deleted.name}`,
      details: { databaseId: deleted.id, databaseName: deleted.name },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/activity");
    return { data: null, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: { message: "Internal server error" } };
  }
}
