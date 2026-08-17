"use client";

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
import ColumnHeader from "@/components/data-table/column-header";
import DataTablePagination from "@/components/data-table/pagination";
import StatusBadge from "@/components/status-badge";
import TimeCell from "@/components/time-cell";
import TooltipButton from "@/components/tooltip-button";
import EmptyState from "@/components/ui/empty-state";
import { formatFileSize } from "@/utils";
import { BackupJob } from "@repo/db/schema";
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
import { Download, FileArchive, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import CopyablePath from "./copyable-path";
import DeleteBackupDialog from "./delete-dialog";

interface Props {
  backupJobs: BackupJob[];
  initialStatus?: string | null;
}

export default function BackupsTable({ backupJobs, initialStatus }: Props) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    initialStatus ? [{ id: "status", value: initialStatus }] : [],
  );
  const [sorting, setSorting] = useState<SortingState>([
    { id: "startedAt", desc: true },
  ]);
  const [rowSelection, setRowSelection] = useState({});

  const [isDeleting, setIsDeleting] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [globalSelected, setGlobalSelected] = useState(false);

  const uniqueDatabases = () => {
    return Array.from(new Set(backupJobs.map((job) => job.databaseName)));
  };

  const handleDownload = (jobId: string) => {
    if (!jobId) return;
    const link = document.createElement("a");
    link.href = `/api/backup/download/${jobId}`;
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: ColumnDef<BackupJob>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
      header: ({ column }) => <ColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      accessorKey: "databaseName",
      header: ({ column }) => <ColumnHeader column={column} title="Database" />,
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("databaseName")}</span>
      ),
    },
    {
      accessorKey: "storageKey",
      header: "Storage Key",
      enableSorting: false,
      cell: ({ row }) => (
        <CopyablePath path={row.getValue("storageKey") as string} />
      ),
    },
    {
      id: "size",
      accessorFn: (row) => Number(row.size) || 0,
      header: ({ column }) => <ColumnHeader column={column} title="Size" />,
      cell: ({ row }) => (
        <span className="tabular-nums">
          {row.original.status === "completed"
            ? formatFileSize(Number(row.original.size) || 0)
            : "—"}
        </span>
      ),
    },
    {
      id: "format",
      accessorFn: (row) => row.flags?.format,
      header: ({ column }) => <ColumnHeader column={column} title="Format" />,
      cell: ({ row }) => (
        <Badge variant="outline" className="inline-flex text-xs">
          {(row.getValue("format") as string) || "unknown"}
        </Badge>
      ),
    },
    {
      accessorKey: "startedAt",
      header: ({ column }) => <ColumnHeader column={column} title="Created" />,
      cell: ({ row }) => <TimeCell value={row.getValue("startedAt")} />,
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      enableSorting: false,
      cell: ({ row }) => {
        const job = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            {job.status === "completed" && (
              <TooltipButton
                label="Download backup"
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDownload(job.id)}
              >
                <Download className="size-4" />
              </TooltipButton>
            )}
            <TooltipButton
              label="Delete backup"
              variant="ghost"
              size="icon-sm"
              className="hover:bg-destructive/10 hover:text-destructive text-destructive"
              onClick={() => {
                setJobToDelete(job.id);
                setOpenDeleteDialog(true);
                setGlobalSelected(false);
              }}
            >
              <Trash2 className="size-4" />
            </TooltipButton>
          </div>
        );
      },
    },
  ];

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: backupJobs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    initialState: { pagination: { pageSize: 10 } },
    state: {
      globalFilter,
      columnFilters,
      sorting,
      rowSelection,
    },
    globalFilterFn: (row, columnId, filterValue) => {
      const dbName = (row.getValue("databaseName") as string)?.toLowerCase();
      const key = (row.getValue("storageKey") as string)?.toLowerCase();
      const search = filterValue.toLowerCase();
      return dbName?.includes(search) || key?.includes(search);
    },
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedIds = new Set(selectedRows.map((row) => row.original.id));
  const hasFilters = Boolean(globalFilter) || columnFilters.length > 0;

  const setGlobalSelectedBackups = (newSet: Set<string>) => {
    if (newSet instanceof Set && newSet.size === 0) {
      table.toggleAllRowsSelected(false);
    }
  };

  return (
    <>
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
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setOpenDeleteDialog(true);
                    setGlobalSelected(true);
                  }}
                >
                  <Trash2 className="mr-1.5 size-4" />
                  Delete ({selectedIds.size})
                </Button>
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
                placeholder="Search by database name or storage key..."
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
                {uniqueDatabases().map((db) => (
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
            hasFilters ? (
              <EmptyState
                icon={Search}
                title="No matching backups"
                description="No backup matches the current search and filters."
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
                icon={FileArchive}
                title="No backups yet"
                description="Backups appear here once you run one. Start from a database on the overview, or set up a schedule to run them automatically."
                action={
                  <>
                    <Button asChild>
                      <Link href="/dashboard">
                        <Plus className="size-4" />
                        Run a backup
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/dashboard/schedules">Create a schedule</Link>
                    </Button>
                  </>
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
                        <TableHead
                          key={header.id}
                          className={
                            header.id === "select" ? "w-12" : undefined
                          }
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

          {table.getRowModel().rows.length > 0 && (
            <DataTablePagination table={table} noun="backup" />
          )}
        </CardContent>
      </Card>

      <DeleteBackupDialog
        selectedBackups={
          globalSelected
            ? selectedIds
            : jobToDelete
              ? new Set([jobToDelete])
              : new Set()
        }
        setSelectedBackups={(value) => {
          if (globalSelected) {
            setGlobalSelectedBackups(value);
          } else {
            setJobToDelete(null);
          }
        }}
        isDeleting={isDeleting}
        setIsDeleting={setIsDeleting}
        open={openDeleteDialog}
        setOpen={setOpenDeleteDialog}
      />
    </>
  );
}
