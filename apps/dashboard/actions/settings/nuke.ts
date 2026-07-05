"use server";

import { db } from "@repo/db";
import {
  backupJobsTable,
  databasesTable,
  migrationJobsTable,
  restoreJobsTable,
} from "@repo/db/schema";
import { auth } from "@/lib/auth";
import { getBackupsPath } from "@repo/shared";
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
      await tx.delete(migrationJobsTable);
    });

    await fs.rm(backupsPath, { recursive: true, force: true });

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
