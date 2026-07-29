import { cn } from "@/lib/utils";
import { ReactNode } from "react";

const widths = {
  default: "max-w-7xl",
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
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
