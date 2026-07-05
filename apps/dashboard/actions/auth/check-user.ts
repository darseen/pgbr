"use server";

import { db } from "@repo/db";
import { usersTable } from "@repo/db/schema";

// Only reports whether an account exists — this action is reachable without
// a session, so it must never return user data.
export default async function checkUser() {
  try {
    const [user] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .limit(1);

    return { data: { exists: !!user }, error: null };
  } catch (error) {
    console.error(error);
    return {
      data: null,
      error: { message: "Internal server error" },
    };
  }
}