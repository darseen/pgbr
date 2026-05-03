"use server";

import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { issueJWT } from "@/utils/jwt";
import { hashPassword } from "@/utils/password";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import crypto from "node:crypto";

export default async function register(formData: FormData) {
  const username = formData.get("username") as string | null;
  const password = formData.get("password") as string | null;
  const confirmPassword = formData.get("confirmPassword") as string | null;

  if (!username || !password || !confirmPassword) {
    return {
      data: null,
      error: { message: "Missing required fields" },
      status: 400,
    };
  }

  if (password !== confirmPassword) {
    return {
      data: null,
      error: { message: "Passwords do not match" },
      status: 400,
    };
  }

  try {
    // check if a user is already registered
    const users = await db.select().from(usersTable);
    console.log(users);
    if (users.length > 0) {
      return {
        data: null,
        error: { message: "User already exists" },
        status: 409,
      };
    }

    // check if username is already taken
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username));

    if (user) {
      return {
        data: null,
        error: { message: "User already exists" },
        status: 409,
      };
    }

    const passwordHash = await hashPassword(password);
    const [newUser] = await db
      .insert(usersTable)
      .values({ id: crypto.randomUUID(), username, passwordHash })
      .returning();

    // generate token
    const token = await issueJWT({ username, id: newUser.id });

    (await cookies()).set("token", token, {
      httpOnly: true,
      secure: process.env.BASE_URL?.startsWith("https://") ?? false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return { data: {}, error: null, status: 201 };
  } catch (error) {
    console.error(error);
    return {
      data: null,
      error: { message: "Internal server error" },
      status: 500,
    };
  }
}
