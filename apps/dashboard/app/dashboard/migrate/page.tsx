import { db } from "@repo/db";
import { databasesTable } from "@repo/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Stepper from "./_components/stepper";

export const metadata: Metadata = {
  title: "Database Migration Tool",
};

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) redirect("/");
  // The stepper picks a saved database by id and the worker resolves the
  // credential itself, so the url column is never selected here.
  const databases = await db
    .select({
      id: databasesTable.id,
      name: databasesTable.name,
    })
    .from(databasesTable)
    .where(eq(databasesTable.userId, session.user.id));

  return (
    <div className="bg-muted/30 animate-in fade-in slide-in-from-bottom-2 flex-1 pb-12 duration-500">
      <Stepper databases={databases} />
    </div>
  );
}
