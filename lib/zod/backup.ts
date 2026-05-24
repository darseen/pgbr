import z from "zod";

export const backupSchema = z
  .object({
    format: z.union([
      z.literal("custom"),
      z.literal("plain"),
      z.literal("directory"),
      z.literal("tar"),
    ]),
    compress: z.boolean(),
    dataOnly: z.boolean(),
    schemaOnly: z.boolean(),
    clean: z.boolean(),
    noOwner: z.boolean(),
    noPrivileges: z.boolean(),
    verbose: z.boolean(),
    jobs: z.number().optional(),
    excludeTables: z.array(z.string()).optional(),
    includeTables: z.array(z.string()).optional(),
  })
  .default({
    format: "custom",
    compress: true,
    dataOnly: false,
    schemaOnly: false,
    clean: false,
    noOwner: false,
    noPrivileges: false,
    verbose: true,
    jobs: 1,
  });

export type BackupSchema = z.infer<typeof backupSchema>;
