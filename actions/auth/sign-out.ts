"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function signOut() {
  (await cookies()).delete("token");
  redirect("/");
}
