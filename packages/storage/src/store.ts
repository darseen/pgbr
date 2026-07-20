import {
  CreateBucketCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Transform, type Readable } from "node:stream";
import type { ObjectStore, StorageConfig } from "./types.js";

export function createS3Client(
  config: StorageConfig,
  overrides?: { maxAttempts?: number },
): S3Client {
  return new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    ...overrides,
  });
}

function isNotFound(err: unknown): boolean {
  const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
  return e.name === "NotFound" || e.$metadata?.httpStatusCode === 404;
}

export function createStore(config: StorageConfig): ObjectStore {
  const client = createS3Client(config);
  const bucket = config.bucket;

  // Count bytes as they stream so the stored size comes from the upload itself
  // rather than a separate stat of the scratch file.
  async function uploadReadable(source: Readable, key: string) {
    let size = 0;
    const counter = new Transform({
      transform(chunk, _enc, cb) {
        size += chunk.length;
        cb(null, chunk);
      },
    });
    const body = source.pipe(counter);

    const upload = new Upload({
      client,
      params: { Bucket: bucket, Key: key, Body: body },
    });
    await upload.done();

    return { size };
  }

  return {
    async ensureBucket() {
      try {
        await client.send(new HeadBucketCommand({ Bucket: bucket }));
      } catch {
        try {
          await client.send(new CreateBucketCommand({ Bucket: bucket }));
        } catch (err) {
          const name = (err as { name?: string }).name;
          if (
            name !== "BucketAlreadyOwnedByYou" &&
            name !== "BucketAlreadyExists"
          ) {
            throw err;
          }
        }
      }
    },

    async uploadFile(localPath, key) {
      return uploadReadable(createReadStream(localPath), key);
    },

    async uploadStream(body, key) {
      return uploadReadable(body, key);
    },

    async downloadToFile(key, localPath) {
      const res = await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key }),
      );
      await pipeline(res.Body as Readable, createWriteStream(localPath));
    },

    async getObjectStream(key) {
      const res = await client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key }),
      );
      return {
        stream: res.Body as Readable,
        size: res.ContentLength ?? 0,
        contentType: res.ContentType,
      };
    },

    async deleteObject(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },

    async deleteObjects(keys) {
      // DeleteObjects caps at 1000 keys per request.
      for (let i = 0; i < keys.length; i += 1000) {
        const batch = keys.slice(i, i + 1000).map((Key) => ({ Key }));
        if (batch.length === 0) continue;
        await client.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: batch },
          }),
        );
      }
    },

    async deleteByPrefix(prefix) {
      let continuationToken: string | undefined;
      do {
        const list = await client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix,
            ContinuationToken: continuationToken,
          }),
        );

        const objects = (list.Contents ?? [])
          .map((o) => o.Key)
          .filter((k): k is string => Boolean(k))
          .map((Key) => ({ Key }));

        if (objects.length > 0) {
          await client.send(
            new DeleteObjectsCommand({
              Bucket: bucket,
              Delete: { Objects: objects },
            }),
          );
        }

        continuationToken = list.IsTruncated
          ? list.NextContinuationToken
          : undefined;
      } while (continuationToken);
    },

    async objectExists(key) {
      try {
        await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
        return true;
      } catch (err) {
        if (isNotFound(err)) return false;
        throw err;
      }
    },
  };
}
