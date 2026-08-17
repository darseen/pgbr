import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "./_components/page-shell";
import { PageHeaderSkeleton, StatsSkeleton } from "./_components/skeletons";

export default function Loading() {
  return (
    <PageShell>
      <PageHeaderSkeleton />
      <StatsSkeleton count={4} />
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-8">
        <div className="grid gap-6">
          {[0, 1].map((i) => (
            <Card key={i}>
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-lg" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <Skeleton className="h-7 w-full rounded-md" />
              </CardHeader>
              <CardContent className="flex gap-2">
                <Skeleton className="h-5 w-32 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
