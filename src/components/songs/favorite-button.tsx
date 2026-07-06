"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { patchSongLocal } from "@/lib/db";
import { emitMirrorUpdated } from "@/lib/mirror-bus";
import { toggleFavorite } from "@/app/(app)/songs/actions";

/** Mirror the toggle locally so Favorites lists update instantly. */
function patchMirror(songId: string, favorite: boolean) {
  patchSongLocal(songId, { favorite })
    .then(emitMirrorUpdated)
    .catch(() => {});
}

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
  const [pending, startTransition] = useTransition();

  function toggle(e: React.MouseEvent) {
    // The button often lives inside/next to a link — don't navigate.
    e.preventDefault();
    e.stopPropagation();
    const next = !fav;
    setFav(next); // optimistic
    patchMirror(songId, next);
    startTransition(async () => {
      try {
        await toggleFavorite(songId, next);
      } catch {
        setFav(!next); // revert on failure
        patchMirror(songId, !next);
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
