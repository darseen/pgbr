import { PageShell } from "../_components/page-shell";
import {
  PageHeaderSkeleton,
  StatsSkeleton,
  TableSkeleton,
} from "../_components/skeletons";

export default function Loading() {
  return (
    <PageShell>
      <PageHeaderSkeleton />
      <StatsSkeleton />
      <TableSkeleton />
    </PageShell>
  );
}
