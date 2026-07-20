"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Music, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "./favorite-button";

type SongRow = {
  id: string;
  title: string;
  artist: string | null;
  original_key: string | null;
  tags: string[];
  favorite?: boolean;
};

const PAGE_SIZE = 50;

export function SongLibrary({ songs }: { songs: SongRow[] }) {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const allTags = useMemo(
    () => Array.from(new Set(songs.flatMap((s) => s.tags))).sort(),
    [songs],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return songs.filter((s) => {
      const matchesQuery =
        !q ||
        s.title.toLowerCase().includes(q) ||
        (s.artist?.toLowerCase().includes(q) ?? false);
      const matchesTag = !activeTag || s.tags.includes(activeTag);
      return matchesQuery && matchesTag;
    });
  }, [songs, query, activeTag]);

  useEffect(() => {
    setPage(1);
  }, [query, activeTag]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title or artist…"
          className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted focus:border-accent"
        />
      </div>

      {allTags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag((t) => (t === tag ? null : tag))}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs transition-colors",
                activeTag === tag
                  ? "bg-accent text-accent-foreground"
                  : "bg-surface-2 text-muted hover:text-foreground",
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted">
          No songs match your search.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {paged.map((song) => (
            <li key={song.id} className="flex items-center hover:bg-surface-2">
              <Link
                href={`/songs/${song.id}`}
                className="flex min-w-0 flex-1 items-center justify-between py-3 pl-4 pr-2"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Music className="h-4 w-4 shrink-0 text-muted" />
                  <span className="flex min-w-0 flex-col">
                    <span className="font-medium leading-tight break-words">
                      {song.title}
                    </span>
                    {song.artist && (
                      <span className="truncate text-sm text-muted">
                        {song.artist}
                      </span>
                    )}
                  </span>
                </span>
                {song.original_key && (
                  <span className="ml-2 shrink-0 rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">
                    {song.original_key}
                  </span>
                )}
              </Link>
              <FavoriteButton
                songId={song.id}
                initial={song.favorite ?? false}
                className="mr-2 shrink-0"
                iconClassName="h-4 w-4"
              />
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => p - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <span className="text-sm text-muted">
            Page {currentPage} of {pageCount}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={currentPage >= pageCount}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
