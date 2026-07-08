import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SongView } from "@/components/songs/song-view";
import { deleteSong } from "../actions";
import type { Song } from "@/types/domain";

export default async function SongPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: song }, fav] = await Promise.all([
    supabase.from("songs").select("*").eq("id", id).single(),
    user
      ? supabase
          .from("song_favorites")
          .select("song_id")
          .eq("user_id", user.id)
          .eq("song_id", id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (!song) notFound();

  // Favorites live in a per-user table; fold the flag onto the song.
  const songWithFav = { ...song, favorite: !!fav.data } as Song;

  async function handleDelete() {
    "use server";
    await deleteSong(id);
  }

  return (
    <div>
      <Link
        href="/songs"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Songs
      </Link>
      <SongView song={songWithFav} deleteAction={handleDelete} />
    </div>
  );
}
