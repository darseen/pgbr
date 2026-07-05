"use server";

import { auth } from "@/lib/auth";
import { databaseSchema } from "@/lib/zod/database";
import { db } from "@repo/db";
import { databasesTable } from "@repo/db/schema";
import { encrypt } from "@repo/shared";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { randomUUID } from "node:crypto";

export default async function createDatabase(input: { name: string; url: string }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { data: null, error: { message: "Unauthorized" } };
  const userId = session.user.id;

  const result = databaseSchema.safeParse(input);
  if (!result.success) {
    return { data: null, error: { message: result.error.issues[0].message } };
  }

  try {
    const [existingDatabase] = await db
      .select()
      .from(databasesTable)
      .where(
        and(eq(databasesTable.userId, userId), eq(databasesTable.name, result.data.name)),
      );

    if (existingDatabase) {
      return {
        data: null,
        error: { message: "Database name already exists" },
      };
    }

    const [database] = await db
      .insert(databasesTable)
      .values({
        id: randomUUID(),
        name: result.data.name,
        url: encrypt(result.data.url),
        userId,
      })
      .returning();

    revalidatePath("/dashboard");

    return {
      data: { database: { ...database!, url: result.data.url } },
      error: null,
    };
  } catch (error) {
    console.error(error);
    return { data: null, error: { message: "Internal server error" } };
  }
}
