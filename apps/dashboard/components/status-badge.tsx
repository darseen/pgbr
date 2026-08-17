import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  FileClock,
  LoaderCircle,
  XCircle,
  type LucideIcon,
} from "lucide-react";

interface StatusMeta {
  label: string;
  icon: LucideIcon;
  className: string;
  spin?: boolean;
}

// Every status colour routes through a theme token so the pills stay legible in
// both themes instead of pinning a light-mode tint.
export const statusMeta: Record<string, StatusMeta> = {
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "bg-success/12 text-success border-success/25",
  },
  failed: {
    label: "Failed",
    icon: XCircle,
    className: "bg-destructive/12 text-destructive border-destructive/25",
  },
  running: {
    label: "Running",
    icon: LoaderCircle,
    className: "bg-info/12 text-info border-info/25",
    spin: true,
  },
  logged: {
    label: "Logged",
    icon: FileClock,
    className: "bg-warning/12 text-warning border-warning/25",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function getStatusMeta(status: string): StatusMeta {
  return statusMeta[status] ?? statusMeta.pending;
}

export default function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const { label, icon: Icon, className: tone, spin } = getStatusMeta(status);

  return (
    <Badge className={cn("gap-1 border font-medium", tone, className)}>
      <Icon className={cn(spin && "animate-spin")} />
      {label}
    </Badge>
  );
}
