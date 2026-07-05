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
import getStatusBadge from "./get-status-badge";
import getStatusIcon from "./get-status-icon";

interface Props {
  job: MigrationJob;
  onClick?: (job: MigrationJob) => void;
}

export default function MigrationJobCard({ job, onClick }: Props) {
  return (
    <Card
      className="hover:border-primary border transition-colors hover:cursor-pointer"
      onClick={() => onClick?.(job)}
    >
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{getStatusIcon(job.status)}</div>
          <div className="min-w-0 flex-1">
            <CardTitle className="flex flex-wrap items-center gap-2 text-base">
              <span className="flex items-center gap-2">
                {job.sourceDatabaseName || "Unknown Source"}
                <ArrowRight className="text-muted-foreground h-4 w-4" />
                {job.targetDatabaseName || "Unknown Target"}
              </span>
              {getStatusBadge(job.status)}
            </CardTitle>
            <CardDescription className="mt-1 break-all">
              Job ID: {job.id}
            </CardDescription>
          </div>
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
            <span>
              Started{" "}
              {formatDistanceToNow(new Date(job.startedAt + "Z"), {
                addSuffix: true,
              })}
            </span>
            {job.completedAt && (
              <>
                <span>•</span>
                <span>
                  Completed{" "}
                  {formatDistanceToNow(new Date(job.completedAt ?? "" + "Z"), {
                    addSuffix: true,
                  })}
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
