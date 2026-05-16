import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function authorizeRequest() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: { message: "Unauthorized" }, data: null };
  }

  return { error: null, data: { user: session.user } };
}
