import { db, backupJobsTable, backupSchedulesTable } from "@repo/db";
import { getStore } from "@repo/storage";
import { and, desc, eq, inArray } from "drizzle-orm";

// Deletes completed backups (rows + objects) beyond a schedule's keepLast
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
    .select({ id: backupJobsTable.id, storageKey: backupJobsTable.storageKey })
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

  const store = await getStore();
  for (const row of stale) {
    try {
      await store.deleteObject(row.storageKey);
    } catch (error) {
      console.error(`Failed to delete pruned backup ${row.storageKey}`, error);
    }
  }
}
