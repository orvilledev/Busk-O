import Link from "next/link";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { SongLibrary } from "@/components/songs/song-library";
import type { Song } from "@/types/domain";

export default async function FavoritesPage() {
  const supabase = await createClient();
  // Query only favorite songs with indexed favorite column for speed
  const { data: favorites } = await supabase
    .from("songs")
    .select("id,title,artist,original_key,tags,favorite")
    .eq("favorite", true)
    .order("title", { ascending: true });

  const list = (favorites ?? []) as Song[];

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Favorites</h1>

      {list.length === 0 ? (
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
        <SongLibrary songs={list} />
      )}
    </div>
  );
}
