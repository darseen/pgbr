import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/db";
import { databasesTable } from "@/db/schema";
import { BackupJob } from "@/db/schema/backup-jobs";
import { Server } from "lucide-react";
import BackupForm from "../backup-form";
import RestoreForm from "../restore-form";
import DeleteDatabaseDialog from "./delete-dialog";
import DatabaseForm from "./form";

export default async function DatabasesList() {
  const databases = await db.select().from(databasesTable);
  const backupJobs: BackupJob[] = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Databases</h1>
          <p className="text-muted-foreground">
            Manage your PostgreSQL databases
          </p>
        </div>
        <DatabaseForm />
      </div>

      {databases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Server className="text-muted-foreground/50 mb-4 size-12" />
            <h3 className="mb-1 text-lg font-medium">No databases yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first PostgreSQL database to get started
            </p>
            <DatabaseForm />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {databases.map((database) => (
            <Card key={database.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="text-muted-foreground size-4" />
                    <CardTitle className="text-base">{database.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <DatabaseForm database={database} />
                    <DeleteDatabaseDialog database={database} />
                  </div>
                </div>
                <CardDescription className="truncate font-mono text-xs">
                  {database.url}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {new Date(database.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <BackupForm database={database} />
                  <RestoreForm database={database} backupJobs={backupJobs} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
