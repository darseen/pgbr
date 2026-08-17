"use client";

import toggleSchedule from "@/actions/schedule/toggle";
import ColumnHeader from "@/components/data-table/column-header";
import DataTablePagination from "@/components/data-table/pagination";
import StatusBadge from "@/components/status-badge";
import TimeCell from "@/components/time-cell";
import TooltipButton from "@/components/tooltip-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import cronstrue from "cronstrue";
import { CalendarClock, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
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

  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "nextRunAt", desc: false },
  ]);

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

  const columns: ColumnDef<ScheduleWithMeta>[] = [
    {
      id: "name",
      accessorFn: (row) => row.schedule.name,
      header: ({ column }) => <ColumnHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <span className="font-medium">{row.original.schedule.name}</span>
      ),
    },
    {
      id: "databaseName",
      accessorFn: (row) => row.databaseName,
      header: ({ column }) => <ColumnHeader column={column} title="Database" />,
    },
    {
      id: "cron",
      accessorFn: (row) => row.schedule.cronExpression,
      header: "Schedule",
      enableSorting: false,
      cell: ({ row }) => (
        <div className="min-w-0">
          <span className="block text-sm">
            {describeCron(row.original.schedule.cronExpression)}
          </span>
          <code className="text-muted-foreground text-xs">
            {row.original.schedule.cronExpression} (
            {row.original.schedule.timezone})
          </code>
        </div>
      ),
    },
    {
      id: "nextRunAt",
      // Disabled schedules sort last rather than first, where an empty string
      // would otherwise put them.
      accessorFn: (row) => row.nextRunAt ?? "9999",
      header: ({ column }) => <ColumnHeader column={column} title="Next Run" />,
      cell: ({ row }) =>
        row.original.schedule.enabled && row.original.nextRunAt ? (
          <TimeCell value={row.original.nextRunAt} />
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Paused
          </Badge>
        ),
    },
    {
      id: "lastRunAt",
      accessorFn: (row) => row.lastRunAt ?? "",
      header: ({ column }) => <ColumnHeader column={column} title="Last Run" />,
      cell: ({ row }) =>
        row.original.lastRunStatus ? (
          <div className="space-y-1">
            <StatusBadge status={row.original.lastRunStatus} />
            {row.original.lastRunAt && (
              <TimeCell value={row.original.lastRunAt} />
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Never</span>
        ),
    },
    {
      id: "retention",
      accessorFn: (row) => row.schedule.keepLast ?? 0,
      header: ({ column }) => (
        <ColumnHeader column={column} title="Retention" />
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.original.schedule.keepLast
            ? `Keep last ${row.original.schedule.keepLast}`
            : "Keep all"}
        </Badge>
      ),
    },
    {
      id: "enabled",
      accessorFn: (row) => (row.schedule.enabled ? "enabled" : "paused"),
      header: "Enabled",
      enableSorting: false,
      cell: ({ row }) => (
        <Switch
          checked={row.original.schedule.enabled}
          disabled={togglingId === row.original.schedule.id}
          onCheckedChange={(checked) =>
            handleToggle(row.original.schedule, checked)
          }
          aria-label={`Toggle ${row.original.schedule.name}`}
        />
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <TooltipButton
            label="Edit schedule"
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setSelected(row.original.schedule);
              setFormOpen(true);
            }}
          >
            <Pencil className="size-4" />
          </TooltipButton>
          <TooltipButton
            label="Delete schedule"
            variant="ghost"
            size="icon-sm"
            className="hover:bg-destructive/10 hover:text-destructive text-destructive"
            onClick={() => {
              setScheduleToDelete(row.original.schedule);
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="size-4" />
          </TooltipButton>
        </div>
      ),
    },
  ];

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: schedules,
    columns,
    getRowId: (row) => row.schedule.id,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    initialState: { pagination: { pageSize: 10 } },
    state: { globalFilter, columnFilters, sorting },
    globalFilterFn: (row, columnId, filterValue) => {
      const search = String(filterValue).toLowerCase();
      return [row.original.schedule.name, row.original.databaseName].some(
        (value) => value?.toLowerCase().includes(search),
      );
    },
  });

  const hasFilters = Boolean(globalFilter) || columnFilters.length > 0;

  const openCreate = () => {
    setSelected(null);
    setFormOpen(true);
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
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4" />
              New Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {schedules.length > 0 && (
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  placeholder="Search by schedule or database name..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select
                value={
                  (table.getColumn("databaseName")?.getFilterValue() as
                    | string
                    | undefined) ?? "all"
                }
                onValueChange={(val) =>
                  table
                    .getColumn("databaseName")
                    ?.setFilterValue(val === "all" ? "" : val)
                }
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Databases" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Databases</SelectItem>
                  {databases.map((database) => (
                    <SelectItem key={database.id} value={database.name}>
                      {database.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={
                  (table.getColumn("enabled")?.getFilterValue() as
                    | string
                    | undefined) ?? "all"
                }
                onValueChange={(val) =>
                  table
                    .getColumn("enabled")
                    ?.setFilterValue(val === "all" ? "" : val)
                }
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="All Schedules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Schedules</SelectItem>
                  <SelectItem value="enabled">Enabled</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {table.getRowModel().rows.length === 0 ? (
            hasFilters ? (
              <EmptyState
                icon={Search}
                title="No matching schedules"
                description="No schedule matches the current search and filters."
                action={
                  <Button
                    variant="outline"
                    onClick={() => {
                      setGlobalFilter("");
                      setColumnFilters([]);
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={CalendarClock}
                title="No schedules yet"
                description="A schedule runs pg_dump on a cron of your choosing and prunes old artifacts for you, so backups keep happening while you are not looking."
                action={
                  databases.length === 0 ? (
                    <Button asChild>
                      <Link href="/dashboard">
                        <Plus className="size-4" />
                        Add a database first
                      </Link>
                    </Button>
                  ) : (
                    <Button onClick={openCreate}>
                      <Plus className="size-4" />
                      Create your first schedule
                    </Button>
                  )
                }
              />
            )
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={
                            cell.column.id === "actions"
                              ? "text-right"
                              : undefined
                          }
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {table.getRowModel().rows.length > 0 && (
            <DataTablePagination table={table} noun="schedule" />
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
