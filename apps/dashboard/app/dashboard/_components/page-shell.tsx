import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";
import { ReactNode } from "react";

const widths = {
  default: "max-w-7xl",
  medium: "max-w-5xl",
  narrow: "max-w-3xl",
} as const;

interface PageShellProps extends React.ComponentProps<"div"> {
  width?: keyof typeof widths;
}

export function PageShell({
  className,
  width = "default",
  ...props
}: PageShellProps) {
  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-2 mx-auto w-full min-w-0 flex-1 px-4 py-6 duration-500 sm:px-6 sm:py-8 lg:px-8",
        widths[width],
        className,
      )}
      {...props}
    />
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <div className="bg-primary/10 ring-primary/20 hidden size-11 shrink-0 items-center justify-center rounded-xl ring-1 sm:flex">
            <Icon className="text-primary size-5.5" />
          </div>
        )}
        <div className="min-w-0 space-y-0.5">
          <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
