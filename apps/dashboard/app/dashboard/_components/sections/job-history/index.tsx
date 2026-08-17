import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BackupJob, MigrationJob, RestoreJob } from "@repo/db/schema";
import {
  ArrowDownUp,
  ArrowRight,
  Download,
  History,
  Upload,
} from "lucide-react";
import Link from "next/link";
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
            <EmptyState
              icon={History}
              title="No jobs yet"
              description="Run a backup from a database above, or migrate one database into another, and the run shows up here."
              className="py-10"
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle>Job History</CardTitle>
            <CardDescription>
              Recent backup and restore operations
            </CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/activity">
                  View all
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </CardAction>
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
                <ScrollArea className="h-100 pr-4 xl:h-[calc(100svh-30rem)]">
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
                <ScrollArea className="h-100 pr-4 xl:h-[calc(100svh-30rem)]">
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
                <ScrollArea className="h-100 pr-4 xl:h-[calc(100svh-30rem)]">
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
