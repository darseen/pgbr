import { db } from "@repo/db";
import { backupJobsTable } from "@repo/db/schema";
import { auth } from "@/lib/auth";
import { formatFileSize } from "@/utils";
import { desc, eq } from "drizzle-orm";
import { CircleAlert, FileArchive, HardDrive, Loader2 } from "lucide-react";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PageHeader, PageShell } from "../_components/page-shell";
import StatCard from "../_components/stat-card";
import BackupsTable from "./_components/table";

export const metadata: Metadata = {
  title: "Backups",
};

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function BackupsPage({ searchParams }: Props) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/");
  const userId = session.user.id;

  const { status } = await searchParams;

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

  const running = backupJobs.filter((j) => j.status === "running").length;
  const failed = backupJobs.filter((j) => j.status === "failed").length;

  return (
    <PageShell>
      <PageHeader
        title="Backups"
        description="Every backup artifact this instance has produced"
        icon={FileArchive}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          value={running}
          hint={running > 0 ? "Jobs in progress" : "Nothing running"}
          icon={Loader2}
          tone={running > 0 ? "info" : "default"}
          spin={running > 0}
        />
        <StatCard
          label="Failed"
          value={failed}
          hint={failed > 0 ? "Show failed backups" : "All clear"}
          icon={CircleAlert}
          tone={failed > 0 ? "danger" : "success"}
          href="/dashboard/backups?status=failed"
        />
      </div>

      <BackupsTable backupJobs={backupJobs} initialStatus={status ?? null} />
    </PageShell>
  );
}
