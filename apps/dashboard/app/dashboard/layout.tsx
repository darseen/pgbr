import LiveRefresher from "@/components/live-refresher";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import AppSidebar from "./_components/app-sidebar";
import Header from "./_components/header";

export default async function Layout({
  children,
}: {
  children: Readonly<ReactNode>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");

  // Read the persisted state so the server renders the same open/collapsed
  // sidebar the user left it in, avoiding a flash on first paint.
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar
        user={{
          name: session.user.name || session.user.email,
          email: session.user.email,
        }}
      />
      <SidebarInset className="min-w-0">
        <Header />
        <LiveRefresher />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
