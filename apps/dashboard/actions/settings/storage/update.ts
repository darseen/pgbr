"use server";

import { auth } from "@/lib/auth";
import { storageSettingsSchema } from "@/lib/zod/storage";
import { db, storageSettingsTable, STORAGE_SETTINGS_ID } from "@repo/db";
import { encrypt } from "@repo/shared";
import { getDefaultStorageConfig, getStore } from "@repo/storage";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export default async function updateStorageSettings(input: unknown) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { data: null, error: { message: "Unauthorized" } };

  const result = storageSettingsSchema.safeParse(input);
  if (!result.success) {
    return { data: null, error: { message: result.error.issues[0].message } };
  }
  const v = result.data;

  try {
    const [existing] = await db
      .select()
      .from(storageSettingsTable)
      .where(eq(storageSettingsTable.id, STORAGE_SETTINGS_ID));

    // A blank secret keeps the existing one (or the bundled default on first
    // save), so other fields can be edited without re-entering credentials.
    let secretAccessKey: string;
    if (v.secretAccessKey) {
      secretAccessKey = encrypt(v.secretAccessKey);
    } else if (existing) {
      secretAccessKey = existing.secretAccessKey;
    } else {
      secretAccessKey = encrypt(getDefaultStorageConfig().secretAccessKey);
    }

    const columns = {
      endpoint: v.endpoint,
      region: v.region,
      bucket: v.bucket,
      accessKeyId: v.accessKeyId,
      secretAccessKey,
      forcePathStyle: v.forcePathStyle,
      updatedAt: new Date(),
    };

    await db
      .insert(storageSettingsTable)
      .values({ id: STORAGE_SETTINGS_ID, ...columns })
      .onConflictDoUpdate({ target: storageSettingsTable.id, set: columns });

    // Auto-provision the (possibly new) bucket so backups work immediately.
    try {
      const store = await getStore();
      await store.ensureBucket();
    } catch (bucketError) {
      console.error("Failed to ensure bucket after settings update", bucketError);
    }

    revalidatePath("/dashboard/settings");
    return { data: null, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: { message: "Internal server error" } };
  }
}
