"use client";

import checkUser from "@/actions/auth/check-user";
import logo from "@/assets/images/pgbr.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { signUpSchema } from "@/lib/zod/sign-up";
import { Shield } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SubmitEvent } from "react";
import { toast } from "sonner";

export default function SignUpForm() {
  const router = useRouter();

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const formData = new FormData(e.currentTarget);

      const email = formData.get("email") as string;
      const username = formData.get("username") as string;
      const password = formData.get("password") as string;
      const confirmPassword = formData.get("confirmPassword") as string;

      const result = signUpSchema.safeParse({
        email,
        username,
        password,
        confirmPassword,
      });

      if (!result.success) return toast.error(result.error.issues[0].message);

      const { status } = await checkUser();

      if (status !== 404) return toast.error("User already exists");

      const { error } = await authClient.signUp.email({
        email: result.data.email,
        name: result.data.username,
        username: result.data.username,
        password: result.data.password,
      });
      if (error) return toast.error(error.message);

      toast.success("Account created successfully");
      router.replace("/dashboard");
    } catch (error) {
      console.error(error);
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
          <h2 className="flex items-center justify-center gap-2 text-xl font-bold sm:text-2xl">
            Create Admin Account
          </h2>
          <p className="mt-2 text-sm sm:text-base">
            Register a new administrator account for pgbr
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Choose a username"
              required
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a strong password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>
          <div className="bg-accent text-accent-foreground rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 shrink-0" />
              <p className="text-xs sm:text-sm">
                This will create an administrator account with full access.
              </p>
            </div>
          </div>
          <Button type="submit" className="w-full">
            Create Admin Account
          </Button>
        </form>
      </div>
    </section>
  );
}
