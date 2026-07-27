import z from "zod";

export const storageSettingsSchema = z.object({
  endpoint: z.string().min(1, "Endpoint is required"),
  region: z.string().min(1, "Region is required"),
  bucket: z.string().min(1, "Bucket is required"),
  accessKeyId: z.string().min(1, "Access key ID is required"),
  // Empty means "keep the currently stored secret" (or fall back to the env
  // default when nothing is configured yet), so the secret never has to be
  // re-entered just to change another field.
  secretAccessKey: z.string(),
  forcePathStyle: z.boolean(),
});

export type StorageSettingsSchema = z.infer<typeof storageSettingsSchema>;
