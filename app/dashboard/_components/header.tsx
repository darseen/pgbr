"use client";

import signOut from "@/actions/auth/sign-out";
import logo from "@/assets/images/pgbr.png";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Backups", href: "/backups" },
];

export default function Header() {
  const pathname = usePathname();

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

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
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
