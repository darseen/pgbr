"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Database } from "@/db/schema";
import { ApiResponse } from "@/types";
import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { SubmitEvent, useState } from "react";
import { toast } from "sonner";

interface Props {
  database?: Database;
}

export default function DatabaseForm({ database }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Pick<Database, "name" | "url">>({
    name: database?.name || "",
    url: database?.url || "",
  });

  const isEditing = !!database;

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const method = isEditing ? "PUT" : "POST";
      const body = isEditing ? { id: database.id, ...formData } : formData;

      const res = await fetch("/api/database", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const { error } = (await res.json()) as ApiResponse<{
        database: Database;
      }>;

      if (error) {
        toast.error(error.message);
        return;
      }

      setOpen(false);
      router.refresh();
      toast.success(
        isEditing
          ? "Database updated successfully"
          : "Database added successfully",
      );

      setFormData({
        name: database?.name || "",
        url: database?.url || "",
      });
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="icon-sm">
            <Pencil className="size-4" />
            <span className="sr-only">Edit database</span>
          </Button>
        ) : (
          <Button>
            <Plus className="size-4" />
            Add Database
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Database" : "Add Database Database"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the database details. Leave database string empty to keep the existing one."
              : "Enter a name and PostgreSQL database string for your database."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="conn-name">Database Name</Label>
            <Input
              id="conn-name"
              placeholder="e.g., Production DB"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">
              Database String {isEditing && "(leave empty to keep existing)"}
            </Label>
            <Input
              id="url"
              placeholder="postgresql://user:password@host:5432/database"
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
              required={!isEditing}
              disabled={isLoading}
            />
            <p className="text-muted-foreground text-xs">
              Format: postgresql://user:password@host:port/database
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Spinner /> : isEditing ? "Update" : "Add Database"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
