import { db } from "@repo/db";
import { backupJobsTable } from "@repo/db/schema";
import { auth } from "@/lib/auth";
import { formatFileSize } from "@/utils";
import { desc, eq } from "drizzle-orm";
import { FileArchive, HardDrive, Loader2 } from "lucide-react";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PageHeader, PageShell } from "../_components/page-shell";
import StatCard from "../_components/stat-card";
import BackupsTable from "./_components/table";

export const metadata: Metadata = {
  title: "Backups",
};

export default async function BackupsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/");
  const userId = session.user.id;

  const backupJobs = await db
    .select()
    .from(backupJobsTable)
    .where(eq(backupJobsTable.userId, userId))
    .orderBy(desc(backupJobsTable.createdAt));

  const completedBackups = backupJobs.filter((j) => j.status === "completed");

  const totalSize = completedBackups.reduce(
    (acc, job) => acc + (Number(job.size) || 0),
    0,
  );

  return (
    <PageShell>
      <PageHeader
        title="Backups"
        description="Every backup artifact this instance has produced"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total Backups"
          value={backupJobs.length}
          hint={`${completedBackups.length} completed`}
          icon={FileArchive}
        />
        <StatCard
          label="Storage Used"
          value={formatFileSize(totalSize)}
          hint="Across all backups"
          icon={HardDrive}
        />
        <StatCard
          label="Running Now"
          value={backupJobs.filter((j) => j.status === "running").length}
          hint="Jobs in progress"
          icon={Loader2}
          className="sm:col-span-2 lg:col-span-1"
        />
      </div>

      <BackupsTable backupJobs={backupJobs} />
    </PageShell>
  );
}
