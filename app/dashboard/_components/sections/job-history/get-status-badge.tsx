import { Badge } from "@/components/ui/badge";

export default function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          Completed
        </Badge>
      );
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    case "running":
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
          Running
        </Badge>
      );
    case "pending":
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
}
