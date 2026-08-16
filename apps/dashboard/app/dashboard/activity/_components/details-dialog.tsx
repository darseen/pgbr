"use client";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import SeparatorWithText from "@/components/ui/separator-with-text";
import type { ActivityItem } from "@/types";
import { formatFileSize } from "@/utils";
import { format, formatDistanceToNow } from "date-fns";
import { ReactNode } from "react";
import getStatusBadge from "../../_components/sections/job-history/get-status-badge";
import getStatusIcon from "../../_components/sections/job-history/get-status-icon";
import { kindMeta } from "./kind-meta";

interface Props {
  item: ActivityItem | null;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function ActivityDetailsDialog({ item, open, setOpen }: Props) {
  if (!item) return null;

  const meta = kindMeta[item.kind];
  const Icon = meta.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 pr-6 text-base">
            <Icon className={`size-4 shrink-0 ${meta.className}`} />
            <span className="min-w-0 wrap-break-word">{item.title}</span>
            {getStatusBadge(item.status)}
          </DialogTitle>
          <DialogDescription className="break-all">
            {item.subtitle ?? meta.label}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60svh] pr-4">
          <div className="space-y-4">
            <FlagGroup label="Backup flags" flags={item.backupFlags} />
            <FlagGroup label="Restore flags" flags={item.restoreFlags} />

            {item.details && Object.keys(item.details).length > 0 && (
              <div className="space-y-2">
                <SeparatorWithText>Details</SeparatorWithText>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {Object.entries(item.details).map(([key, value]) => (
                    <FlagValue key={key} name={key} value={value} />
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <SeparatorWithText>Timeline</SeparatorWithText>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <Row label={item.kind === "event" ? "Logged" : "Started"}>
                  <Timestamp value={item.timestamp} />
                </Row>
                {item.completedAt && (
                  <Row label="Completed">
                    <Timestamp value={item.completedAt} />
                  </Row>
                )}
                {item.storageKey && (
                  <Row label="Storage key">
                    <span className="font-mono text-xs break-all">
                      {item.storageKey}
                    </span>
                  </Row>
                )}
                {item.size !== null && item.size > 0 && (
                  <Row label="Size">{formatFileSize(item.size)}</Row>
                )}
                <Row label="Status">
                  <span className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    {item.status}
                  </span>
                </Row>
              </dl>
            </div>

            {item.error && (
              <>
                <Separator />
                <p className="text-destructive bg-destructive/10 rounded px-2 py-1 text-sm wrap-break-word">
                  {item.error}
                </p>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function FlagGroup({ label, flags }: { label: string; flags: object | null }) {
  if (!flags || Object.keys(flags).length === 0) return null;

  return (
    <div className="space-y-2">
      <SeparatorWithText>{label}</SeparatorWithText>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {Object.entries(flags).map(([key, value]) => (
          <FlagValue key={key} name={key} value={value} />
        ))}
      </div>
    </div>
  );
}

function FlagValue({ name, value }: { name: string; value: unknown }) {
  const display = Array.isArray(value)
    ? value.length > 0
      ? value.join(", ")
      : "none"
    : String(value ?? "none");

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-xs">{name}</span>
      <Badge variant="outline" className="max-w-60 truncate text-xs">
        {display}
      </Badge>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </>
  );
}

function Timestamp({ value }: { value: string }) {
  const date = new Date(value);
  return (
    <span>
      {format(date, "MMM d, yyyy HH:mm")}{" "}
      <span className="text-muted-foreground text-xs">
        ({formatDistanceToNow(date, { addSuffix: true })})
      </span>
    </span>
  );
}
