"use server";

import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { issueJWT } from "@/utils/jwt";
import { comparePassword } from "@/utils/password";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export default async function signIn(formData: FormData) {
  const username = formData.get("username") as string | null;
  const password = formData.get("password") as string | null;

  if (!username || !password) {
    return {
      data: null,
      error: { message: "Missing required fields" },
      status: 400,
    };
  }

  try {
    // check if user exists
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username));

    if (!user) {
      return {
        data: null,
        error: { message: "Invalid credentials" },
        status: 401,
      };
    }

    // check if password is correct
    const passwordHash = user.passwordHash;
    const isPasswordCorrect = await comparePassword(password, passwordHash);
    if (!isPasswordCorrect) {
      return {
        data: null,
        error: { message: "Invalid credentials" },
        status: 401,
      };
    }

    // generate token
    const token = await issueJWT({ username: user.username, id: user.id });

    // set token cookie
    (await cookies()).set("token", token, {
      httpOnly: true,
      secure: process.env.BASE_URL?.startsWith("https://") ?? false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return { data: { user }, error: null, status: 200 };
  } catch (error) {
    console.error(error);
    return {
      data: null,
      error: { message: "Internal server error" },
      status: 500,
    };
  }
}
