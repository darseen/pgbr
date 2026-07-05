import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db, usersTable } from "@repo/db";
import { auth } from "./lib/auth";

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const { pathname } = request.nextUrl;

  if (!session && (pathname === "/" || pathname === "/sign-up")) {
    // check if there is a user in the database
    const [user] = await db.select().from(usersTable);

    if (!user && pathname === "/") {
      return NextResponse.redirect(new URL("/sign-up", request.url));
    }

    if (user && pathname === "/sign-up") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (session && pathname === "/") {
    // If the user has a session and is on the homepage, redirect to the dashboard.
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If the user is trying to access a protected dashboard route without a session, redirect to the homepage.
  if (!session && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/sign-up", "/dashboard/:path*"],
};
