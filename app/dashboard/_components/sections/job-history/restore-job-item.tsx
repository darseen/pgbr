import { Badge } from "@/components/ui/badge";
import { RestoreJob } from "@/db/schema";
import { formatDistanceToNow } from "date-fns";
import getStatusBadge from "./get-status-badge";
import getStatusIcon from "./get-status-icon";

interface Props {
  job: RestoreJob;
}

export default function RestoreJobItem({ job }: Props) {
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
