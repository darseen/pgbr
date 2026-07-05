import { Queue, QueueEvents } from "bullmq";
import { createRedisConnection, QUEUE_NAMES } from "@repo/shared";

let _backupQueue: Queue | undefined;
let _restoreQueue: Queue | undefined;
let _migrateQueue: Queue | undefined;
let _backupQueueEvents: QueueEvents | undefined;
let _restoreQueueEvents: QueueEvents | undefined;
let _migrateQueueEvents: QueueEvents | undefined;

export function getBackupQueue() {
  return (_backupQueue ??= new Queue(QUEUE_NAMES.backup, {
    connection: createRedisConnection(),
  }));
}

export function getRestoreQueue() {
  return (_restoreQueue ??= new Queue(QUEUE_NAMES.restore, {
    connection: createRedisConnection(),
  }));
}

export function getMigrateQueue() {
  return (_migrateQueue ??= new Queue(QUEUE_NAMES.migrate, {
    connection: createRedisConnection(),
  }));
}

export function getBackupQueueEvents() {
  return (_backupQueueEvents ??= new QueueEvents(QUEUE_NAMES.backup, {
    connection: createRedisConnection(),
  }));
}

export function getRestoreQueueEvents() {
  return (_restoreQueueEvents ??= new QueueEvents(QUEUE_NAMES.restore, {
    connection: createRedisConnection(),
  }));
}

export function getMigrateQueueEvents() {
  return (_migrateQueueEvents ??= new QueueEvents(QUEUE_NAMES.migrate, {
    connection: createRedisConnection(),
  }));
}
