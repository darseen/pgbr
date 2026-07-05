export const QUEUE_NAMES = {
  backup: "backup",
  restore: "restore",
  migrate: "migrate",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
