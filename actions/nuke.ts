"use server";

import { db } from "@/db";
import { backupJobsTable, databasesTable, restoreJobsTable } from "@/db/schema";
import auth from "@/utils/auth";
import { revalidatePath } from "next/cache";
import fs from "node:fs/promises";
import path from "node:path";

export default async function nuke() {
  const user = await auth();
  if (!user) return { data: null, error: { message: "Unauthorized" } };

  if (!process.env.PGBR_DATA) {
    return { data: null, error: { message: "PGBR_DATA is not set" } };
  }

  try {
    const backupsPath = path.join(process.env.PGBR_DATA, "backups");

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
