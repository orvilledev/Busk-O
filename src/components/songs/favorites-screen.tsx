"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SongLibrary } from "./song-library";
import { ListSkeleton } from "./songs-screen";
import { useMirror } from "@/hooks/use-mirror";
import { useSync } from "@/components/offline/sync-provider";
import { getSongs } from "@/lib/db";
import type { Song } from "@/types/domain";

async function readFavorites(): Promise<Song[]> {
  const rows = await getSongs();
  return rows
    .filter((s) => s.favorite)
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** Favorites rendered instantly from the local mirror; syncs in background. */
export function FavoritesScreen() {
  const favorites = useMirror(readFavorites);
  const { state } = useSync();

  const warmingUp =
    favorites === null || (favorites.length === 0 && state === "syncing");

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Favorites</h1>

      {warmingUp ? (
        <ListSkeleton />
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <Star className="mb-3 h-8 w-8 text-muted" />
          <p className="font-medium">No favorites yet</p>
          <p className="mb-4 mt-1 text-sm text-muted">
            Tap the star on any song to keep it here for quick access.
          </p>
          <Link href="/songs">
            <Button variant="secondary" size="sm">
              Browse songs
            </Button>
          </Link>
        </div>
      ) : (
        <SongLibrary songs={favorites} />
      )}
    </div>
  );
}
