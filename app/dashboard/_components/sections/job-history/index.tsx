"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BackupJob, RestoreJob } from "@/db/schema";
import { Download, Upload } from "lucide-react";
import { useState } from "react";
import BackupJobCard from "./backup-job-card";
import DownloadDialog from "./download-dialog";
import RestoreJobItem from "./restore-job-card";

interface Props {
  restoreJobs: RestoreJob[];
  backupJobs: BackupJob[];
}

export default function JobHistory({ restoreJobs, backupJobs }: Props) {
  const [selectedJob, setSelectedJob] = useState<BackupJob | null>(null);

  const hasJobs = backupJobs.length > 0 || restoreJobs.length > 0;

  return (
    <section className="sticky top-8 w-full">
      {!hasJobs ? (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Job History</CardTitle>
            <CardDescription>
              Your backup and restore operations will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex gap-3">
                <Download className="size-6 opacity-50" />
                <Upload className="size-6 opacity-50" />
              </div>
              <p className="text-foreground font-medium">No jobs yet</p>
              <p className="text-sm">Run a backup or restore to see history</p>
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
              <TabsList className="mb-4 grid w-full grid-cols-2">
                <TabsTrigger value="backups">
                  <Download className="mr-2 size-4" />
                  Backups ({backupJobs.length})
                </TabsTrigger>
                <TabsTrigger value="restores">
                  <Upload className="mr-2 size-4" />
                  Restores ({restoreJobs.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="backups" className="mt-0">
                <ScrollArea className="h-100 pr-4 lg:h-[calc(100vh-20rem)]">
                  <div className="space-y-3">
                    {backupJobs.length > 0 ? (
                      backupJobs.map((job) => (
                        <BackupJobCard
                          key={job.id}
                          job={job}
                          onDownloadClick={() => setSelectedJob(job)}
                        />
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
                <ScrollArea className="h-100 pr-4 lg:h-[calc(100vh-20rem)]">
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
            </Tabs>
          </CardContent>
        </Card>
      )}

      <DownloadDialog
        job={selectedJob}
        isOpen={selectedJob !== null}
        setSelectedJob={setSelectedJob}
      />
    </section>
  );
}
