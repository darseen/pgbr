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
import { MigrationJob } from "@repo/db/schema"; // Update this path to match where your schema is exported
import { formatDistanceToNow } from "date-fns";
import { ArrowRight } from "lucide-react";
import StatusBadge from "@/components/status-badge";
import { parseJobTimestamp } from "@/utils";

interface Props {
  job: MigrationJob;
  onClick?: (job: MigrationJob) => void;
}

export default function MigrationJobCard({ job, onClick }: Props) {
  const startedAt = parseJobTimestamp(job.startedAt);
  const completedAt = parseJobTimestamp(job.completedAt);

  return (
    <Card
      className="hover:border-primary border transition-colors hover:cursor-pointer"
      onClick={() => onClick?.(job)}
    >
      <CardHeader>
        <div className="min-w-0 flex-1">
          <CardTitle className="flex flex-wrap items-center gap-2 text-base">
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate">
                {job.sourceDatabaseName || "Unknown Source"}
              </span>
              <ArrowRight className="text-muted-foreground size-4 shrink-0" />
              <span className="truncate">
                {job.targetDatabaseName || "Unknown Target"}
              </span>
            </span>
            <StatusBadge status={job.status} />
          </CardTitle>
          <CardDescription className="mt-1 break-all">
            Job ID: {job.id}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Backup Flags */}
        {job.backupFlags && Object.keys(job.backupFlags).length > 0 && (
          <div className="space-y-2">
            <SeparatorWithText>Backup Flags</SeparatorWithText>
            <div className="flex flex-wrap gap-1">
              {Object.entries(job.backupFlags).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">{key}</span>
                  <Badge variant="outline" className="text-xs">
                    {String(value)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Restore Flags */}
        {job.restoreFlags && Object.keys(job.restoreFlags).length > 0 && (
          <div className="space-y-2">
            <SeparatorWithText>Restore Flags</SeparatorWithText>
            <div className="flex flex-wrap gap-1">
              {Object.entries(job.restoreFlags).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">{key}</span>
                  <Badge variant="outline" className="text-xs">
                    {String(value)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator className="mt-4" />

        <div className="text-muted-foreground flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            {startedAt && (
              <span>
                Started {formatDistanceToNow(startedAt, { addSuffix: true })}
              </span>
            )}
            {completedAt && (
              <>
                <span>•</span>
                <span>
                  Completed{" "}
                  {formatDistanceToNow(completedAt, { addSuffix: true })}
                </span>
              </>
            )}
          </div>

          {job.size > 0 && (
            <span className="font-mono">
              {(job.size / 1024 / 1024).toFixed(2)} MB
            </span>
          )}
        </div>

        {job.error && (
          <p className="text-destructive bg-destructive/10 mt-2 rounded px-2 py-1 text-sm">
            {job.error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
