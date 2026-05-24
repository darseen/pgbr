"use client";

import logo from "@/assets/images/pgbr.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { signInSchema } from "@/lib/zod/sign-in";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SubmitEvent } from "react";
import { toast } from "sonner";

export default function SignInForm() {
  const router = useRouter();

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      const result = signInSchema.safeParse({
        email,
        password,
      });

      if (!result.success) return toast.error(result.error.issues[0].message);

      const { error } = await authClient.signIn.email({
        email: result.data.email,
        password: result.data.password,
      });

      if (error) return toast.error(error.message);

      toast.success("Signed in successfully");
      router.replace("/dashboard");
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <section className="flex flex-1 items-center justify-center px-4 pb-8 sm:px-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center sm:mb-8">
          <Image
            src={logo}
            alt="pgbr Logo"
            className="mx-auto h-12 w-auto rounded-lg md:h-16"
          />
          <h2 className="text-2xl font-bold">Welcome back</h2>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="text"
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>
      </div>
    </section>
  );
}
