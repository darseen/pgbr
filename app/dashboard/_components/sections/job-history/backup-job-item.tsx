import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { BackupJob } from "@/db/schema";
import { formatDistanceToNow } from "date-fns";
import getStatusBadge from "./get-status-badge";
import getStatusIcon from "./get-status-icon";

interface Props {
  job: BackupJob;
}

export default function BackupJobItem({ job }: Props) {
  return (
    <Card>
      <CardHeader className="pb-3">
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

      <CardContent className="space-y-4">
        <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-xs">
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
          <p className="text-destructive bg-destructive/10 rounded px-2 py-1 text-sm">
            {job.error}
          </p>
        )}

        <div className="space-y-2">
          <Label>Flags:</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
      </CardContent>
    </Card>
  );
}
