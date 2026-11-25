"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Subscribe,
  type CellData,
  type Column,
  type RowData,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { DataTableFeatures } from "./features";

interface Props<TData extends RowData, TValue extends CellData> {
  column: Column<DataTableFeatures, TData, TValue>;
  title: string;
  className?: string;
}

export default function ColumnHeader<
  TData extends RowData,
  TValue extends CellData,
>({ column, title, className }: Props<TData, TValue>) {
  if (!column.getCanSort()) {
    return <span className={className}>{title}</span>;
  }

  // The column object is stable, so subscribe or the compiler caches a stale sort.
  return (
    <Subscribe
      source={column.table.atoms.sorting}
      selector={() => column.getIsSorted()}
    >
      {(sorted) => {
        const Icon =
          sorted === "asc"
            ? ArrowUp
            : sorted === "desc"
              ? ArrowDown
              : ChevronsUpDown;

        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(sorted === "asc")}
            className={cn(
              "-ml-2 h-8 gap-1.5 px-2 font-medium",
              sorted ? "text-foreground" : "text-muted-foreground",
              className,
            )}
          >
            {title}
            <Icon className={cn("size-3.5", !sorted && "opacity-50")} />
          </Button>
        );
      }}
    </Subscribe>
  );
}
