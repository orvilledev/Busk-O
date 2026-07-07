import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StageMode, type StageSong } from "@/components/stage/stage-mode";

/** Stage/performance view for a single song, outside any setlist. */
export default async function SongPlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: song } = await supabase
    .from("songs")
    .select("id, title, artist, original_key, body")
    .eq("id", id)
    .single();
  if (!song) notFound();

  const stageSong: StageSong = {
    id: song.id,
    title: song.title,
    artist: song.artist,
    original_key: song.original_key,
    body: song.body,
    transpose_key: null,
    capo: null,
    notes: null,
  };

  return <StageMode exitHref={`/songs/${id}`} songs={[stageSong]} />;
}
