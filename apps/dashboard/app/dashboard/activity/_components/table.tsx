"use client";

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
import type { ActivityItem } from "@/types";
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
import { Activity, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import ClearActivityDialog from "./clear-dialog";
import DeleteActivityDialog from "./delete-dialog";
import ActivityDetailsDialog from "./details-dialog";
import { kindMeta } from "./kind-meta";

interface Props {
  items: ActivityItem[];
  initialStatus?: string | null;
  initialKind?: string | null;
}

export default function ActivityTable({
  items,
  initialStatus,
  initialKind,
}: Props) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() =>
    [
      initialStatus ? { id: "status", value: initialStatus } : null,
      initialKind ? { id: "kind", value: initialKind } : null,
    ].filter((filter) => filter !== null),
  );
  const [sorting, setSorting] = useState<SortingState>([
    { id: "timestamp", desc: true },
  ]);
  const [rowSelection, setRowSelection] = useState({});

  const [detailsItem, setDetailsItem] = useState<ActivityItem | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  // Set when the trash icon on a single row is used, so that row is deleted
  // instead of whatever the checkboxes happen to have selected.
  const [rowToDelete, setRowToDelete] = useState<ActivityItem | null>(null);

  const columns: ColumnDef<ActivityItem>[] = [
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
      accessorKey: "kind",
      header: ({ column }) => <ColumnHeader column={column} title="Type" />,
      cell: ({ row }) => {
        const meta = kindMeta[row.original.kind];
        const Icon = meta.icon;
        return (
          <div className="flex items-center gap-2">
            <Icon className={`size-4 shrink-0 ${meta.className}`} />
            <span className="text-sm font-medium">{meta.label}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "title",
      header: ({ column }) => <ColumnHeader column={column} title="Activity" />,
      cell: ({ row }) => (
        <div className="max-w-xs min-w-0 sm:max-w-md">
          <span className="block truncate font-medium">
            {row.original.title}
          </span>
          {row.original.subtitle && (
            <span className="text-muted-foreground block truncate text-xs">
              {row.original.subtitle}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => <ColumnHeader column={column} title="Status" />,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "timestamp",
      header: ({ column }) => <ColumnHeader column={column} title="When" />,
      cell: ({ row }) => <TimeCell value={row.original.timestamp} />,
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end">
          <TooltipButton
            label="Delete activity"
            variant="ghost"
            size="icon-sm"
            className="hover:bg-destructive/10 hover:text-destructive text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              setRowToDelete(row.original);
              setOpenDelete(true);
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
    data: items,
    columns,
    getRowId: (row) => `${row.kind}:${row.id}`,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    initialState: { pagination: { pageSize: 25 } },
    state: {
      globalFilter,
      columnFilters,
      sorting,
      rowSelection,
    },
    globalFilterFn: (row, columnId, filterValue) => {
      const search = String(filterValue).toLowerCase();
      const haystack = [
        row.original.title,
        row.original.subtitle,
        row.original.databaseName,
      ];
      return haystack.some((value) => value?.toLowerCase().includes(search));
    },
  });

  const selected = table.getSelectedRowModel().rows.map((row) => row.original);
  const pendingDeletion = rowToDelete ? [rowToDelete] : selected;
  const hasFilters = Boolean(globalFilter) || columnFilters.length > 0;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Activity</CardTitle>
              <CardDescription>
                Backups, restores, migrations, and the changes you made. Select
                a row to see its flags.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {selected.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setRowToDelete(null);
                    setOpenDelete(true);
                  }}
                >
                  <Trash2 className="mr-1.5 size-4" />
                  Delete ({selected.length})
                </Button>
              )}
              <ClearActivityDialog
                items={items}
                onCleared={() => table.toggleAllRowsSelected(false)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search activity..."
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={
                (table.getColumn("kind")?.getFilterValue() as string) ?? "all"
              }
              onValueChange={(val) =>
                table
                  .getColumn("kind")
                  ?.setFilterValue(val === "all" ? "" : val)
              }
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="backup">Backups</SelectItem>
                <SelectItem value="restore">Restores</SelectItem>
                <SelectItem value="migration">Migrations</SelectItem>
                <SelectItem value="event">Actions</SelectItem>
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
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="logged">Logged</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {table.getRowModel().rows.length === 0 ? (
            hasFilters ? (
              <EmptyState
                icon={Search}
                title="No matching activity"
                description="Nothing matches the current search and filters."
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
                icon={Activity}
                title="Nothing has happened yet"
                description="Backups, restores, migrations, and the changes you make all land here as soon as they run."
                action={
                  <Button asChild>
                    <Link href="/dashboard">Go to your databases</Link>
                  </Button>
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
                      className="cursor-pointer"
                      onClick={() => {
                        setDetailsItem(row.original);
                        setOpenDetails(true);
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={
                            cell.column.id === "actions"
                              ? "text-right"
                              : undefined
                          }
                          // The checkbox owns its own click; bubbling it up
                          // would open the details dialog on every select.
                          onClick={
                            cell.column.id === "select"
                              ? (e) => e.stopPropagation()
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
            <DataTablePagination
              table={table}
              noun="entry"
              nounPlural="entries"
            />
          )}
        </CardContent>
      </Card>

      <ActivityDetailsDialog
        item={detailsItem}
        open={openDetails}
        setOpen={setOpenDetails}
      />

      <DeleteActivityDialog
        items={pendingDeletion}
        open={openDelete}
        setOpen={(value) => {
          setOpenDelete(value);
          if (!value) setRowToDelete(null);
        }}
        onDeleted={() => {
          setRowToDelete(null);
          table.toggleAllRowsSelected(false);
        }}
      />
    </>
  );
}
