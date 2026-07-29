import { auth } from "@/lib/auth";
import { db } from "@repo/db";
import {
  backupJobsTable,
  backupSchedulesTable,
  databasesTable,
} from "@repo/db/schema";
import { parseExpression } from "cron-parser";
import { formatDistanceToNow } from "date-fns";
import { desc, eq, inArray } from "drizzle-orm";
import { CalendarClock, CalendarCheck, Timer } from "lucide-react";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PageHeader, PageShell } from "../_components/page-shell";
import StatCard from "../_components/stat-card";
import SchedulesTable, { type ScheduleWithMeta } from "./_components/table";

export const metadata: Metadata = {
  title: "Schedules",
};

interface Props {
  searchParams: Promise<{ new?: string; databaseId?: string }>;
}

export default async function SchedulesPage({ searchParams }: Props) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/");
  const userId = session.user.id;

  const params = await searchParams;

  const rows = await db
    .select({
      schedule: backupSchedulesTable,
      databaseName: databasesTable.name,
    })
    .from(backupSchedulesTable)
    .leftJoin(
      databasesTable,
      eq(backupSchedulesTable.databaseId, databasesTable.id),
    )
    .where(eq(backupSchedulesTable.userId, userId))
    .orderBy(desc(backupSchedulesTable.createdAt));

  const scheduleIds = rows.map((row) => row.schedule.id);
  const jobs = scheduleIds.length
    ? await db
        .select({
          scheduleId: backupJobsTable.scheduleId,
          status: backupJobsTable.status,
          startedAt: backupJobsTable.startedAt,
        })
        .from(backupJobsTable)
        .where(inArray(backupJobsTable.scheduleId, scheduleIds))
        .orderBy(desc(backupJobsTable.createdAt))
    : [];

  const lastJobBySchedule = new Map<string, (typeof jobs)[number]>();
  for (const job of jobs) {
    if (job.scheduleId && !lastJobBySchedule.has(job.scheduleId)) {
      lastJobBySchedule.set(job.scheduleId, job);
    }
  }

  const schedules: ScheduleWithMeta[] = rows.map(
    ({ schedule, databaseName }) => {
      let nextRunAt: string | null = null;
      if (schedule.enabled) {
        try {
          nextRunAt = parseExpression(schedule.cronExpression, {
            tz: schedule.timezone,
          })
            .next()
            .toDate()
            .toISOString();
        } catch {
          // Leave nextRunAt null for an unparseable stored expression.
        }
      }

      const lastJob = lastJobBySchedule.get(schedule.id);
      return {
        schedule,
        databaseName: databaseName ?? "Unknown",
        lastRunStatus: lastJob?.status ?? null,
        lastRunAt: lastJob?.startedAt ?? null,
        nextRunAt,
      };
    },
  );

  const databases = await db
    .select({ id: databasesTable.id, name: databasesTable.name })
    .from(databasesTable)
    .where(eq(databasesTable.userId, userId))
    .orderBy(databasesTable.name);

  const enabledSchedules = schedules.filter((s) => s.schedule.enabled);
  const soonestNextRun = enabledSchedules
    .map((s) => s.nextRunAt)
    .filter((d): d is string => d !== null)
    .sort()[0];

  return (
    <PageShell>
      <PageHeader
        title="Schedules"
        description="Recurring backups that run without you"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Schedules"
          value={schedules.length}
          hint="Automatic backup schedules"
          icon={CalendarClock}
        />
        <StatCard
          label="Enabled"
          value={enabledSchedules.length}
          hint={`${schedules.length - enabledSchedules.length} paused`}
          icon={CalendarCheck}
        />
        <StatCard
          label="Next Run"
          value={
            soonestNextRun
              ? formatDistanceToNow(new Date(soonestNextRun), {
                  addSuffix: true,
                })
              : "—"
          }
          hint="Across enabled schedules"
          icon={Timer}
          className="sm:col-span-2 lg:col-span-1"
        />
      </div>

      <SchedulesTable
        schedules={schedules}
        databases={databases}
        initialCreateOpen={params.new === "1"}
        initialDatabaseId={params.databaseId ?? null}
      />
    </PageShell>
  );
}
