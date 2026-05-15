"use server";

import { db } from "@/db";
import { backupJobsTable, databasesTable, restoreJobsTable } from "@/db/schema";
import { getBackupsPath } from "@/utils";
import auth from "@/utils/auth";
import { revalidatePath } from "next/cache";
import fs from "node:fs/promises";

export default async function nuke() {
  const user = await auth();
  if (!user) return { data: null, error: { message: "Unauthorized" } };

  try {
    const backupsPath = getBackupsPath();

    db.transaction((tx) => {
      tx.delete(databasesTable).run();
      tx.delete(backupJobsTable).run();
      tx.delete(restoreJobsTable).run();
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
