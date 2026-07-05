"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BackupJob, Database } from "@repo/db/schema";
import { Plus, Server } from "lucide-react";
import { useState } from "react";
import AddDatabaseDialog from "./add-dialog";
import DatabaseCard from "./card";
import DeleteDatabaseDialog from "./delete-dialog";

interface Props {
  backupJobs: BackupJob[];
  databases: Database[];
}

export default function DatabasesList({ backupJobs, databases }: Props) {
  const [selectedDatabase, setSelectedDatabase] = useState<Database | null>(
    null,
  );
  const [openAddDatabaseDialog, setOpenAddDatabaseDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Databases</h1>
          <p className="text-muted-foreground">
            Manage your PostgreSQL databases
          </p>
        </div>
        <Button onClick={() => setOpenAddDatabaseDialog(true)}>
          <Plus className="size-4" />
          Add Database
        </Button>
      </div>

      {databases.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-muted/50 mb-4 rounded-full p-4">
              <Server className="text-muted-foreground size-8" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">No databases yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm text-sm">
              Add your first PostgreSQL database to start managing automated
              backups and restores.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {databases.map((database) => (
            <DatabaseCard
              key={database.id}
              database={database}
              backupJobs={backupJobs}
              setSelectedDatabase={setSelectedDatabase}
              setOpenDeleteDialog={setOpenDeleteDialog}
              setOpenAddDatabaseDialog={setOpenAddDatabaseDialog}
            />
          ))}
        </div>
      )}

      <AddDatabaseDialog
        key={selectedDatabase?.id ?? "new"} // force re-render when selectedDatabase changes to update form data
        open={openAddDatabaseDialog}
        setOpen={setOpenAddDatabaseDialog}
        setSelectedDatabase={setSelectedDatabase}
        database={selectedDatabase}
      />
      <DeleteDatabaseDialog
        open={openDeleteDialog}
        setOpen={setOpenDeleteDialog}
        setSelectedDatabase={setSelectedDatabase}
        database={selectedDatabase}
      />
    </section>
  );
}
