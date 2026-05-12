import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Database } from "@/db/schema";
import { BackupJob } from "@/db/schema/backup-jobs";
import { CalendarDays, History, Server } from "lucide-react";
import BackupForm from "./backup-form";
import DeleteDatabaseDialog from "./delete-dialog";
import DatabaseForm from "./form";
import RestoreForm from "./restore-form";

interface Props {
  database: Database;
  backupJobs: BackupJob[];
}

function maskDatabaseUrl(urlString: string) {
  try {
    const parsedUrl = new URL(urlString);
    if (parsedUrl.password) {
      parsedUrl.password = "••••••••";
    }
    return decodeURIComponent(parsedUrl.toString());
  } catch {
    return urlString.replace(/:([^:@/]+)@/, ":••••••••@");
  }
}

export default function DatabaseCard({ database, backupJobs }: Props) {
  const backupCount = backupJobs.length;

  return (
    <Card
      key={database.id}
      className="hover:border-primary flex flex-col overflow-hidden border transition-all hover:scale-[1.01] hover:shadow-sm"
    >
      <CardHeader className="border-border/40 bg-muted/10 border-b pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="bg-primary/10 flex shrink-0 items-center justify-center rounded-md p-2">
              <Server className="text-primary size-4" />
            </div>
            <CardTitle className="truncate text-base font-semibold">
              {database.name}
            </CardTitle>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <DatabaseForm database={database} />
            <DeleteDatabaseDialog database={database} />
          </div>
        </div>

        <CardDescription className="mt-3">
          <code className="bg-muted text-muted-foreground block w-full truncate rounded-md px-2 py-1 font-mono text-xs">
            {maskDatabaseUrl(database.url)}
          </code>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className="text-muted-foreground gap-1.5 text-xs font-normal"
          >
            <CalendarDays className="size-3" />
            Added {new Date(database.createdAt).toLocaleDateString()}
          </Badge>
          <Badge
            variant="outline"
            className="text-muted-foreground gap-1.5 text-xs font-normal"
          >
            <History className="size-3" />
            {backupCount} {backupCount === 1 ? "Backup" : "Backups"}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 py-4">
        <BackupForm database={database} />
        <RestoreForm database={database} backupJobs={backupJobs} />
      </CardFooter>
    </Card>
  );
}
