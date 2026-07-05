"use server";

import { auth } from "@/lib/auth";
import { db, storageSettingsTable, STORAGE_SETTINGS_ID } from "@repo/db";
import { resolveStorageConfig, verifyConnection } from "@repo/storage";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export interface StorageStatus {
  ok: boolean;
  message: string;
  /** Where the active config comes from: a saved DB row, or env/defaults. */
  source: "environment" | "settings";
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  forcePathStyle: boolean;
}

// Resolves the active storage connection and runs an automatic reachability
// probe. The secret is never returned. Used to decide whether the settings page
// shows a read-only status summary or the configuration form.
export default async function getStorageStatus() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { data: null, error: { message: "Unauthorized" } };

  try {
    const [row] = await db
      .select()
      .from(storageSettingsTable)
      .where(eq(storageSettingsTable.id, STORAGE_SETTINGS_ID));

    const config = await resolveStorageConfig();
    const check = await verifyConnection(config);

    const data: StorageStatus = {
      ok: check.ok,
      message: check.message,
      source: row ? "settings" : "environment",
      endpoint: config.endpoint,
      region: config.region,
      bucket: config.bucket,
      accessKeyId: config.accessKeyId,
      forcePathStyle: config.forcePathStyle,
    };
    return { data, error: null };
  } catch (error) {
    console.error(error);
    return { data: null, error: { message: "Internal server error" } };
  }
}
