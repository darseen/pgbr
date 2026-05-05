import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "./db";
import { usersTable } from "./db/schema";
import { verifyToken } from "./utils/jwt";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // check if there is a user in the database
  const [user] = await db.select().from(usersTable);

  if (!user && pathname === "/") {
    return NextResponse.redirect(new URL("/register", request.url));
  }

  if (user && pathname === "/register") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (user) {
    if (token && pathname === "/") {
      // If the user has a token and is on the homepage, redirect to the dashboard.
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // If the user is trying to access a protected dashboard route without a token, redirect to the homepage.
  if (!token && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If a token exists for a protected route, verify it.
  if (token && pathname.startsWith("/dashboard")) {
    // verify token
    const payload = await verifyToken(token);
    if (!payload) {
      // Token is invalid, redirect to the homepage and clear the invalid token.
      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.delete("token");
      return response;
    }

    // check if user exists in the database
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, payload.user.id));
    if (!user) {
      // Token is invalid, redirect to the homepage and clear the invalid token.
      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.delete("token");
      return response;
    }
  }
}

export const config = {
  matcher: ["/", "/register", "/dashboard/:path*"],
};
