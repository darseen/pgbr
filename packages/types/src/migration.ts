import z from "zod";
import { backupSchema } from "./backup.js";
import { restoreSchema } from "./restore.js";

export const migrationSchema = z
  .object({
    sourceId: z.string().optional(),
    targetId: z.string().optional(),
    sourceUrl: z.string().optional(),
    targetUrl: z.string().optional(),
    backupFlags: backupSchema,
    restoreFlags: restoreSchema,
  })
  .refine(
    (data) => (data.sourceId && data.sourceId !== "custom") || data.sourceUrl,
    {
      message: "Source database is required",
      path: ["sourceId"],
    },
  )
  .refine(
    (data) => (data.targetId && data.targetId !== "custom") || data.targetUrl,
    {
      message: "Target database is required",
      path: ["targetId"],
    },
  );

export type MigrationSchema = z.infer<typeof migrationSchema>;
