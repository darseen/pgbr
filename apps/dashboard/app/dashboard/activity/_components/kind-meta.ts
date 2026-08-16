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
    className: "text-emerald-600 dark:text-emerald-400",
  },
  restore: {
    label: "Restore",
    icon: Upload,
    className: "text-sky-600 dark:text-sky-400",
  },
  migration: {
    label: "Migration",
    icon: ArrowDownUp,
    className: "text-violet-600 dark:text-violet-400",
  },
  event: {
    label: "Action",
    icon: Wrench,
    className: "text-amber-600 dark:text-amber-400",
  },
};
