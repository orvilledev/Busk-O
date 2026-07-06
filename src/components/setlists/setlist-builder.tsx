"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Play,
  Plus,
  Search,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { KEYS } from "@/lib/keys";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ExportMenu } from "./export-menu";
import type { ExportSetlist } from "@/lib/pptx";
import type { SetlistSongWithSong, Song } from "@/types/domain";
import {
  addSongToSetlist,
  removeSetlistSong,
  reorderSetlistSongs,
  updateSetlistSong,
} from "@/app/(app)/setlists/actions";

type SongPick = Pick<
  Song,
  "id" | "title" | "artist" | "original_key" | "body"
>;

export function SetlistBuilder({
  setlistId,
  setlistName,
  eventDate,
  initialItems,
  availableSongs,
}: {
  setlistId: string;
  setlistName: string;
  eventDate: string | null;
  initialItems: SetlistSongWithSong[];
  availableSongs: SongPick[];
}) {
  const [items, setItems] = useState(initialItems);
  const [picking, setPicking] = useState(false);
  const [, startTransition] = useTransition();
  const dragIndex = useRef<number | null>(null);

  function persistOrder(next: SetlistSongWithSong[]) {
    setItems(next);
    startTransition(() =>
      reorderSetlistSongs(setlistId, next.map((i) => i.id)),
    );
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    persistOrder(next);
  }

  function remove(id: string) {
    const prev = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    startTransition(async () => {
      try {
        await removeSetlistSong(id, setlistId);
      } catch {
        // If delete fails, revert the optimistic removal
        setItems(prev);
      }
    });
  }

  async function add(songId: string) {
    const song = availableSongs.find((s) => s.id === songId);
    if (!song) return;
    setPicking(false);
    // Optimistically append using the row the server returns, so the list
    // updates instantly with no full remount/flicker.
    const row = await addSongToSetlist(setlistId, songId);
    setItems((prev) => [
      ...prev,
      { ...row, song: song as Song } as SetlistSongWithSong,
    ]);
  }

  const exportData: ExportSetlist = {
    name: setlistName,
    eventDate,
    songs: items.map((i) => ({
      title: i.song.title,
      artist: i.song.artist,
      body: i.song.body,
      transpose_key: i.transpose_key,
      capo: i.capo,
      notes: i.notes,
    })),
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">
          {items.length} {items.length === 1 ? "song" : "songs"}
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPicking(true)}>
            <Plus className="h-4 w-4" /> Add song
          </Button>
          <ExportMenu setlist={exportData} />
          {items.length > 0 && (
            <Link href={`/setlists/${setlistId}/play`}>
              <Button size="sm">
                <Play className="h-4 w-4" /> Play
              </Button>
            </Link>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted">
          No songs yet. Add some to build your set.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item, index) => (
            <SetlistRow
              key={item.id}
              item={item}
              index={index}
              total={items.length}
              setlistId={setlistId}
              onMoveUp={() => move(index, index - 1)}
              onMoveDown={() => move(index, index + 1)}
              onRemove={() => remove(item.id)}
              onDragStart={() => (dragIndex.current = index)}
              onDropOn={() => {
                if (dragIndex.current !== null && dragIndex.current !== index) {
                  move(dragIndex.current, index);
                }
                dragIndex.current = null;
              }}
            />
          ))}
        </ul>
      )}

      {picking && (
        <SongPicker
          songs={availableSongs}
          onPick={add}
          onClose={() => setPicking(false)}
        />
      )}
    </div>
  );
}

function SetlistRow({
  item,
  index,
  total,
  setlistId,
  onMoveUp,
  onMoveDown,
  onRemove,
  onDragStart,
  onDropOn,
}: {
  item: SetlistSongWithSong;
  index: number;
  total: number;
  setlistId: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDropOn: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  function patch(p: {
    transpose_key?: string | null;
    capo?: number | null;
    notes?: string | null;
  }) {
    startTransition(() => updateSetlistSong(item.id, setlistId, p));
  }

  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDropOn}
      className="rounded-xl border border-border bg-surface"
    >
      <div className="flex items-center gap-2 p-3">
        <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted" />
        <span className="w-5 text-center text-sm text-muted">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{item.song.title}</div>
          <div className="flex items-center gap-2 text-xs text-muted">
            {item.song.artist && <span className="truncate">{item.song.artist}</span>}
            {item.transpose_key && (
              <span className="rounded bg-surface-2 px-1.5">
                → {item.transpose_key}
              </span>
            )}
            {item.capo ? (
              <span className="rounded bg-surface-2 px-1.5">capo {item.capo}</span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="rounded p-1 text-muted hover:bg-surface-2 disabled:opacity-30"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="rounded p-1 text-muted hover:bg-surface-2 disabled:opacity-30"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            onClick={() => setOpen((o) => !o)}
            className={cn(
              "rounded p-1 hover:bg-surface-2",
              open ? "text-accent" : "text-muted",
            )}
          >
            <Settings2 className="h-4 w-4" />
          </button>
          <button
            onClick={onRemove}
            className="rounded p-1 text-muted hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {open && (
        <div className="grid gap-3 border-t border-border p-3 sm:grid-cols-3">
          <label className="text-xs text-muted">
            Play in key
            <select
              defaultValue={item.transpose_key ?? ""}
              onChange={(e) => patch({ transpose_key: e.target.value || null })}
              className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-accent"
            >
              <option value="">Original ({item.song.original_key ?? "—"})</option>
              {KEYS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted">
            Capo
            <input
              type="number"
              min={0}
              max={11}
              defaultValue={item.capo ?? ""}
              onChange={(e) =>
                patch({ capo: e.target.value ? Number(e.target.value) : null })
              }
              className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-accent"
            />
          </label>
          <label className="text-xs text-muted sm:col-span-1">
            Notes
            <input
              defaultValue={item.notes ?? ""}
              placeholder="acoustic intro, repeat bridge…"
              onBlur={(e) => patch({ notes: e.target.value || null })}
              className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:border-accent"
            />
          </label>
        </div>
      )}
    </li>
  );
}

function SongPicker({
  songs,
  onPick,
  onClose,
}: {
  songs: SongPick[];
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const filtered = songs.filter(
    (s) =>
      !q ||
      s.title.toLowerCase().includes(q.toLowerCase()) ||
      (s.artist?.toLowerCase().includes(q.toLowerCase()) ?? false),
  );

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center bg-black/60 p-4 pt-24"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border p-3">
          <Search className="h-4 w-4 text-muted" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search songs to add…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
          />
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="max-h-80 overflow-auto">
          {filtered.length === 0 ? (
            <li className="p-4 text-center text-sm text-muted">
              No songs found. Create one first.
            </li>
          ) : (
            filtered.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => onPick(s.id)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-surface-2"
                >
                  <span className="truncate font-medium">{s.title}</span>
                  {s.artist && (
                    <span className="ml-2 truncate text-sm text-muted">
                      {s.artist}
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
