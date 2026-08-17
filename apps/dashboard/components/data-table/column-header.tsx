"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

interface Props<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  className?: string;
}

export default function ColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: Props<TData, TValue>) {
  if (!column.getCanSort()) {
    return <span className={className}>{title}</span>;
  }

  const sorted = column.getIsSorted();
  const Icon =
    sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ChevronsUpDown;

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
}
