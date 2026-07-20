"use server";

import { auth } from "@/lib/auth";
import { db } from "@repo/db";
import { databasesTable } from "@repo/db/schema";
import { decrypt, pgConnection } from "@repo/shared";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { spawn } from "node:child_process";

export default async function pingDatabase(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { data: null, error: { message: "Unauthorized" } };
  const userId = session.user.id;

  if (!id) {
    return { data: null, error: { message: "Database ID is required" } };
  }

  try {
    const [database] = await db
      .select()
      .from(databasesTable)
      .where(and(eq(databasesTable.id, id), eq(databasesTable.userId, userId)));

    if (!database) {
      return { data: null, error: { message: "Database not found" } };
    }

    // Password via PGPASSWORD, not argv — the process table is readable by
    // anything else in this container.
    const target = pgConnection(decrypt(database.url));

    const isReady = await new Promise<boolean>((resolve) => {
      const child = spawn("pg_isready", ["-d", target.url, "-t", "5"], {
        env: { ...process.env, ...target.env },
      });

      child.on("close", (code) => {
        resolve(code === 0);
      });

      child.on("error", (err) => {
        console.error("Failed to start pg_isready process:", err);
        resolve(false);
      });
    });

    if (isReady) {
      return { data: null, error: null };
    }

    return {
      data: null,
      error: { message: "Failed to connect to the database" },
    };
  } catch (error) {
    console.error("Database ping failed:", error);
    return { data: null, error: { message: "Internal server error" } };
  }
}
