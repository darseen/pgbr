import logo from "@/assets/images/pgbr.png";
import ThemeToggle from "@/components/theme-toggle";
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between px-4 shadow-lg backdrop-blur-xl md:px-8">
      <Link href={"/"} className="flex items-center gap-1">
        <Image
          src={logo}
          alt="pgbr Logo"
          className="size-8 rounded-lg md:size-12"
        />
        <h1 className="text-lg font-bold md:text-2xl">PGBR</h1>
      </Link>
      <ThemeToggle />
    </header>
  );
}
