"use server";

import { db } from "@/db";
import { migrationJobsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export default async function clearMigrations() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { data: null, error: { message: "Unauthorized" } };

  try {
    await db
      .delete(migrationJobsTable)
      .where(eq(migrationJobsTable.userId, session.user.id));
    return { data: null, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: { message: "Internal server error" } };
  }
}
