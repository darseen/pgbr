"use client";
"use no memo";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BackupJob } from "@/db/schema";
import { formatFileSize } from "@/utils";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";
import { Download, FileArchive, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import getStatusBadge from "../../_components/sections/job-history/get-status-badge";
import getStatusIcon from "../../_components/sections/job-history/get-status-icon";
import DeleteBackupDialog from "./delete-dialog";

interface Props {
  backupJobs: BackupJob[];
}

export default function BackupsTable({ backupJobs }: Props) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);

  const uniqueDatabases = useMemo(() => {
    return Array.from(new Set(backupJobs.map((job) => job.databaseName)));
  }, [backupJobs]);

  const handleDownload = (jobId: string) => {
    if (!jobId) return;
    const link = document.createElement("a");
    link.href = `/api/backup/download/${jobId}`;
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = useMemo<ColumnDef<BackupJob>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          return (
            <div className="flex items-center gap-2">
              {getStatusIcon(status)}
              <span className="inline">{getStatusBadge(status)}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "databaseName",
        header: "Database",
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("databaseName")}</span>
        ),
      },
      {
        accessorKey: "backupPath",
        header: () => <span className="table-cell">File Path</span>,
        cell: ({ row }) => (
          <code className="bg-muted inline-block max-w-50 truncate rounded px-2 py-1 font-mono text-xs">
            {(row.getValue("backupPath") as string) || "-"}
          </code>
        ),
      },
      {
        id: "size",
        accessorFn: (row) => row.size,
        header: () => <span className="table-cell">Size</span>,
        cell: ({ row }) => {
          const status = row.getValue("status");
          const size = Number(row.original.size) || 0;
          return (
            <span className="inline">
              {status === "completed" ? formatFileSize(size) : "-"}
            </span>
          );
        },
      },
      {
        id: "format",
        accessorFn: (row) => row.flags?.format,
        header: () => <span className="table-cell">Format</span>,
        cell: ({ row }) => (
          <Badge variant="outline" className="inline-flex text-xs">
            {(row.getValue("format") as string) || "unknown"}
          </Badge>
        ),
      },
      {
        accessorKey: "startedAt",
        header: () => <span className="table-cell">Created</span>,
        cell: ({ row }) => {
          const date = new Date((row.getValue("startedAt") + "Z") as string);
          return (
            <div className="block">
              <span className="text-muted-foreground block text-sm">
                {format(date, "MMM d, yyyy")}
              </span>
              <span className="text-muted-foreground block text-xs">
                {formatDistanceToNow(date, { addSuffix: true })}
              </span>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const job = row.original;
          return (
            <div className="flex items-center justify-end gap-1">
              {job.status === "completed" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDownload(job.id)}
                  title="Download backup"
                >
                  <Download className="size-4" />
                </Button>
              )}
              <DeleteBackupDialog
                selectedBackups={new Set([job.id])}
                setSelectedBackups={() => row.toggleSelected(false)}
                isDeleting={isDeleting}
                setIsDeleting={setIsDeleting}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    title="Delete backup"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                }
              />
            </div>
          );
        },
      },
    ],
    [isDeleting],
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: backupJobs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: {
      globalFilter,
      columnFilters,
      rowSelection,
    },
    globalFilterFn: (row, columnId, filterValue) => {
      const dbName = (row.getValue("databaseName") as string)?.toLowerCase();
      const path = (row.getValue("backupPath") as string)?.toLowerCase();
      const search = filterValue.toLowerCase();
      return dbName?.includes(search) || path?.includes(search);
    },
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedIds = new Set(selectedRows.map((row) => row.original.id));

  const setGlobalSelectedBackups = (newSet: Set<string>) => {
    if (newSet instanceof Set && newSet.size === 0) {
      table.toggleAllRowsSelected(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>All Backups</CardTitle>
            <CardDescription>
              Manage and download your PostgreSQL backup files
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <DeleteBackupDialog
                selectedBackups={selectedIds}
                setSelectedBackups={setGlobalSelectedBackups}
                isDeleting={isDeleting}
                setIsDeleting={setIsDeleting}
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder="Search by database name or file path..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={
              (table.getColumn("databaseName")?.getFilterValue() as string) ??
              "all"
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
              {uniqueDatabases.map((db) => (
                <SelectItem key={db} value={db}>
                  {db}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={
              (table.getColumn("status")?.getFilterValue() as string) ?? "all"
            }
            onValueChange={(val) =>
              table
                .getColumn("status")
                ?.setFilterValue(val === "all" ? "" : val)
            }
          >
            <SelectTrigger className="w-full sm:w-45">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {table.getRowModel().rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileArchive className="text-muted-foreground/50 mb-4 size-12" />
            <h3 className="mb-1 text-lg font-medium">No backups found</h3>
            <p className="text-muted-foreground">
              {globalFilter || columnFilters.length > 0
                ? "Try adjusting your filters"
                : "Create a backup from the dashboard to get started"}
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={header.id === "select" ? "w-12" : undefined}
                      >
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
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
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
      </CardContent>
    </Card>
  );
}
