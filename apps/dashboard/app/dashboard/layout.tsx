import LiveRefresher from "@/components/live-refresher";
import { ReactNode } from "react";
import Header from "./_components/header";

export default function Layout({
  children,
}: {
  children: Readonly<ReactNode>;
}) {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <Header />
      <LiveRefresher />
      {children}
    </div>
  );
}
