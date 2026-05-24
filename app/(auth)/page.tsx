import { Metadata } from "next";
import Info from "./_components/info";
import SignInForm from "./_components/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your pgbr account",
};

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col-reverse lg:flex-row">
      <Info />
      <SignInForm />
    </main>
  );
}
