import z from "zod";

export interface BackupFlags {
  format: "custom" | "plain" | "directory" | "tar";
  compress: boolean;
  dataOnly: boolean;
  schemaOnly: boolean;
  clean: boolean;
  create: boolean;
  ifExists: boolean;
  noOwner: boolean;
  noPrivileges: boolean;
  verbose: boolean;
  jobs?: number | undefined;
  inserts?: boolean | undefined;
  excludeSchemas?: string[] | undefined;
  includeSchemas?: string[] | undefined;
  excludeTables?: string[] | undefined;
  includeTables?: string[] | undefined;
  excludeTableData?: string[] | undefined;
}

export const backupSchema = z
  .object({
    format: z.enum(["custom", "plain", "directory", "tar"]),
    compress: z.boolean(),
    dataOnly: z.boolean(),
    schemaOnly: z.boolean(),
    clean: z.boolean(),
    create: z.boolean(),
    ifExists: z.boolean(),
    noOwner: z.boolean(),
    noPrivileges: z.boolean(),
    verbose: z.boolean(),
    jobs: z.number().optional(),
    inserts: z.boolean().optional(),
    excludeSchemas: z.array(z.string()).optional(),
    includeSchemas: z.array(z.string()).optional(),
    excludeTables: z.array(z.string()).optional(),
    includeTables: z.array(z.string()).optional(),
    excludeTableData: z.array(z.string()).optional(),
  })
  .refine(
    (data) => !(data.jobs && data.jobs > 1 && data.format !== "directory"),
    {
      message:
        "Parallel backups (jobs > 1) are only supported with the 'directory' format.",
      path: ["jobs"],
    },
  )
  .refine((data) => !(data.dataOnly && data.schemaOnly), {
    message: "Cannot specify both dataOnly and schemaOnly.",
    path: ["dataOnly"],
  })
  .refine((data) => !(data.format === "tar" && data.compress), {
    message: "The 'tar' format does not support compression.",
    path: ["compress"],
  })
  .refine((data) => !(data.ifExists && !data.clean), {
    message:
      "The ifExists flag is only valid when the clean flag is also true.",
    path: ["ifExists"],
  });

export type BackupSchema = z.infer<typeof backupSchema>;
