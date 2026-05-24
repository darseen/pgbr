import z from "zod";

export const restoreSchema = z
  .object({
    dataOnly: z.boolean(),
    schemaOnly: z.boolean(),
    clean: z.boolean(),
    noOwner: z.boolean(),
    noPrivileges: z.boolean(),
    verbose: z.boolean(),
    jobs: z.number().optional(),
    singleTransaction: z.boolean(),
    exitOnError: z.boolean(),
    ifExists: z.boolean(),
  })
  .default({
    dataOnly: false,
    schemaOnly: false,
    clean: true,
    noOwner: false,
    noPrivileges: false,
    verbose: true,
    jobs: 1,
    singleTransaction: false,
    exitOnError: true,
    ifExists: true,
  });

export type RestoreSchema = z.infer<typeof restoreSchema>;
