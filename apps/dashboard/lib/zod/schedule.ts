import { applyBackupRefinements, backupBaseSchema } from "@repo/types";
import { parseExpression } from "cron-parser";
import z from "zod";

// Flat shape (schedule fields + backup flags at one level) so the shared
// BackupFlagsFields fieldset plugs into a single useForm.
export const scheduleSchema = applyBackupRefinements(
  backupBaseSchema.extend({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be at most 100 characters"),
    databaseId: z.string().min(1, "Database is required"),
    cronExpression: z.string().superRefine((value, ctx) => {
      if (value.trim().split(/\s+/).length !== 5) {
        ctx.addIssue({
          code: "custom",
          message:
            "Cron expression must have 5 fields (minute hour day month weekday)",
        });
        return;
      }
      try {
        parseExpression(value);
      } catch {
        ctx.addIssue({ code: "custom", message: "Invalid cron expression" });
      }
    }),
    timezone: z.string().superRefine((value, ctx) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: value });
      } catch {
        ctx.addIssue({ code: "custom", message: "Invalid timezone" });
      }
    }),
    keepLast: z
      .number()
      .int()
      .min(1, "Must keep at least 1 backup")
      .max(365, "Cannot keep more than 365 backups")
      .nullable(),
    enabled: z.boolean(),
  }),
);

export type ScheduleSchema = z.infer<typeof scheduleSchema>;

export function splitScheduleInput(data: ScheduleSchema) {
  const { name, databaseId, cronExpression, timezone, keepLast, enabled, ...flags } =
    data;
  return {
    scheduleFields: { name, databaseId, cronExpression, timezone, keepLast, enabled },
    flags,
  };
}
