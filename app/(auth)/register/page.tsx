import type { Metadata } from "next";
import Info from "../_components/info";
import RegisterForm from "./_components/register-form";

export const metadata: Metadata = {
  title: "Register",
  description: "Create an admin account",
};

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col-reverse lg:flex-row">
      <Info />
      <RegisterForm />
    </main>
  );
}
