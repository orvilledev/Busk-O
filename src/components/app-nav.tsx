"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListMusic, LogOut, Music, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/songs", label: "Songs", icon: Music },
  { href: "/setlists", label: "Setlists", icon: ListMusic },
  { href: "/import", label: "Import", icon: ScanLine },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-4xl items-center gap-1 px-4">
        <Link href="/songs" className="mr-3 flex items-center gap-2 font-bold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Music className="h-4 w-4" />
          </span>
          Busk-O
        </Link>

        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
                active
                  ? "bg-surface-2 text-foreground"
                  : "text-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          );
        })}

        <form action="/auth/signout" method="post" className="ml-auto">
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </form>
      </nav>
    </header>
  );
}
