import Link from "next/link";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { SongLibrary } from "@/components/songs/song-library";
import type { Song } from "@/types/domain";

export default async function FavoritesPage() {
  const supabase = await createClient();
  // Filter in JS so this page still works before the favorites migration runs.
  const { data: songs } = await supabase
    .from("songs")
    .select("*")
    .order("title", { ascending: true });

  const favorites = ((songs ?? []) as Song[]).filter((s) => s.favorite);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Favorites</h1>

      {favorites.length === 0 ? (
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
