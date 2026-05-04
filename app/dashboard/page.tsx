import { Metadata } from "next";
import DatabasesList from "./_components/databases/databases-list";
import Header from "./_components/header";
import JobHistory from "./_components/job-history";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="bg-background min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <DatabasesList />

          <div className="h-fit lg:sticky lg:top-8">
            <JobHistory />
          </div>
        </div>
      </main>
    </div>
  );
}
