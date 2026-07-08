"use client";

import Link from "next/link";
import { Music, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SongLibrary } from "./song-library";
import { useMirror } from "@/hooks/use-mirror";
import { useSync } from "@/components/offline/sync-provider";
import { useCanEditSongs } from "@/components/role-provider";
import { getSongs } from "@/lib/db";
import type { Song } from "@/types/domain";

async function readSongs(): Promise<Song[]> {
  const rows = await getSongs();
  return rows.sort((a, b) => a.title.localeCompare(b.title));
}

/** Songs list rendered instantly from the local mirror; syncs in background. */
export function SongsScreen() {
  const songs = useMirror(readSongs);
  const { state } = useSync();
  const canEdit = useCanEditSongs();

  // First-ever visit: mirror is empty while the initial pull runs.
  const warmingUp =
    songs === null || (songs.length === 0 && state === "syncing");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Songs</h1>
        {canEdit && (
          <Link href="/songs/new">
            <Button size="sm">
              <Plus className="h-4 w-4" /> New song
            </Button>
          </Link>
        )}
      </div>

      {warmingUp ? (
        <ListSkeleton />
      ) : songs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <Music className="mb-3 h-8 w-8 text-muted" />
          <p className="font-medium">No songs yet</p>
          <p className="mb-4 mt-1 text-sm text-muted">
            {canEdit
              ? "Add your first chord chart to get started."
              : "Songs added by your team will appear here."}
          </p>
          {canEdit && (
            <Link href="/songs/new">
              <Button size="sm">
                <Plus className="h-4 w-4" /> New song
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <SongLibrary songs={songs} />
      )}
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div>
      <Skeleton className="mb-3 h-10 w-full" />
      <div className="divide-y divide-border rounded-xl border border-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}
