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
  const databases = await db
    .select()
    .from(databasesTable)
    .where(eq(databasesTable.userId, session.user.id));

  return (
    <main className="bg-muted/30 min-h-screen pb-12">
      <Stepper databases={databases} />
    </main>
  );
}
