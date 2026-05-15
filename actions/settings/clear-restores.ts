"use server";

import { db } from "@/db";
import { restoreJobsTable } from "@/db/schema";
import auth from "@/utils/auth";
import { eq } from "drizzle-orm";

export default async function clearRestores() {
  const user = await auth();

  if (!user) {
    return { data: null, error: { message: "Unauthorized" } };
  }

  try {
    await db
      .delete(restoreJobsTable)
      .where(eq(restoreJobsTable.userId, user.id));
    return { data: null, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: { message: "Internal server error" } };
  }
}
