"use server";

import { db } from "@/db";
import { usersTable } from "@/db/schema";

export default async function checkUser() {
  try {
    const users = await db.select().from(usersTable);

    if (users.length === 0) {
      return {
        data: null,
        error: { message: "User not found" },
        status: 404,
      };
    }

    return { data: users[0], error: null, status: 200 };
  } catch (error) {
    console.error(error);
    return {
      data: null,
      error: { message: "Internal server error" },
      status: 500,
    };
  }
}
