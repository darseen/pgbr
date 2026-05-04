"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BackupJob } from "@/db/schema/backup-jobs";
import { RestoreJob } from "@/db/schema/restore-jobs";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  Clock,
  Download,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";

export default function JobHistory() {
  const backupJobs: BackupJob[] = [];
  const restoreJobs: RestoreJob[] = [];

  const hasJobs = backupJobs.length > 0 || restoreJobs.length > 0;

  if (!hasJobs) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Job History</CardTitle>
          <CardDescription>
            Your backup and restore operations will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex gap-2">
              <Download className="size-5" />
              <Upload className="size-5" />
            </div>
            <p>No jobs yet</p>
            <p className="text-sm">Run a backup or restore to see history</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Job History</CardTitle>
        <CardDescription>Recent backup and restore operations</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="backups">
          <TabsList className="mb-4">
            <TabsTrigger value="backups">
              <Download className="mr-1.5 size-4" />
              Backups ({backupJobs.length})
            </TabsTrigger>
            <TabsTrigger value="restores">
              <Upload className="mr-1.5 size-4" />
              Restores ({restoreJobs.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="backups">
            <ScrollArea className="h-100 pr-4">
              <div className="space-y-3">
                {backupJobs.length > 0 ? (
                  backupJobs.map((job) => (
                    <BackupJobItem key={job.id} job={job} />
                  ))
                ) : (
                  <p className="text-muted-foreground py-8 text-center">
                    No backup jobs yet
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="restores">
            <ScrollArea className="h-100 pr-4">
              <div className="space-y-3">
                {restoreJobs.length > 0 ? (
                  restoreJobs.map((job) => (
                    <RestoreJobItem key={job.id} job={job} />
                  ))
                ) : (
                  <p className="text-muted-foreground py-8 text-center">
                    No restore jobs yet
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="size-4 text-green-500" />;
    case "failed":
      return <XCircle className="text-destructive size-4" />;
    case "running":
      return <Loader2 className="size-4 animate-spin text-blue-500" />;
    case "pending":
    default:
      return <Clock className="text-muted-foreground size-4" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          Completed
        </Badge>
      );
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    case "running":
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
          Running
        </Badge>
      );
    case "pending":
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
}

function BackupJobItem({ job }: { job: BackupJob }) {
  return (
    <div className="bg-card flex items-start gap-3 rounded-lg border p-3">
      <div className="mt-0.5">{getStatusIcon(job.status)}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{job.databaseName}</span>
          {getStatusBadge(job.status)}
        </div>
        <p className="text-muted-foreground mt-1 truncate text-sm">
          {job.backupPath}
        </p>
        <div className="text-muted-foreground mt-2 flex items-center gap-4 text-xs">
          <span>
            Started{" "}
            {formatDistanceToNow(new Date(job.startedAt), { addSuffix: true })}
          </span>
          {job.completedAt && (
            <span>
              Completed{" "}
              {formatDistanceToNow(new Date(job.completedAt), {
                addSuffix: true,
              })}
            </span>
          )}
        </div>
        {job.error && (
          <p className="text-destructive bg-destructive/10 mt-2 rounded px-2 py-1 text-sm">
            {job.error}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-1">
          {job.flags.split(",").map((flag) => (
            <Badge key={flag} variant="outline" className="text-xs">
              {flag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

function RestoreJobItem({ job }: { job: RestoreJob }) {
  return (
    <div className="bg-card flex items-start gap-3 rounded-lg border p-3">
      <div className="mt-0.5">{getStatusIcon(job.status)}</div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{job.databaseName}</span>
          {getStatusBadge(job.status)}
        </div>
        <p className="text-muted-foreground mt-1 truncate text-sm">
          From: {job.backupPath}
        </p>
        <div className="text-muted-foreground mt-2 flex items-center gap-4 text-xs">
          <span>
            Started{" "}
            {formatDistanceToNow(new Date(job.startedAt), { addSuffix: true })}
          </span>
          {job.completedAt && (
            <span>
              Completed{" "}
              {formatDistanceToNow(new Date(job.completedAt), {
                addSuffix: true,
              })}
            </span>
          )}
        </div>
        {job.error && (
          <p className="text-destructive bg-destructive/10 mt-2 rounded px-2 py-1 text-sm">
            {job.error}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-1">
          {job.flags.split(",").map((flag) => (
            <Badge key={flag} variant="outline" className="text-xs">
              {flag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
