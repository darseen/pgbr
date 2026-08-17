"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { parseJobTimestamp } from "@/utils";
import { format, formatDistanceToNow } from "date-fns";

interface Props {
  value: string | Date | null | undefined;
  fallback?: string;
}

export default function TimeCell({ value, fallback = "—" }: Props) {
  const date = parseJobTimestamp(value);
  if (!date) return <span className="text-muted-foreground">{fallback}</span>;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="w-fit cursor-default">
          <span className="block text-sm tabular-nums">
            {format(date, "MMM d, HH:mm")}
          </span>
          <span className="text-muted-foreground block text-xs">
            {formatDistanceToNow(date, { addSuffix: true })}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>{format(date, "PPpp")}</TooltipContent>
    </Tooltip>
  );
}
