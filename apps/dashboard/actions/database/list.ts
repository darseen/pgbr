"use server";

import { auth } from "@/lib/auth";
import { db } from "@repo/db";
import { databasesTable } from "@repo/db/schema";
import { maskDatabaseUrl } from "@/utils";
import { decrypt } from "@repo/shared";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export default async function listDatabases() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { data: null, error: { message: "Unauthorized" } };
  const userId = session.user.id;

  try {
    const rawDatabases = await db
      .select()
      .from(databasesTable)
      .where(eq(databasesTable.userId, userId));

    // Masked, not decrypted: this crosses to the browser, and a connection
    // string with its password is a credential the client has no use for.
    const databases = rawDatabases.map((dbRecord) => ({
      ...dbRecord,
      url: maskDatabaseUrl(decrypt(dbRecord.url)),
    }));

    return { data: { databases }, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: { message: "Internal server error" } };
  }
}
