import type { ActivityKind } from "@/types";
import {
  ArrowDownUp,
  Download,
  Upload,
  Wrench,
  type LucideIcon,
} from "lucide-react";

interface KindMeta {
  label: string;
  icon: LucideIcon;
  className: string;
}

export const kindMeta: Record<ActivityKind, KindMeta> = {
  backup: {
    label: "Backup",
    icon: Download,
    className: "text-success",
  },
  restore: {
    label: "Restore",
    icon: Upload,
    className: "text-info",
  },
  migration: {
    label: "Migration",
    icon: ArrowDownUp,
    className: "text-primary",
  },
  event: {
    label: "Action",
    icon: Wrench,
    className: "text-warning",
  },
};
