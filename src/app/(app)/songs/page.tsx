import Link from "next/link";
import { Music, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { SongLibrary } from "@/components/songs/song-library";

export default async function SongsPage() {
  const supabase = await createClient();
  const { data: songs } = await supabase
    .from("songs")
    .select("id, title, artist, original_key, tags")
    .order("title", { ascending: true });

  const list = songs ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Songs</h1>
        <Link href="/songs/new">
          <Button size="sm">
            <Plus className="h-4 w-4" /> New song
          </Button>
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <Music className="mb-3 h-8 w-8 text-muted" />
          <p className="font-medium">No songs yet</p>
          <p className="mb-4 mt-1 text-sm text-muted">
            Add your first chord chart to get started.
          </p>
          <Link href="/songs/new">
            <Button size="sm">
              <Plus className="h-4 w-4" /> New song
            </Button>
          </Link>
        </div>
      ) : (
        <SongLibrary songs={list} />
      )}
    </div>
  );
}
