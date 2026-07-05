"use server";

import { auth } from "@/lib/auth";
import { storageSettingsSchema } from "@/lib/zod/storage";
import { db, storageSettingsTable, STORAGE_SETTINGS_ID } from "@repo/db";
import { decrypt } from "@repo/shared";
import { getDefaultStorageConfig, testConnection } from "@repo/storage";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

// Validates storage settings with a real round-trip to the bucket before they
// are saved. A blank secret is resolved from the stored/default one, matching
// the "keep current" semantics of the save action.
export default async function testStorageConnection(input: unknown) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { data: null, error: { message: "Unauthorized" } };

  const result = storageSettingsSchema.safeParse(input);
  if (!result.success) {
    return { data: null, error: { message: result.error.issues[0].message } };
  }
  const v = result.data;

  try {
    let secretAccessKey = v.secretAccessKey;
    if (!secretAccessKey) {
      const [existing] = await db
        .select()
        .from(storageSettingsTable)
        .where(eq(storageSettingsTable.id, STORAGE_SETTINGS_ID));
      secretAccessKey = existing
        ? decrypt(existing.secretAccessKey)
        : getDefaultStorageConfig().secretAccessKey;
    }

    const res = await testConnection({
      endpoint: v.endpoint,
      region: v.region,
      bucket: v.bucket,
      accessKeyId: v.accessKeyId,
      secretAccessKey,
      forcePathStyle: v.forcePathStyle,
    });

    if (!res.ok) return { data: null, error: { message: res.message } };
    return { data: { message: res.message }, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: { message: "Internal server error" } };
  }
}
