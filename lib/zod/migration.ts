import z from "zod";
import { backupSchema } from "./backup";
import { restoreSchema } from "./restore";

export const migrationSchema = z.object({
  sourceId: z.string().optional(),
  targetId: z.string().optional(),
  sourceUrl: z.url().optional(),
  targetUrl: z.url().optional(),
  backupFlags: backupSchema,
  restoreFlags: restoreSchema,
});

export type MigrationSchema = z.infer<typeof migrationSchema>;
