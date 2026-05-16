import { db } from "@/db";
import { backupJobsTable, restoreJobsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DatabasesList from "./_components/sections/databases-list";
import JobHistory from "./_components/sections/job-history";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/");

  const [backupJobs, restoreJobs] = await Promise.all([
    db
      .select()
      .from(backupJobsTable)
      .where(eq(backupJobsTable.userId, session.user.id))
      .orderBy(desc(backupJobsTable.createdAt)),
    db
      .select()
      .from(restoreJobsTable)
      .where(eq(restoreJobsTable.userId, session.user.id))
      .orderBy(desc(restoreJobsTable.createdAt)),
  ]);

  return (
    <main className="container mx-auto flex-1 px-4 py-8">
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_400px]">
        <DatabasesList backupJobs={backupJobs} />
        <JobHistory restoreJobs={restoreJobs} backupJobs={backupJobs} />
      </div>
    </main>
  );
}
