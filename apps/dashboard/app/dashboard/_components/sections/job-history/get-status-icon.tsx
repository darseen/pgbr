import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";

export default function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="size-4 text-green-500" />;
    case "failed":
      return <XCircle className="text-destructive size-4" />;
    case "running":
      return <Loader2 className="size-4 animate-spin text-blue-500" />;
    case "pending":
    default:
      return <Clock className="text-muted-foreground size-4" />;
  }
}
