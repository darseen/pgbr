import type { Readable } from "node:stream";

export interface StorageConfig {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
}

export interface UploadResult {
  /** Number of bytes streamed to the object store. */
  size: number;
}

export interface ObjectStream {
  stream: Readable;
  size: number;
  contentType?: string | undefined;
}

// The single storage abstraction the rest of the app talks to. There is
// exactly one implementation (S3-compatible); the only choice a user makes is
// which endpoint/bucket it points at.
export interface ObjectStore {
  /** Create the bucket if it does not already exist. */
  ensureBucket(): Promise<void>;
  /** Multipart upload from a local scratch path; returns the stored size. */
  uploadFile(localPath: string, key: string): Promise<UploadResult>;
  /** Multipart upload from a readable stream (e.g. an incoming HTTP body). */
  uploadStream(body: Readable, key: string): Promise<UploadResult>;
  /** Download an object to a local scratch path. */
  downloadToFile(key: string, localPath: string): Promise<void>;
  /** Open an object as a readable stream (for brokered dashboard downloads). */
  getObjectStream(key: string): Promise<ObjectStream>;
  /** Delete a single object. */
  deleteObject(key: string): Promise<void>;
  /** Delete every object under a key prefix (the "wipe everything" flow). */
  deleteByPrefix(prefix: string): Promise<void>;
  /** Whether an object exists — validates a user-supplied artifact reference. */
  objectExists(key: string): Promise<boolean>;
}
