import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/db";
import { backupJobsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { formatFileSize } from "@/utils";
import { desc, eq } from "drizzle-orm";
import { FileArchive, HardDrive, Loader2 } from "lucide-react";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
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
    <div className="bg-background animate-in fade-in slide-in-from-bottom-4 min-h-screen duration-500">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Backups</CardDescription>
              <CardTitle className="text-3xl">{backupJobs.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <FileArchive className="size-4" />
                <span>{completedBackups.length} completed</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Storage Used</CardDescription>
              <CardTitle className="text-3xl">
                {formatFileSize(totalSize)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <HardDrive className="size-4" />
                <span>Across all backups</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Recent Activity</CardDescription>
              <CardTitle className="text-3xl">
                {backupJobs.filter((j) => j.status === "running").length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="size-4" />
                <span>Jobs running</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <BackupsTable backupJobs={backupJobs} />
      </main>
    </div>
  );
}
