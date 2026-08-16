import { db } from "@repo/db";
import { activityEventsTable, type ActivityEventAction } from "@repo/db/schema";

interface RecordActivityInput {
  userId: string;
  action: ActivityEventAction;
  summary: string;
  details?: Record<string, unknown>;
}

// Never throws: an unwritten audit row must not fail the action it describes.
export async function recordActivity({
  userId,
  action,
  summary,
  details,
}: RecordActivityInput) {
  try {
    await db.insert(activityEventsTable).values({
      userId,
      action,
      summary,
      details: details ?? null,
    });
  } catch (error) {
    console.error("Failed to record activity event", error);
  }
}
