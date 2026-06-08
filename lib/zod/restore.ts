import z from "zod";

export const restoreSchema = z
  .object({
    format: z.enum(["custom", "directory", "tar"]),
    dataOnly: z.boolean(),
    schemaOnly: z.boolean(),
    clean: z.boolean(),
    create: z.boolean(),
    noOwner: z.boolean(),
    noPrivileges: z.boolean(),
    disableTriggers: z.boolean(),
    verbose: z.boolean(),
    jobs: z.number().optional(),
    singleTransaction: z.boolean(),
    exitOnError: z.boolean(),
    ifExists: z.boolean(),
    includeSchemas: z.array(z.string()).optional(),
    excludeSchemas: z.array(z.string()).optional(),
    includeTables: z.array(z.string()).optional(),
  })
  .refine((data) => !(data.jobs && data.jobs > 1 && data.singleTransaction), {
    message:
      "Parallel restores (jobs > 1) cannot be run within a singleTransaction.",
    path: ["singleTransaction"],
  })
  .refine((data) => !(data.dataOnly && data.schemaOnly), {
    message: "Cannot specify both dataOnly and schemaOnly.",
    path: ["dataOnly"],
  })
  .refine((data) => !(data.ifExists && !data.clean), {
    message:
      "The ifExists flag is only valid when the clean flag is also true.",
    path: ["ifExists"],
  });

export type RestoreSchema = z.infer<typeof restoreSchema>;
