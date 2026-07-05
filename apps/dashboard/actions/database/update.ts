"use server";

import { auth } from "@/lib/auth";
import { databaseSchema } from "@/lib/zod/database";
import { db } from "@repo/db";
import { databasesTable } from "@repo/db/schema";
import { encrypt } from "@repo/shared";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export default async function updateDatabase(input: {
  id: string;
  name: string;
  url: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { data: null, error: { message: "Unauthorized" } };
  const userId = session.user.id;

  if (!input.id) {
    return { data: null, error: { message: "ID is required" } };
  }

  const result = databaseSchema.safeParse(input);
  if (!result.success) {
    return { data: null, error: { message: result.error.issues[0].message } };
  }

  try {
    const [database] = await db
      .update(databasesTable)
      .set({ name: result.data.name, url: encrypt(result.data.url) })
      .where(and(eq(databasesTable.id, input.id), eq(databasesTable.userId, userId)))
      .returning();

    if (!database) {
      return { data: null, error: { message: "Database not found" } };
    }

    revalidatePath("/dashboard");

    return {
      data: { database: { ...database, url: result.data.url } },
      error: null,
    };
  } catch (error) {
    console.error(error);
    return { data: null, error: { message: "Internal server error" } };
  }
}
