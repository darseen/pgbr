"use server";

import { db } from "@/db";
import { backupJobsTable, databasesTable, restoreJobsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getBackupsPath } from "@/utils";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import fs from "node:fs/promises";

export default async function nuke() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { data: null, error: { message: "Unauthorized" } };

  try {
    const backupsPath = getBackupsPath();

    await db.transaction(async (tx) => {
      await tx.delete(databasesTable);
      await tx.delete(backupJobsTable);
      await tx.delete(restoreJobsTable);
    });

    await fs.rm(backupsPath, { recursive: true });

    revalidatePath("/dashboard");

    return { data: null, error: null };
  } catch (error) {
    console.error(error);
    return {
      data: null,
      error: { message: "Internal server error" },
    };
  }
}
