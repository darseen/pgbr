import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  hint: string;
  icon: LucideIcon;
  className?: string;
}

export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: Props) {
  return (
    <Card
      className={cn(
        "hover:ring-foreground/20 transition-shadow hover:shadow-sm",
        className,
      )}
    >
      <CardHeader>
        <CardDescription className="text-xs font-medium tracking-wide uppercase">
          {label}
        </CardDescription>
        <CardTitle
          className={cn(
            "font-bold tabular-nums",
            // Long values (e.g. "in about 11 hours") need a smaller size to breathe.
            String(value).length > 10
              ? "text-lg sm:text-xl"
              : "text-2xl sm:text-3xl",
          )}
        >
          {value}
        </CardTitle>
        <CardAction>
          <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
            <Icon className="size-4.5" />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">{hint}</p>
      </CardContent>
    </Card>
  );
}
