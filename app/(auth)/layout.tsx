import { ReactNode } from "react";
import Header from "./_components/header";

export default function AuthLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  console.log("auth layout");
  return (
    <>
      <Header />
      {children}
    </>
  );
}
