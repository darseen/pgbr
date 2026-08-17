import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowRight, type LucideIcon } from "lucide-react";
import Link from "next/link";

const tones = {
  default: "bg-primary/10 text-primary ring-primary/20",
  success: "bg-success/10 text-success ring-success/20",
  warning: "bg-warning/10 text-warning ring-warning/20",
  danger: "bg-destructive/10 text-destructive ring-destructive/20",
  info: "bg-info/10 text-info ring-info/20",
} as const;

interface Props {
  label: string;
  value: string | number;
  hint: string;
  icon: LucideIcon;
  tone?: keyof typeof tones;
  href?: string;
  spin?: boolean;
  className?: string;
}

export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  href,
  spin,
  className,
}: Props) {
  const body = (
    <CardContent className="flex items-start gap-4 py-1">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-muted-foreground text-[0.7rem] font-semibold tracking-widest uppercase">
          {label}
        </p>
        <p
          className={cn(
            "font-bold tracking-tight tabular-nums",
            // Long values (e.g. "in about 11 hours") need a smaller size to breathe.
            String(value).length > 10 ? "text-xl" : "text-3xl",
          )}
        >
          {value}
        </p>
        <p className="text-muted-foreground flex items-center gap-1 truncate text-sm">
          {hint}
          {href && (
            <ArrowRight className="size-3.5 -translate-x-1 opacity-0 transition-all group-hover/card:translate-x-0 group-hover/card:opacity-100" />
          )}
        </p>
      </div>

      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl ring-1",
          tones[tone],
        )}
      >
        <Icon className={cn("size-5", spin && "animate-spin")} />
      </div>
    </CardContent>
  );

  if (!href) {
    return <Card className={className}>{body}</Card>;
  }

  return (
    <Card
      className={cn(
        "hover:ring-primary/40 focus-within:ring-ring/60 transition-shadow hover:shadow-md",
        className,
      )}
    >
      <Link href={href} className="outline-none">
        {body}
      </Link>
    </Card>
  );
}
