"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleFavorite } from "@/app/(app)/songs/actions";

export function FavoriteButton({
  songId,
  initial,
  className,
  iconClassName = "h-5 w-5",
}: {
  songId: string;
  initial: boolean;
  className?: string;
  iconClassName?: string;
}) {
  const [fav, setFav] = useState(initial);
  const [, startTransition] = useTransition();

  function toggle(e: React.MouseEvent) {
    // The button often lives inside/next to a link — don't navigate.
    e.preventDefault();
    e.stopPropagation();
    const next = !fav;
    setFav(next); // optimistic
    startTransition(async () => {
      try {
        await toggleFavorite(songId, next);
      } catch {
        setFav(!next); // revert on failure
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={fav}
      aria-label={fav ? "Remove from favorites" : "Add to favorites"}
      title={fav ? "Favorited" : "Add to favorites"}
      className={cn(
        "inline-flex items-center justify-center rounded-lg p-2 transition-colors",
        fav ? "text-accent" : "text-muted hover:text-foreground",
        className,
      )}
    >
      <Star className={cn(iconClassName, fav && "fill-accent")} />
    </button>
  );
}
