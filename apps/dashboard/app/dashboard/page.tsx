import { auth } from "@/lib/auth";
import { formatFileSize, maskDatabaseUrl, parseJobTimestamp } from "@/utils";
import { db } from "@repo/db";
import {
  backupJobsTable,
  databasesTable,
  migrationJobsTable,
  restoreJobsTable,
} from "@repo/db/schema";
import { decrypt } from "@repo/shared";
import { formatDistanceToNow } from "date-fns";
import { desc, eq } from "drizzle-orm";
import {
  CircleAlert,
  Database,
  FileArchive,
  HardDrive,
  LayoutDashboard,
} from "lucide-react";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PageHeader, PageShell } from "./_components/page-shell";
import DatabasesList from "./_components/sections/databases-list";
import JobHistory from "./_components/sections/job-history";
import StatCard from "./_components/stat-card";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/");
  const userId = session.user.id;

  const [backupJobs, restoreJobs, databases, migrationJobs] = await Promise.all(
    [
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
        .from(databasesTable)
        .where(eq(databasesTable.userId, session.user.id))
        .orderBy(desc(databasesTable.createdAt)),
      db
        .select()
        .from(migrationJobsTable)
        .where(eq(migrationJobsTable.userId, userId))
        .orderBy(desc(migrationJobsTable.createdAt)),
    ],
  );

  const completedBackups = backupJobs.filter((j) => j.status === "completed");
  const storageUsed = completedBackups.reduce(
    (total, job) => total + (Number(job.size) || 0),
    0,
  );
  const failed = [...backupJobs, ...restoreJobs, ...migrationJobs].filter(
    (job) => job.status === "failed",
  ).length;
  const lastBackupAt = parseJobTimestamp(completedBackups[0]?.completedAt);

  return (
    <PageShell>
      <PageHeader
        title="Overview"
        description="Your databases and everything this instance has been doing"
        icon={LayoutDashboard}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Databases"
          value={databases.length}
          hint={databases.length === 0 ? "None added yet" : "Under management"}
          icon={Database}
        />
        <StatCard
          label="Backups"
          value={completedBackups.length}
          hint={
            lastBackupAt
              ? `Last ${formatDistanceToNow(lastBackupAt, { addSuffix: true })}`
              : "None yet"
          }
          icon={FileArchive}
          tone="success"
          href="/dashboard/backups"
        />
        <StatCard
          label="Storage Used"
          value={formatFileSize(storageUsed)}
          hint="Across all backups"
          icon={HardDrive}
        />
        <StatCard
          label="Failed Jobs"
          value={failed}
          hint={failed > 0 ? "Needs a look" : "All clear"}
          icon={CircleAlert}
          tone={failed > 0 ? "danger" : "success"}
          href="/dashboard/activity?status=failed"
        />
      </div>

      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-8">
        <DatabasesList
          backupJobs={backupJobs}
          databases={databases.map((db) => ({
            ...db,
            url: maskDatabaseUrl(decrypt(db.url)),
          }))}
        />
        <JobHistory
          restoreJobs={restoreJobs}
          backupJobs={backupJobs}
          migrationJobs={migrationJobs}
        />
      </div>
    </PageShell>
  );
}
