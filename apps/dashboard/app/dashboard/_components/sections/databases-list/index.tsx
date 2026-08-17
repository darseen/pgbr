"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
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
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight">Databases</h2>
          <p className="text-muted-foreground text-sm">
            Connections pgbr can back up, restore, and migrate
          </p>
        </div>
        <Button onClick={() => setOpenAddDatabaseDialog(true)}>
          <Plus className="size-4" />
          Add Database
        </Button>
      </div>

      {databases.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <EmptyState
            icon={Server}
            title="No databases yet"
            description="Add your first PostgreSQL connection to start running backups, restores, and migrations."
            action={
              <Button onClick={() => setOpenAddDatabaseDialog(true)}>
                <Plus className="size-4" />
                Add your first database
              </Button>
            }
          />
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
