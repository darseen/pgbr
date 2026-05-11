"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BackupJob } from "@/db/schema";
import { formatDistanceToNow } from "date-fns";
import getStatusBadge from "./get-status-badge";
import getStatusIcon from "./get-status-icon";

interface Props {
  job: BackupJob;
  onDownloadClick: (job: BackupJob) => void;
}

export default function BackupJobCard({ job, onDownloadClick }: Props) {
  return (
    <Card
      className="hover:border-primary border transition-colors hover:cursor-pointer"
      onClick={() => onDownloadClick(job)}
    >
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{getStatusIcon(job.status)}</div>
          <div className="min-w-0 flex-1">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              <span>{job.databaseName}</span>
              {getStatusBadge(job.status)}
            </CardTitle>
            <CardDescription className="mt-1 break-all">
              {job.backupPath}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <Separator />
        <div className="space-y-2">
          <Label>Flags:</Label>
          <div className="flex flex-wrap gap-1">
            {Object.entries(job.flags).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">{key}</span>
                <Badge variant="outline" className="text-xs">
                  {String(value)}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <Separator />
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <span>
            Started{" "}
            {formatDistanceToNow(new Date(job.startedAt + "Z"), {
              addSuffix: true,
            })}
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
          <p className="text-destructive bg-destructive/10 rounded px-2 py-1 text-sm">
            {job.error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
