import { auth } from "@/lib/auth";
import type { ActivityItem } from "@/types";
import { db } from "@repo/db";
import {
  activityEventsTable,
  backupJobsTable,
  migrationJobsTable,
  restoreJobsTable,
} from "@repo/db/schema";
import { desc, eq } from "drizzle-orm";
import { Activity, CircleAlert, Loader2 } from "lucide-react";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PageHeader, PageShell } from "../_components/page-shell";
import StatCard from "../_components/stat-card";
import ActivityTable from "./_components/table";

export const metadata: Metadata = {
  title: "Activity",
};

// The job tables store naive timestamps that are already UTC; the "Z" is what
// stops the browser from re-reading them in local time.
function toIso(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export default async function ActivityPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");
  const userId = session.user.id;

  const [backupJobs, restoreJobs, migrationJobs, events] = await Promise.all([
    db
      .select()
      .from(backupJobsTable)
      .where(eq(backupJobsTable.userId, userId))
      .orderBy(desc(backupJobsTable.createdAt)),
    db
      .select()
      .from(restoreJobsTable)
      .where(eq(restoreJobsTable.userId, userId))
      .orderBy(desc(restoreJobsTable.createdAt)),
    db
      .select()
      .from(migrationJobsTable)
      .where(eq(migrationJobsTable.userId, userId))
      .orderBy(desc(migrationJobsTable.createdAt)),
    db
      .select()
      .from(activityEventsTable)
      .where(eq(activityEventsTable.userId, userId))
      .orderBy(desc(activityEventsTable.createdAt)),
  ]);

  const items: ActivityItem[] = [
    ...backupJobs.map<ActivityItem>((job) => ({
      id: job.id,
      kind: "backup",
      title: job.databaseName,
      subtitle: job.storageKey,
      status: job.status,
      timestamp: toIso(job.startedAt) ?? job.createdAt.toISOString(),
      completedAt: toIso(job.completedAt),
      databaseName: job.databaseName,
      storageKey: job.storageKey,
      size: job.size,
      error: job.error,
      backupFlags: job.flags,
      restoreFlags: null,
      action: null,
      details: null,
    })),
    ...restoreJobs.map<ActivityItem>((job) => ({
      id: job.id,
      kind: "restore",
      title: job.databaseName,
      subtitle: `From ${job.storageKey}`,
      status: job.status,
      timestamp: toIso(job.startedAt) ?? job.createdAt.toISOString(),
      completedAt: toIso(job.completedAt),
      databaseName: job.databaseName,
      storageKey: job.storageKey,
      size: null,
      error: job.error,
      backupFlags: null,
      restoreFlags: job.flags,
      action: null,
      details: null,
    })),
    // sourceDatabaseUrl / targetDatabaseUrl are deliberately dropped: they are
    // encrypted connection strings with no business reaching the browser.
    ...migrationJobs.map<ActivityItem>((job) => ({
      id: job.id,
      kind: "migration",
      title: `${job.sourceDatabaseName ?? "Unknown source"} → ${job.targetDatabaseName ?? "Unknown target"}`,
      subtitle: `Job ${job.id}`,
      status: job.status,
      timestamp: toIso(job.startedAt) ?? job.createdAt.toISOString(),
      completedAt: toIso(job.completedAt),
      databaseName: job.sourceDatabaseName,
      storageKey: null,
      size: job.size,
      error: job.error,
      backupFlags: job.backupFlags,
      restoreFlags: job.restoreFlags,
      action: null,
      details: null,
    })),
    ...events.map<ActivityItem>((event) => ({
      id: event.id,
      kind: "event",
      title: event.summary,
      subtitle: event.action,
      status: "logged",
      timestamp: event.createdAt.toISOString(),
      completedAt: null,
      databaseName:
        typeof event.details?.databaseName === "string"
          ? event.details.databaseName
          : null,
      storageKey: null,
      size: null,
      error: null,
      backupFlags: null,
      restoreFlags: null,
      action: event.action,
      details: event.details,
    })),
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const running = items.filter((item) => item.status === "running").length;
  const failed = items.filter((item) => item.status === "failed").length;

  return (
    <PageShell>
      <PageHeader
        title="Activity"
        description="Every job this instance ran and every change you made"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Activity"
          value={items.length}
          hint={`${events.length} logged ${events.length === 1 ? "action" : "actions"}`}
          icon={Activity}
        />
        <StatCard
          label="Running Now"
          value={running}
          hint="Jobs in progress"
          icon={Loader2}
        />
        <StatCard
          label="Failed"
          value={failed}
          hint="Jobs that did not finish"
          icon={CircleAlert}
          className="sm:col-span-2 lg:col-span-1"
        />
      </div>

      <ActivityTable items={items} />
    </PageShell>
  );
}
