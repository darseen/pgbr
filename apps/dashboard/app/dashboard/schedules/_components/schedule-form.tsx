"use client";

import createSchedule from "@/actions/schedule/create";
import updateSchedule from "@/actions/schedule/update";
import BackupFlagsFields from "@/components/forms/backup-flags-fields";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SeparatorWithText from "@/components/ui/separator-with-text";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_BACKUP_FLAGS } from "@/constants";
import { scheduleSchema, type ScheduleSchema } from "@/lib/zod/schedule";
import { BackupSchedule } from "@repo/db/schema";
import { SCHEDULE_PRESETS, type SchedulePreset } from "@repo/types";
import { zodResolver } from "@hookform/resolvers/zod";
import cronstrue from "cronstrue";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  schedule: BackupSchedule | null;
  databases: { id: string; name: string }[];
  initialDatabaseId: string | null;
}

const PRESET_LABELS: Record<SchedulePreset, string> = {
  hourly: "Hourly",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  custom: "Custom cron",
};

const DAYS_OF_WEEK = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

interface PresetState {
  preset: SchedulePreset;
  time: string;
  dayOfWeek: string;
  dayOfMonth: number;
}

function buildCron({ preset, time, dayOfWeek, dayOfMonth }: PresetState) {
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  switch (preset) {
    case "hourly":
      return "0 * * * *";
    case "daily":
      return `${minute} ${hour} * * *`;
    case "weekly":
      return `${minute} ${hour} * * ${dayOfWeek}`;
    case "monthly":
      return `${minute} ${hour} ${dayOfMonth} * *`;
    default:
      return null;
  }
}

