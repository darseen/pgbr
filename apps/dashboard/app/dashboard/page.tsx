import { db } from "@repo/db";
import {
  backupJobsTable,
  databasesTable,
  migrationJobsTable,
  restoreJobsTable,
} from "@repo/db/schema";
import { auth } from "@/lib/auth";
import { maskDatabaseUrl } from "@/utils";
import { decrypt } from "@repo/shared";
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

  return (
    <main className="animate-in fade-in slide-in-from-bottom-4 container mx-auto flex-1 px-4 py-8 duration-500">
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_400px]">
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
    </main>
  );
}
