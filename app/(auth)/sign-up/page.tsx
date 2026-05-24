import type { Metadata } from "next";
import Info from "../_components/info";
import SignUpForm from "./_components/form";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create an admin account",
};

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col-reverse lg:flex-row">
      <Info />
      <SignUpForm />
    </main>
  );
}
