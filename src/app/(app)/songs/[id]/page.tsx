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
  const { data: song } = await supabase
    .from("songs")
    .select("*")
    .eq("id", id)
    .single();

  if (!song) notFound();

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
      <SongView song={song as Song} deleteAction={handleDelete} />
    </div>
  );
}
