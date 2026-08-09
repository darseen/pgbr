"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import pingDatabase from "@/actions/database/ping";
import { BackupJob, Database } from "@repo/db/schema";
import {
  Activity,
  CalendarClock,
  CalendarDays,
  History,
  Loader2,
  Pencil,
  Server,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { Dispatch, SetStateAction, useState } from "react";
import { toast } from "sonner";
import BackupForm from "./backup-form";
import RestoreForm from "./restore-form";

interface Props {
  database: Database;
  backupJobs: BackupJob[];
  setSelectedDatabase: Dispatch<SetStateAction<Database | null>>;
  setOpenDeleteDialog: Dispatch<SetStateAction<boolean>>;
  setOpenAddDatabaseDialog: Dispatch<SetStateAction<boolean>>;
}

export default function DatabaseCard({
  database,
  backupJobs,
  setSelectedDatabase,
  setOpenAddDatabaseDialog,
  setOpenDeleteDialog,
}: Props) {
  const [pingStatus, setPingStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const backupCount = backupJobs.filter(
    (j) => j.databaseId === database.id && j.status === "completed",
  ).length;

  const handlePing = async () => {
    setPingStatus("loading");

    try {
      const { error } = await pingDatabase(database.id);

      if (error) {
        setPingStatus("error");
        return toast.error(error.message);
      }

      setPingStatus("success");
      toast.success("Database connection successful!");
    } catch {
      setPingStatus("error");
      toast.error("Failed to connect to the database.");
    } finally {
      setTimeout(() => setPingStatus("idle"), 3000);
    }
  };

  return (
    <Card
      key={database.id}
      className="hover:ring-primary/40 flex flex-col overflow-hidden transition-shadow hover:shadow-md"
    >
      <CardHeader className="border-border/40 bg-muted/10 border-b pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="bg-primary/10 flex shrink-0 items-center justify-center rounded-md p-2">
              <Server className="text-primary size-4" />
            </div>
            <CardTitle className="truncate text-base font-semibold">
              {database.name}
            </CardTitle>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant={
                pingStatus === "idle" || pingStatus === "loading"
                  ? "ghost"
                  : "default"
              }
              size="icon-sm"
              onClick={handlePing}
              disabled={pingStatus === "loading"}
              className={` ${pingStatus === "success" ? "bg-green-500 text-white hover:bg-green-600" : ""} ${pingStatus === "error" ? "bg-red-500 text-white hover:bg-red-600" : ""} `}
            >
              {pingStatus === "loading" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Activity className="size-4" />
              )}
              <span className="sr-only">Ping database</span>
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setSelectedDatabase(database);
                setOpenAddDatabaseDialog(true);
              }}
            >
              <Pencil className="size-4" />
              <span className="sr-only">Edit database</span>
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setSelectedDatabase(database);
                setOpenDeleteDialog(true);
              }}
            >
              <Trash2 className="text-destructive size-4" />
              <span className="sr-only">Delete database</span>
            </Button>
          </div>
        </div>

        <CardDescription className="mt-3">
          <code className="bg-muted text-muted-foreground block w-full truncate rounded-md px-2 py-1 font-mono text-xs">
            {database.url}
          </code>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className="text-muted-foreground gap-1.5 text-xs font-normal"
          >
            <CalendarDays className="size-3" />
            Added {new Date(database.createdAt).toLocaleDateString()}
          </Badge>
          <Badge
            variant="outline"
            className="text-muted-foreground gap-1.5 text-xs font-normal"
          >
            <History className="size-3" />
            {backupCount} {backupCount === 1 ? "Backup" : "Backups"}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 py-4">
        <BackupForm database={database} />
        <RestoreForm database={database} backupJobs={backupJobs} />
        <Button size="sm" variant="outline" asChild>
          <Link href={`/dashboard/schedules?new=1&databaseId=${database.id}`}>
            <CalendarClock className="mr-2 size-4" />
            Schedule
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
