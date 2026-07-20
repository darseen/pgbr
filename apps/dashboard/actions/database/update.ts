"use server";

import { auth } from "@/lib/auth";
import { updateDatabaseSchema } from "@/lib/zod/database";
import { db } from "@repo/db";
import { databasesTable } from "@repo/db/schema";
import { encrypt } from "@repo/shared";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export default async function updateDatabase(input: {
  id: string;
  name: string;
  url?: string | undefined;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { data: null, error: { message: "Unauthorized" } };
  const userId = session.user.id;

  if (!input.id) {
    return { data: null, error: { message: "ID is required" } };
  }

  const result = updateDatabaseSchema.safeParse(input);
  if (!result.success) {
    return { data: null, error: { message: result.error.issues[0].message } };
  }

  const url = result.data.url?.trim();

  try {
    const [nameTaken] = await db
      .select({ id: databasesTable.id })
      .from(databasesTable)
      .where(
        and(
          eq(databasesTable.userId, userId),
          eq(databasesTable.name, result.data.name),
          ne(databasesTable.id, input.id),
        ),
      );

    if (nameTaken) {
      return { data: null, error: { message: "Database name already exists" } };
    }

    const [database] = await db
      .update(databasesTable)
      .set({
        name: result.data.name,
        // Omitted means "keep the stored credential" — the client only ever
        // held a masked URL, so there is nothing to write back.
        ...(url ? { url: encrypt(url) } : {}),
      })
      .where(and(eq(databasesTable.id, input.id), eq(databasesTable.userId, userId)))
      .returning();

    if (!database) {
      return { data: null, error: { message: "Database not found" } };
    }

    revalidatePath("/dashboard");

    return { data: null, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: { message: "Internal server error" } };
  }
}
