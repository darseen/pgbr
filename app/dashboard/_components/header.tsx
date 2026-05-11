import signOut from "@/actions/auth/sign-out";
import logo from "@/assets/images/pgbr.png";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-card sticky top-0 z-10 border-b">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href={"/"} className="flex items-center gap-1">
            <Image
              src={logo}
              alt="pgbr Logo"
              className="size-8 rounded-lg md:size-12"
            />
            <h1 className="text-lg font-bold md:text-2xl">PGBR</h1>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="size-4" />
            Sign out
          </Button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
