import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient, getRole } from "@/lib/supabase/server";
import { SongEditor } from "@/components/songs/song-editor";
import { canEditSongs } from "@/lib/roles";
import { updateSong } from "../../actions";
import type { Song } from "@/types/domain";

export default async function EditSongPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Only admins can edit the shared pool.
  if (!canEditSongs(await getRole())) redirect(`/songs/${id}`);

  const supabase = await createClient();
  const { data: song } = await supabase
    .from("songs")
    .select("*")
    .eq("id", id)
    .single();

  if (!song) notFound();

  const updateAction = updateSong.bind(null, id);

  return (
    <div>
      <Link
        href={`/songs/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to song
      </Link>
      <h1 className="mb-6 text-xl font-bold">Edit song</h1>
      <SongEditor song={song as Song} action={updateAction} />
    </div>
  );
}
