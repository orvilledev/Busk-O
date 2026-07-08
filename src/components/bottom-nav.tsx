"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gauge, ListMusic, Music, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/songs", label: "Songs", icon: Music },
  { href: "/setlists", label: "Setlists", icon: ListMusic },
  { href: "/favorites", label: "Favorites", icon: Star },
  { href: "/tuner", label: "Tuner", icon: Gauge },
];

/**
 * Fixed bottom tab bar — the app's primary navigation on every screen size.
 * Big touch targets, safe-area padding for the iPhone home indicator.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-4xl">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors active:bg-surface-2",
                active ? "text-accent" : "text-muted hover:text-foreground",
              )}
            >
              <Icon
                className={cn("h-6 w-6", active && "fill-accent/20")}
                strokeWidth={active ? 2.5 : 2}
              />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
