export const SCHEDULE_PRESETS = [
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "custom",
] as const;

export type SchedulePreset = (typeof SCHEDULE_PRESETS)[number];
