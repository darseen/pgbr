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
import { Database } from "@/db/schema";
import { BackupJob } from "@/db/schema/backup-jobs";
import { ApiResponse } from "@/types";
import {
  Activity,
  CalendarDays,
  History,
  Loader2,
  Pencil,
  Server,
  Trash2,
} from "lucide-react";
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

  const handlePing = async () => {
    setPingStatus("loading");

    try {
      const response = await fetch("/api/database/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: database.id }),
      });

      const { error } = (await response.json()) as ApiResponse<null>;

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
      className="hover:border-primary flex flex-col overflow-hidden border transition-all hover:scale-[1.01] hover:shadow-sm"
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
            {maskDatabaseUrl(database.url)}
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
            {database.backupCount}{" "}
            {database.backupCount === 1 ? "Backup" : "Backups"}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 py-4">
        <BackupForm database={database} />
        <RestoreForm database={database} backupJobs={backupJobs} />
      </CardFooter>
    </Card>
  );
}

function maskDatabaseUrl(urlString: string) {
  try {
    const parsedUrl = new URL(urlString);
    if (parsedUrl.password) {
      parsedUrl.password = "••••••••";
    }
    return decodeURIComponent(parsedUrl.toString());
  } catch {
    return urlString.replace(/:([^:@/]+)@/, ":••••••••@");
  }
}
