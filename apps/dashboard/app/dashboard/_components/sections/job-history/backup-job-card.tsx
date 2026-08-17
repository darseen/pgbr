"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import SeparatorWithText from "@/components/ui/separator-with-text";
import StatusBadge from "@/components/status-badge";
import { BackupJob } from "@repo/db/schema";
import { parseJobTimestamp } from "@/utils";
import { formatDistanceToNow } from "date-fns";

interface Props {
  job: BackupJob;
}

export default function BackupJobCard({ job }: Props) {
  const startedAt = parseJobTimestamp(job.startedAt);
  const completedAt = parseJobTimestamp(job.completedAt);

  return (
    <Card className="hover:border-primary border transition-colors">
      <CardHeader>
        <div className="min-w-0 flex-1">
          <CardTitle className="flex flex-wrap items-center gap-2 text-base">
            <span className="truncate">{job.databaseName}</span>
            <StatusBadge status={job.status} />
          </CardTitle>
          <CardDescription className="mt-1 break-all">
            {job.storageKey}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <SeparatorWithText>Flags</SeparatorWithText>
        <div className="space-y-2">
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

        <Separator className="mt-4" />
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          {startedAt && (
            <span>
              Started {formatDistanceToNow(startedAt, { addSuffix: true })}
            </span>
          )}
          {completedAt && (
            <span>
              Completed {formatDistanceToNow(completedAt, { addSuffix: true })}
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
