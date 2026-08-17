import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface Props {
  handleReset: () => void;
}

export default function MigrationComplete({ handleReset }: Props) {
  return (
    <Card className="animate-in fade-in zoom-in-95 border-success/20 shadow-success/5 shadow-lg duration-500">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-success/10 mb-6 rounded-full p-4">
          <div className="bg-success text-success-foreground shadow-success/20 flex size-20 items-center justify-center rounded-full shadow-lg">
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
              className="bg-success text-success-foreground hover:bg-success/90 w-full sm:w-auto"
            >
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