// Reverse-map a stored cron onto the preset inputs; anything that doesn't
// match one of the four generated shapes edits as a custom expression.
function cronToPresetState(cron: string): PresetState {
  const state: PresetState = {
    preset: "custom",
    time: "00:00",
    dayOfWeek: "0",
    dayOfMonth: 1,
  };
  const time = (h: string, m: string) =>
    `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;

  let match;
  if (/^0 \* \* \* \*$/.test(cron)) {
    state.preset = "hourly";
  } else if ((match = cron.match(/^(\d{1,2}) (\d{1,2}) \* \* \*$/))) {
    state.preset = "daily";
    state.time = time(match[2], match[1]);
  } else if ((match = cron.match(/^(\d{1,2}) (\d{1,2}) \* \* ([0-6])$/))) {
    state.preset = "weekly";
    state.time = time(match[2], match[1]);
    state.dayOfWeek = match[3];
  } else if ((match = cron.match(/^(\d{1,2}) (\d{1,2}) (\d{1,2}) \* \*$/))) {
    state.preset = "monthly";
    state.time = time(match[2], match[1]);
    state.dayOfMonth = Number(match[3]);
  }
  return state;
}

function describeCron(expression: string) {
  try {
    return cronstrue.toString(expression);
  } catch {
    return null;
  }
}

const TIMEZONES = (() => {
  const zones = Intl.supportedValuesOf("timeZone");
  return zones.includes("UTC") ? zones : ["UTC", ...zones];
})();

export default function ScheduleForm({
  open,
  setOpen,
  schedule,
  databases,
  initialDatabaseId,
}: Props) {
  const router = useRouter();
  const isEdit = schedule !== null;

  const [isLoading, setIsLoading] = useState(false);
  const [presetState, setPresetState] = useState<PresetState>(() =>
    cronToPresetState(schedule?.cronExpression ?? "0 0 * * *"),
  );
  const [retentionEnabled, setRetentionEnabled] = useState(
    schedule ? schedule.keepLast != null : true,
  );

  const form = useForm<ScheduleSchema>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: schedule
      ? {
          ...schedule.flags,
          name: schedule.name,
          databaseId: schedule.databaseId,
          cronExpression: schedule.cronExpression,
          timezone: schedule.timezone,
          keepLast: schedule.keepLast,
          enabled: schedule.enabled,
        }
      : {
          ...DEFAULT_BACKUP_FLAGS,
          name: "",
          databaseId: initialDatabaseId ?? "",
          cronExpression: "0 0 * * *",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
          keepLast: 7,
          enabled: true,
        },
  });

  const cronExpression = form.watch("cronExpression");
  const cronDescription = describeCron(cronExpression);

  const applyPreset = (partial: Partial<PresetState>) => {
    const next = { ...presetState, ...partial };
    setPresetState(next);
    const cron = buildCron(next);
    if (cron) {
      form.setValue("cronExpression", cron, { shouldValidate: true });
    }
  };

  async function onSubmit(data: ScheduleSchema) {
    setIsLoading(true);
    try {
      const { error } = isEdit
        ? await updateSchedule(schedule.id, data)
        : await createSchedule(data);

      if (error) return toast.error(error.message);

      toast.success(isEdit ? "Schedule updated" : "Schedule created");
      router.refresh();
      setOpen(false);
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto md:min-w-lg">
        <DialogHeader className="mb-2 flex-col items-center justify-center">
          <DialogTitle>
            {isEdit ? "Edit Schedule" : "New Backup Schedule"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Update the automatic backup schedule "${schedule.name}".`
              : "Back up a database automatically on a recurring schedule."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="schedule-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5"
        >
          <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="schedule-name">Name</FieldLabel>
                  <Input
                    id="schedule-name"
                    placeholder="e.g. Nightly backup"
                    {...field}
                    disabled={isLoading}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="databaseId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="schedule-database">Database</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isLoading || isEdit}
                  >
                    <SelectTrigger
                      id="schedule-database"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="Select a database" />
                    </SelectTrigger>
                    <SelectContent>
                      {databases.map((database) => (
                        <SelectItem key={database.id} value={database.id}>
                          {database.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isEdit && (
                    <FieldDescription className="mt-1 text-xs">
                      The database cannot be changed after creation
                    </FieldDescription>
                  )}
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <SeparatorWithText>Schedule</SeparatorWithText>

          <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="schedule-preset">Frequency</FieldLabel>
              <Select
                value={presetState.preset}
                onValueChange={(v) =>
                  applyPreset({ preset: v as SchedulePreset })
                }
                disabled={isLoading}
              >
                <SelectTrigger id="schedule-preset" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULE_PRESETS.map((preset) => (
                    <SelectItem key={preset} value={preset}>
                      {PRESET_LABELS[preset]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {(presetState.preset === "daily" ||
              presetState.preset === "weekly" ||
              presetState.preset === "monthly") && (
              <Field>
                <FieldLabel htmlFor="schedule-time">Time</FieldLabel>
                <Input
                  type="time"
                  id="schedule-time"
                  value={presetState.time}
                  onChange={(e) => applyPreset({ time: e.target.value })}
                  disabled={isLoading}
                />
              </Field>
            )}

            {presetState.preset === "weekly" && (
              <Field>
                <FieldLabel htmlFor="schedule-day-of-week">
                  Day of Week
                </FieldLabel>
                <Select
                  value={presetState.dayOfWeek}
                  onValueChange={(v) => applyPreset({ dayOfWeek: v })}
                  disabled={isLoading}
                >
                  <SelectTrigger id="schedule-day-of-week" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            {presetState.preset === "monthly" && (
              <Field>
                <FieldLabel htmlFor="schedule-day-of-month">
                  Day of Month
                </FieldLabel>
                <Input
                  type="number"
                  id="schedule-day-of-month"
                  min={1}
                  max={28}
                  value={presetState.dayOfMonth}
                  onChange={(e) =>
                    applyPreset({
                      dayOfMonth: Math.min(
                        28,
                        Math.max(1, parseInt(e.target.value) || 1),
                      ),
                    })
                  }
                  disabled={isLoading}
                />
                <FieldDescription className="mt-1 text-xs">
                  Limited to 1–28 so the schedule fires every month
                </FieldDescription>
              </Field>
            )}

            {presetState.preset === "custom" && (
              <Controller
                name="cronExpression"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="schedule-cron">
                      Cron Expression
                    </FieldLabel>
                    <Input
                      id="schedule-cron"
                      placeholder="e.g. 0 3 * * *"
                      {...field}
                      disabled={isLoading}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            )}

            <Controller
              name="timezone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  data-invalid={fieldState.invalid}
                  className={
                    presetState.preset === "hourly" ? undefined : "sm:col-span-2"
                  }
                >
                  <FieldLabel htmlFor="schedule-timezone">Timezone</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isLoading}
                  >
                    <SelectTrigger
                      id="schedule-timezone"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="Select a timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((zone) => (
                        <SelectItem key={zone} value={zone}>
                          {zone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <div className="bg-muted/30 rounded-md border px-3 py-2 text-sm">
            {cronDescription ? (
              <span>
                Runs <span className="font-medium">{cronDescription}</span> (
                {form.watch("timezone")})
              </span>
            ) : (
              <span className="text-destructive">Invalid cron expression</span>
            )}
          </div>

          <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="schedule-retention"
                  checked={retentionEnabled}
                  onCheckedChange={(checked) => {
                    setRetentionEnabled(!!checked);
                    form.setValue(
                      "keepLast",
                      checked ? (schedule?.keepLast ?? 7) : null,
                      { shouldValidate: true },
                    );
                  }}
                  disabled={isLoading}
                />
                <FieldLabel
                  htmlFor="schedule-retention"
                  className="m-0 cursor-pointer text-sm font-normal"
                >
                  Prune old backups
                </FieldLabel>
              </div>
              <FieldDescription className="mt-1 text-xs">
                Delete this schedule&apos;s oldest backups automatically
              </FieldDescription>
            </Field>

            {retentionEnabled && (
              <Controller
                name="keepLast"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="schedule-keep-last">
                      Keep Last
                    </FieldLabel>
                    <Input
                      type="number"
                      id="schedule-keep-last"
                      min={1}
                      max={365}
                      value={field.value ?? 7}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 1)
                      }
                      disabled={isLoading}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            )}
          </FieldGroup>

          <Controller
            name="enabled"
            control={form.control}
            render={({ field }) => (
              <Field>
                <div className="flex items-center gap-2">
                  <Switch
                    id="schedule-enabled"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                  <FieldLabel
                    htmlFor="schedule-enabled"
                    className="m-0 cursor-pointer text-sm font-normal"
                  >
                    Enabled
                  </FieldLabel>
                </div>
              </Field>
            )}
          />

          <SeparatorWithText>Backup Options</SeparatorWithText>

          <BackupFlagsFields form={form} disabled={isLoading} />

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="schedule-form"
              disabled={isLoading}
              className="min-w-30"
            >
              {isLoading ? (
                <Spinner className="size-4" />
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Create Schedule"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
