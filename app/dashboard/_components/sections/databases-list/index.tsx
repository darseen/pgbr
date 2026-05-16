import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/db";
import { databasesTable } from "@/db/schema";
import { BackupJob } from "@/db/schema/backup-jobs";
import { auth } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";
import { Server } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DatabaseCard from "./card";
import DatabaseForm from "./form";

interface Props {
  backupJobs: BackupJob[];
}

export default async function DatabasesList({ backupJobs }: Props) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/");

  const databases = await db
    .select()
    .from(databasesTable)
    .where(eq(databasesTable.userId, session.user.id))
    .orderBy(desc(databasesTable.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Databases</h1>
          <p className="text-muted-foreground">
            Manage your PostgreSQL databases
          </p>
        </div>
        <DatabaseForm />
      </div>

      {databases.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-muted/50 mb-4 rounded-full p-4">
              <Server className="text-muted-foreground size-8" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">No databases yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm text-sm">
              Add your first PostgreSQL database to start managing automated
              backups and restores.
            </p>
            <DatabaseForm />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {databases.map((database) => (
            <DatabaseCard
              key={database.id}
              database={database}
              backupJobs={backupJobs}
            />
          ))}
        </div>
      )}
    </div>
  );
}
