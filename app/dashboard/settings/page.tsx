import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, Bomb, Trash2 } from "lucide-react";
import { Metadata } from "next";
import ClearRestoresDialog from "./_components/clear-restores-dialog";
import NukeDialog from "./_components/nuke-dialog";

export const metadata: Metadata = {
  title: "Settings",
};

export default function Page() {
  return (
    <div className="bg-background animate-in fade-in slide-in-from-bottom-4 min-h-screen duration-500">
      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage application settings and data
            </p>
          </div>

          <Card className="border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-destructive size-5" />
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
              </div>
              <CardDescription>
                Irreversible actions that affect your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-destructive/30 bg-destructive/5 rounded-lg border p-4">
                <div className="flex items-start gap-4">
                  <div className="bg-destructive/10 rounded-full p-3">
                    <Trash2 className="text-destructive size-6" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Clear Restore Logs
                      </h3>
                      <p className="text-muted-foreground mt-1 text-sm">
                        Permanently delete all restore job history and logs.
                        This action cannot be undone, but your actual backup
                        files will remain intact.
                      </p>
                    </div>
                    <ClearRestoresDialog />
                  </div>
                </div>
              </div>

              <div className="border-destructive/30 bg-destructive/5 rounded-lg border p-4">
                <div className="flex items-start gap-4">
                  <div className="bg-destructive/10 rounded-full p-3">
                    <Bomb className="text-destructive size-6" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">Nuke Everything</h3>
                      <p className="text-muted-foreground mt-1 text-sm">
                        Permanently delete all database records and backup files
                        from disk. This action cannot be undone.
                      </p>
                    </div>
                    <NukeDialog />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
