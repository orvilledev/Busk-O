"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Music, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { SyncIndicator } from "@/components/offline/sync-indicator";

/**
 * Slim top bar: brand + secondary actions (Import, sync, sign out). Primary
 * navigation (Songs / Setlists / Favorites) lives in the bottom tab bar.
 */
export function AppNav() {
  const pathname = usePathname();
  const importActive = pathname.startsWith("/import");

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-4xl items-center px-4">
        <Link href="/songs" className="flex items-center gap-2 font-bold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Music className="h-4 w-4" />
          </span>
          Busk-O
        </Link>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/import"
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
              importActive
                ? "bg-surface-2 text-foreground"
                : "text-muted hover:text-foreground",
            )}
          >
            <ScanLine className="h-4 w-4" />
            <span className="hidden sm:inline">Import</span>
          </Link>
          <SyncIndicator />
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </div>
      </nav>
    </header>
  );
}
