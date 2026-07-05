import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { MigrationJobStatus } from "@repo/db/schema";
import {
  AlertCircle,
  CheckCircle2,
  DatabaseIcon,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface Props {
  migration: {
    currentStep: string;
    status: MigrationJobStatus;
    error?: string | null;
  };
  handleReset: () => void;
}

export default function MigrationProgress({ migration, handleReset }: Props) {
  const { status, error } = migration;

  return (
    <Card className="animate-in fade-in zoom-in-95 border-primary/20 shadow-lg duration-300">
      <CardHeader className="bg-primary/5 border-b pb-6">
        <CardTitle className="flex items-center gap-2 text-xl">
          {status === "failed" ? (
            <AlertCircle className="text-destructive size-5" />
          ) : status === "completed" ? (
            <CheckCircle2 className="size-5 text-emerald-500" />
          ) : (
            <Loader2 className="text-primary size-5 animate-spin" />
          )}

          {status === "failed"
            ? "Migration Failed"
            : status === "completed"
              ? "Migration Completed"
              : "Migration in Progress"}
        </CardTitle>

        <CardDescription className="text-base">
          {status === "failed"
            ? "An error occurred during the migration process. Please review the details below."
            : status === "completed"
              ? "The database migration has finished successfully."
              : "Please do not close this tab while your database is being migrated."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 pt-8">
        <div
          className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
            status === "running"
              ? "bg-primary/5 border-primary/20 shadow-sm"
              : "border-transparent bg-transparent"
          }`}
        >
          <div
            className={`flex size-12 shrink-0 items-center justify-center rounded-full ${
              status === "running"
                ? "bg-primary text-primary-foreground shadow-md"
                : status === "completed"
                  ? "bg-emerald-500 text-white"
                  : status === "failed"
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-muted text-muted-foreground"
            }`}
          >
            {status === "running" ? (
              <Spinner className="size-6" />
            ) : status === "completed" ? (
              <CheckCircle2 className="size-6" />
            ) : status === "failed" ? (
              <AlertCircle className="size-6" />
            ) : (
              <DatabaseIcon className="size-6" />
            )}
          </div>
          <div className="flex-1 space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <h4
                className={`text-lg font-semibold ${
                  status === "running" ? "text-primary" : ""
                }`}
              >
                Streaming Database Migration
              </h4>
              <Badge
                variant={
                  status === "completed"
                    ? "default"
                    : status === "failed"
                      ? "destructive"
                      : "secondary"
                }
                className={
                  status === "completed"
                    ? "bg-emerald-500 hover:bg-emerald-600"
                    : ""
                }
              >
                {status === "running"
                  ? "Running..."
                  : status === "completed"
                    ? "Completed"
                    : status === "failed"
                      ? "Failed"
                      : "Pending"}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Directly streaming data from the source to the target database.
            </p>
            {error && (
              <div className="w-full space-y-3">
                <div className="text-destructive bg-destructive/10 mt-2 max-h-60 w-full overflow-y-auto rounded-md p-3 font-mono text-xs font-medium wrap-break-word whitespace-pre-wrap">
                  {error}
                </div>
                {status === "failed" && (
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    size="sm"
                    className="mt-2 gap-2"
                  >
                    <RefreshCw className="size-4" />
                    Start Another Migration
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
