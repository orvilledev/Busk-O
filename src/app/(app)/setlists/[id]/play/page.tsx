import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StageMode, type StageSong } from "@/components/stage/stage-mode";

export default async function PlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: setlist } = await supabase
    .from("setlists")
    .select("id")
    .eq("id", id)
    .single();
  if (!setlist) notFound();

  const { data: items } = await supabase
    .from("setlist_songs")
    .select(
      "transpose_key, capo, notes, song:songs(id, title, artist, original_key, body)",
    )
    .eq("setlist_id", id)
    .order("position", { ascending: true });

  const songs: StageSong[] = (items ?? [])
    .filter((i) => i.song)
    .map((i) => {
      const song = i.song as unknown as {
        id: string;
        title: string;
        artist: string | null;
        original_key: string | null;
        body: string;
      };
      return {
        id: song.id,
        title: song.title,
        artist: song.artist,
        original_key: song.original_key,
        body: song.body,
        transpose_key: i.transpose_key,
        capo: i.capo,
        notes: i.notes,
      };
    });

  if (songs.length === 0) redirect(`/setlists/${id}`);

  return <StageMode exitHref={`/setlists/${id}`} songs={songs} />;
}
