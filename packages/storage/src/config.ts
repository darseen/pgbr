import {
  CreateBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { db, storageSettingsTable, STORAGE_SETTINGS_ID } from "@repo/db";
import { decrypt } from "@repo/shared";
import { eq } from "drizzle-orm";
import { createS3Client, createStore } from "./store.js";
import type { ObjectStore, StorageConfig } from "./types.js";

function envBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
}

// Default object-store connection from environment variables, so the bundled
// SeaweedFS store works out of the box. The dashboard settings page can
// override this by persisting an (encrypted) connection in the database.
export function getDefaultStorageConfig(): StorageConfig {
  return {
    endpoint: process.env.STORAGE_ENDPOINT ?? "http://seaweedfs:8333",
    region: process.env.STORAGE_REGION ?? "us-east-1",
    bucket: process.env.STORAGE_BUCKET ?? "pgbr",
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID ?? "pgbr",
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY ?? "pgbrsecret",
    forcePathStyle: envBool(process.env.STORAGE_FORCE_PATH_STYLE, true),
  };
}

// Reads the singleton storage_settings row and decrypts the secret. Both the
// dashboard and the worker call this; the worker has no request context, so it
// resolves the current config itself per job.
export async function resolveStorageConfig(): Promise<StorageConfig> {
  const [row] = await db
    .select()
    .from(storageSettingsTable)
    .where(eq(storageSettingsTable.id, STORAGE_SETTINGS_ID));

  if (!row) return getDefaultStorageConfig();

  return {
    endpoint: row.endpoint,
    region: row.region,
    bucket: row.bucket,
    accessKeyId: row.accessKeyId,
    secretAccessKey: decrypt(row.secretAccessKey),
    forcePathStyle: row.forcePathStyle,
  };
}

export async function getStore(): Promise<ObjectStore> {
  return createStore(await resolveStorageConfig());
}

export interface TestConnectionResult {
  ok: boolean;
  message: string;
}

// Real round-trip against the bucket: reach it (creating if absent), then
// write and delete a tiny probe object so credentials and write access are
// actually exercised before the settings are saved.
export async function testConnection(
  config: StorageConfig,
): Promise<TestConnectionResult> {
  try {
    const client = createS3Client(config, { maxAttempts: 1 });

    try {
      await client.send(new HeadBucketCommand({ Bucket: config.bucket }));
    } catch {
      await client.send(new CreateBucketCommand({ Bucket: config.bucket }));
    }

    const probeKey = `.pgbr-conn-test-${Date.now()}`;
    await client.send(
      new PutObjectCommand({ Bucket: config.bucket, Key: probeKey, Body: "ok" }),
    );
    await client.send(
      new DeleteObjectCommand({ Bucket: config.bucket, Key: probeKey }),
    );

    return { ok: true, message: "Connection successful" };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Connection failed",
    };
  }
}

// Lightweight reachability probe for the settings page's automatic check:
// reach the bucket (creating it if absent) without writing a probe object, and
// fail fast (no retries) so a broken/unreachable store doesn't hang the page.
export async function verifyConnection(
  config: StorageConfig,
): Promise<TestConnectionResult> {
  try {
    const client = createS3Client(config, { maxAttempts: 1 });
    try {
      await client.send(new HeadBucketCommand({ Bucket: config.bucket }));
    } catch {
      await client.send(new CreateBucketCommand({ Bucket: config.bucket }));
    }
    return { ok: true, message: "Reachable" };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Connection failed",
    };
  }
}
