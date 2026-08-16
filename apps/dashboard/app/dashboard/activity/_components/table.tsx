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
import type { ActivityItem } from "@/types";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";
import { Activity, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import getStatusBadge from "../../_components/sections/job-history/get-status-badge";
import ClearActivityDialog from "./clear-dialog";
import DeleteActivityDialog from "./delete-dialog";
import ActivityDetailsDialog from "./details-dialog";
import { kindMeta } from "./kind-meta";

interface Props {
  items: ActivityItem[];
}

export default function ActivityTable({ items }: Props) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
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
      header: "Type",
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
      header: "Activity",
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
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.original.status),
    },
    {
      accessorKey: "timestamp",
      header: "When",
      cell: ({ row }) => {
        const date = new Date(row.original.timestamp);
        return (
          <div className="block">
            <span className="text-muted-foreground block text-sm">
              {format(date, "MMM d, yyyy HH:mm")}
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
      cell: ({ row }) => (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            title="Delete activity"
            onClick={(e) => {
              e.stopPropagation();
              setRowToDelete(row.original);
              setOpenDelete(true);
            }}
          >
            <Trash2 className="size-4" />
          </Button>
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
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: {
      globalFilter,
      columnFilters,
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
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="text-muted-foreground/50 mb-4 size-12" />
              <h3 className="mb-1 text-lg font-medium">No activity found</h3>
              <p className="text-muted-foreground">
                {globalFilter || columnFilters.length > 0
                  ? "Try adjusting your filters"
                  : "Run a backup, restore, or migration to get started"}
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
