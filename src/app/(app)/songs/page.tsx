import Link from "next/link";
import { Music, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import type { Song } from "@/types/domain";

export default async function SongsPage() {
  const supabase = await createClient();
  const { data: songs } = await supabase
    .from("songs")
    .select("id, title, artist, original_key")
    .order("title", { ascending: true });

  const list = (songs ?? []) as Pick<
    Song,
    "id" | "title" | "artist" | "original_key"
  >[];

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
        <ul className="divide-y divide-border rounded-xl border border-border">
          {list.map((song) => (
            <li key={song.id}>
              <Link
                href={`/songs/${song.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-surface-2"
              >
                <span>
                  <span className="font-medium">{song.title}</span>
                  {song.artist && (
                    <span className="ml-2 text-sm text-muted">
                      {song.artist}
                    </span>
                  )}
                </span>
                {song.original_key && (
                  <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">
                    {song.original_key}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
