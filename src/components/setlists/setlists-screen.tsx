"use client";

import Link from "next/link";
import { Calendar, ListMusic, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMirror } from "@/hooks/use-mirror";
import { useSync } from "@/components/offline/sync-provider";
import { getDB } from "@/lib/db";
import { createSetlist } from "@/app/(app)/setlists/actions";
import type { Setlist } from "@/types/domain";

interface SetlistRow extends Setlist {
  count: number;
}

async function readSetlists(): Promise<SetlistRow[]> {
  const db = await getDB();
  const [setlists, songs] = await Promise.all([
    db.getAll("setlists"),
    db.getAll("setlist_songs"),
  ]);
  const counts = new Map<string, number>();
  for (const s of songs) {
    counts.set(s.setlist_id, (counts.get(s.setlist_id) ?? 0) + 1);
  }
  return setlists
    .map((s) => ({ ...s, count: counts.get(s.id) ?? 0 }))
    .sort((a, b) => {
      // event_date desc with undated last, then newest first.
      const ad = a.event_date ? Date.parse(a.event_date) : -Infinity;
      const bd = b.event_date ? Date.parse(b.event_date) : -Infinity;
      if (bd !== ad) return bd - ad;
      return Date.parse(b.created_at) - Date.parse(a.created_at);
    });
}

/** Setlists rendered instantly from the local mirror; syncs in background. */
export function SetlistsScreen() {
  const list = useMirror(readSetlists);
  const { state } = useSync();

  const warmingUp = list === null || (list.length === 0 && state === "syncing");

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">Setlists</h1>

      <form
        action={createSetlist}
        className="mb-6 flex flex-col gap-2 rounded-xl border border-border bg-surface p-3 sm:flex-row sm:flex-wrap"
      >
        <input
          name="name"
          required
          placeholder="Sunday Morning, Park Busk…"
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent"
        />
        <input
          name="event_date"
          type="date"
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <Button type="submit" className="w-full sm:w-auto">
          <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New setlist</span>
        </Button>
      </form>

      {warmingUp ? (
        <div className="divide-y divide-border rounded-xl border border-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <ListMusic className="mb-3 h-8 w-8 text-muted" />
          <p className="font-medium">No setlists yet</p>
          <p className="mt-1 text-sm text-muted">
            Create one above to start building a set.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {list.map((s) => (
            <li key={s.id}>
              <Link
                href={`/setlists/${s.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-surface-2"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <ListMusic className="h-4 w-4 shrink-0 text-muted" />
                  <span className="truncate font-medium">{s.name}</span>
                </span>
                <span className="flex shrink-0 items-center gap-3 text-xs text-muted">
                  {s.event_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {s.event_date}
                    </span>
                  )}
                  <span>
                    {s.count} {s.count === 1 ? "song" : "songs"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
