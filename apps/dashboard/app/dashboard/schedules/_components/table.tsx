"use client";

import toggleSchedule from "@/actions/schedule/toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BackupSchedule } from "@repo/db/schema";
import cronstrue from "cronstrue";
import { format, formatDistanceToNow } from "date-fns";
import { CalendarClock, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import getStatusBadge from "../../_components/sections/job-history/get-status-badge";
import DeleteScheduleDialog from "./delete-dialog";
import ScheduleForm from "./schedule-form";

export interface ScheduleWithMeta {
  schedule: BackupSchedule;
  databaseName: string;
  lastRunStatus: string | null;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

interface Props {
  schedules: ScheduleWithMeta[];
  databases: { id: string; name: string }[];
  initialCreateOpen: boolean;
  initialDatabaseId: string | null;
}

function describeCron(expression: string) {
  try {
    return cronstrue.toString(expression);
  } catch {
    return expression;
  }
}

export default function SchedulesTable({
  schedules,
  databases,
  initialCreateOpen,
  initialDatabaseId,
}: Props) {
  const router = useRouter();

  const [formOpen, setFormOpen] = useState(initialCreateOpen);
  const [selected, setSelected] = useState<BackupSchedule | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] =
    useState<BackupSchedule | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggle = async (schedule: BackupSchedule, enabled: boolean) => {
    setTogglingId(schedule.id);
    try {
      const { error } = await toggleSchedule(schedule.id, enabled);
      if (error) return toast.error(error.message);
      toast.success(`Schedule ${enabled ? "enabled" : "disabled"}`);
      router.refresh();
    } catch {
      toast.error("Failed to update the schedule");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Backup Schedules</CardTitle>
              <CardDescription>
                Recurring backups that run automatically in the background
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setSelected(null);
                setFormOpen(true);
              }}
            >
              <Plus className="mr-1.5 size-4" />
              New Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarClock className="text-muted-foreground/50 mb-4 size-12" />
              <h3 className="mb-1 text-lg font-medium">No schedules yet</h3>
              <p className="text-muted-foreground">
                Create a schedule to back up your databases automatically
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Database</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Next Run</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead>Retention</TableHead>
                    <TableHead>Enabled</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map(
                    ({
                      schedule,
                      databaseName,
                      lastRunStatus,
                      lastRunAt,
                      nextRunAt,
                    }) => (
                      <TableRow key={schedule.id}>
                        <TableCell className="font-medium">
                          {schedule.name}
                        </TableCell>
                        <TableCell>{databaseName}</TableCell>
                        <TableCell>
                          <span className="block text-sm">
                            {describeCron(schedule.cronExpression)}
                          </span>
                          <code className="text-muted-foreground text-xs">
                            {schedule.cronExpression} ({schedule.timezone})
                          </code>
                        </TableCell>
                        <TableCell>
                          {schedule.enabled && nextRunAt ? (
                            <div>
                              <span className="text-muted-foreground block text-sm">
                                {format(new Date(nextRunAt), "MMM d, HH:mm")}
                              </span>
                              <span className="text-muted-foreground block text-xs">
                                {formatDistanceToNow(new Date(nextRunAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {lastRunStatus ? (
                            <div className="space-y-1">
                              {getStatusBadge(lastRunStatus)}
                              {lastRunAt && (
                                <span className="text-muted-foreground block text-xs">
                                  {formatDistanceToNow(
                                    new Date(lastRunAt + "Z"),
                                    { addSuffix: true },
                                  )}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              Never
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {schedule.keepLast
                              ? `Keep last ${schedule.keepLast}`
                              : "Keep all"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={schedule.enabled}
                            disabled={togglingId === schedule.id}
                            onCheckedChange={(checked) =>
                              handleToggle(schedule, checked)
                            }
                            aria-label={`Toggle ${schedule.name}`}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Edit schedule"
                              onClick={() => {
                                setSelected(schedule);
                                setFormOpen(true);
                              }}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              title="Delete schedule"
                              onClick={() => {
                                setScheduleToDelete(schedule);
                                setDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ),
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ScheduleForm
        key={selected?.id ?? "new"}
        open={formOpen}
        setOpen={setFormOpen}
        schedule={selected}
        databases={databases}
        initialDatabaseId={initialDatabaseId}
      />

      <DeleteScheduleDialog
        open={deleteOpen}
        setOpen={setDeleteOpen}
        schedule={scheduleToDelete}
        onDeleted={() => setScheduleToDelete(null)}
      />
    </>
  );
}
