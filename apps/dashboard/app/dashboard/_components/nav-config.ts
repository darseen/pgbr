import {
  Activity,
  ArrowDownUp,
  CalendarClock,
  FileArchive,
  LayoutDashboard,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

export const navMain: NavItem[] = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Databases and recent activity",
  },
  {
    name: "Backups",
    href: "/dashboard/backups",
    icon: FileArchive,
    description: "Browse and restore backup artifacts",
  },
  {
    name: "Schedules",
    href: "/dashboard/schedules",
    icon: CalendarClock,
    description: "Automatic recurring backups",
  },
  {
    name: "Migrate",
    href: "/dashboard/migrate",
    icon: ArrowDownUp,
    description: "Copy one database into another",
  },
  {
    name: "Activity",
    href: "/dashboard/activity",
    icon: Activity,
    description: "Every job and change, with the flags each ran with",
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    description: "Storage, data, and danger zone",
  },
];

// Longest-prefix match so nested routes keep their parent item active.
export function findNavItem(pathname: string) {
  return navMain
    .filter(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];
}

export function isNavItemActive(item: NavItem, pathname: string) {
  return findNavItem(pathname)?.href === item.href;
}
