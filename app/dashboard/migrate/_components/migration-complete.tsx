import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface Props {
  handleReset: () => void;
}

export default function MigrationComplete({ handleReset }: Props) {
  return (
    <Card className="animate-in fade-in zoom-in-95 border-emerald-500/20 shadow-lg shadow-emerald-500/5 duration-500">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-6 rounded-full bg-emerald-500/10 p-4">
          <div className="flex size-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="size-10" />
          </div>
        </div>
        <h3 className="mb-3 text-2xl font-bold tracking-tight">
          Migration Successful!
        </h3>
        <p className="text-muted-foreground mb-8 max-w-md text-lg">
          Your database has been successfully migrated.
        </p>
        <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
          <Button
            variant="outline"
            size="lg"
            onClick={handleReset}
            className="w-full sm:w-auto"
          >
            Start Another Migration
          </Button>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
            >
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
