import { db, backupJobsTable, backupSchedulesTable } from "@repo/db";
import { and, desc, eq, inArray } from "drizzle-orm";
import fs from "node:fs/promises";
import { assertInsideDataDir } from "./paths.js";

// Deletes completed backups (rows + files) beyond a schedule's keepLast
// count. Failed rows are kept for visibility, and databases.backupCount is a
// lifetime counter, so neither is touched — same as the manual delete action.
export async function pruneScheduleBackups(scheduleId?: string) {
  if (!scheduleId) return;

  const [schedule] = await db
    .select()
    .from(backupSchedulesTable)
    .where(eq(backupSchedulesTable.id, scheduleId));

  if (!schedule || schedule.keepLast == null) return;

  const completed = await db
    .select({ id: backupJobsTable.id, backupPath: backupJobsTable.backupPath })
    .from(backupJobsTable)
    .where(
      and(
        eq(backupJobsTable.scheduleId, scheduleId),
        eq(backupJobsTable.status, "completed"),
      ),
    )
    .orderBy(desc(backupJobsTable.createdAt));

  const stale = completed.slice(schedule.keepLast);
  if (stale.length === 0) return;

  await db.delete(backupJobsTable).where(
    inArray(
      backupJobsTable.id,
      stale.map((row) => row.id),
    ),
  );

  for (const row of stale) {
    try {
      assertInsideDataDir(row.backupPath);
      await fs.rm(row.backupPath, { recursive: true, force: true });
    } catch (error) {
      console.error(`Failed to delete pruned backup ${row.backupPath}`, error);
    }
  }
}
