import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BackupJob, MigrationJob, RestoreJob } from "@repo/db/schema";
import { ArrowDownUp, Download, Upload } from "lucide-react";
import BackupJobCard from "./backup-job-card";
import MigrationJobCard from "./migration-job-card";
import RestoreJobItem from "./restore-job-card";

interface Props {
  restoreJobs: RestoreJob[];
  backupJobs: BackupJob[];
  migrationJobs: MigrationJob[];
}

export default function JobHistory({
  restoreJobs,
  backupJobs,
  migrationJobs,
}: Props) {
  const hasJobs = backupJobs.length > 0 || restoreJobs.length > 0;

  return (
    <section className="w-full min-w-0 xl:sticky xl:top-20">
      {!hasJobs ? (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Job History</CardTitle>
            <CardDescription>
              Your backup, restore, and migration operations will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex gap-3">
                <Download className="size-6 opacity-50" />
                <Upload className="size-6 opacity-50" />
              </div>
              <p className="text-foreground font-medium">No jobs yet</p>
              <p className="text-sm">
                Run a backup, restore, or migrate to see history
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle>Job History</CardTitle>
            <CardDescription>
              Recent backup and restore operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="backups" className="w-full">
              <TabsList className="mb-4 grid w-full grid-cols-3">
                <TabsTrigger value="backups">
                  <Download className="size-4" />
                  Backups
                </TabsTrigger>
                <TabsTrigger value="restores">
                  <Upload className="size-4" />
                  Restores
                </TabsTrigger>
                <TabsTrigger value="migrations">
                  <ArrowDownUp className="size-4" />
                  Migrations
                </TabsTrigger>
              </TabsList>

              <TabsContent value="backups" className="mt-0">
                <ScrollArea className="h-100 pr-4 xl:h-[calc(100svh-22rem)]">
                  <div className="space-y-3">
                    {backupJobs.length > 0 ? (
                      backupJobs.map((job) => (
                        <BackupJobCard key={job.id} job={job} />
                      ))
                    ) : (
                      <p className="text-muted-foreground py-8 text-center text-sm">
                        No backup jobs yet
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="restores" className="mt-0">
                <ScrollArea className="h-100 pr-4 xl:h-[calc(100svh-22rem)]">
                  <div className="space-y-3">
                    {restoreJobs.length > 0 ? (
                      restoreJobs.map((job) => (
                        <RestoreJobItem key={job.id} job={job} />
                      ))
                    ) : (
                      <p className="text-muted-foreground py-8 text-center text-sm">
                        No restore jobs yet
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="migrations" className="mt-0">
                <ScrollArea className="h-100 pr-4 xl:h-[calc(100svh-22rem)]">
                  <div className="space-y-3">
                    {migrationJobs.length > 0 ? (
                      migrationJobs.map((job) => (
                        <MigrationJobCard key={job.id} job={job} />
                      ))
                    ) : (
                      <p className="text-muted-foreground py-8 text-center text-sm">
                        No migration jobs yet
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
