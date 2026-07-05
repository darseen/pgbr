import type { InferSelectModel } from "drizzle-orm";
import { boolean, pgTable, text } from "drizzle-orm/pg-core";
import { timestamps } from "./_utils/shared-columns.js";

// Singleton row (id = "default") holding the active S3-compatible storage
// connection. The secret access key is encrypted at rest with the same
// mechanism used for database connection strings. When no row exists both the
// dashboard and worker fall back to the bundled SeaweedFS defaults, so a fresh
// install works with zero configuration.
export const STORAGE_SETTINGS_ID = "default";

export const storageSettingsTable = pgTable("storage_settings", {
  id: text().primaryKey().default(STORAGE_SETTINGS_ID),
  endpoint: text().notNull(),
  region: text().notNull(),
  bucket: text().notNull(),
  accessKeyId: text().notNull(),
  // Encrypted (iv:authTag:ciphertext); never returned to the client in plain text.
  secretAccessKey: text().notNull(),
  forcePathStyle: boolean().notNull().default(true),
  ...timestamps,
});

export type StorageSettings = InferSelectModel<typeof storageSettingsTable>;
