import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SongEditor } from "@/components/songs/song-editor";
import { getRole } from "@/lib/supabase/server";
import { canEditSongs } from "@/lib/roles";
import { createSong } from "../actions";

export default async function NewSongPage() {
  // Only admins can add to the shared pool.
  if (!canEditSongs(await getRole())) redirect("/songs");

  return (
    <div>
      <Link
        href="/songs"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Songs
      </Link>
      <h1 className="mb-6 text-xl font-bold">New song</h1>
      <SongEditor action={createSong} />
    </div>
  );
}
