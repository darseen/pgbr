import { db } from "@repo/db";
import { databasesTable } from "@repo/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { ArrowDownUp } from "lucide-react";
import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PageHeader, PageShell } from "../_components/page-shell";
import Stepper from "./_components/stepper";

export const metadata: Metadata = {
  title: "Migrate",
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
    <PageShell width="medium">
      <PageHeader
        title="Migrate"
        description="Copy one database into another in a single pass"
        icon={ArrowDownUp}
      />
      <Stepper databases={databases} />
    </PageShell>
  );
}
