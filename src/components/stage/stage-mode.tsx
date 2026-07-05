"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  List,
  Minus,
  Plus,
  X,
} from "lucide-react";
import {
  KEYS,
  semitonesBetween,
  transposeKey,
  type Key,
} from "@/lib/chordpro";
import { ChordChart } from "@/components/songs/chord-chart";
import { cn } from "@/lib/utils";

export interface StageSong {
  id: string;
  title: string;
  artist: string | null;
  original_key: string | null;
  body: string;
  transpose_key: string | null;
  capo: number | null;
  notes: string | null;
}

const isKey = (k: string | null): k is Key =>
  !!k && (KEYS as readonly string[]).includes(k);

/** Semitones to render this entry at, honoring key override then capo. */
function renderSemitones(song: StageSong): number {
  const base = isKey(song.original_key) ? song.original_key : null;
  const target = isKey(song.transpose_key) ? song.transpose_key : null;
  const transpose = base && target ? semitonesBetween(base, target) : 0;
  return transpose - (song.capo ?? 0);
}

export function StageMode({
  setlistId,
  songs,
}: {
  setlistId: string;
  songs: StageSong[];
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [fontScale, setFontScale] = useState(1.6);
  const [showList, setShowList] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const current = songs[index];
  const last = songs.length - 1;

  const go = useCallback(
    (dir: number) => {
      setIndex((i) => Math.min(last, Math.max(0, i + dir)));
      setShowList(false);
    },
    [last],
  );

  // Keyboard navigation.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "Escape") {
        router.push(`/setlists/${setlistId}`);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, router, setlistId]);

  // Keep the screen awake while on stage.
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    let released = false;

    async function acquire() {
      try {
        if ("wakeLock" in navigator) {
          lock = await navigator.wakeLock.request("screen");
        }
      } catch {
        // Denied or unsupported — nothing we can do, fail quietly.
      }
    }
    acquire();

    function onVisible() {
      if (document.visibilityState === "visible" && !released) acquire();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, []);

  if (!current) return null;

  const soundingKey =
    isKey(current.original_key) && isKey(current.transpose_key)
      ? current.transpose_key
      : isKey(current.original_key)
        ? current.original_key
        : null;
  const shapeKey =
    soundingKey && current.capo
      ? transposeKey(soundingKey, -current.capo)
      : soundingKey;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="min-w-0">
          <div className="truncate text-lg font-bold">{current.title}</div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>
              {index + 1} / {songs.length}
            </span>
            {shapeKey &&
              (current.capo ? (
                <span>
                  capo {current.capo} · play {shapeKey} · sounds {soundingKey}
                </span>
              ) : (
                <span>key {soundingKey}</span>
              ))}
            {current.notes && <span className="text-accent">· {current.notes}</span>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setFontScale((f) => Math.max(0.9, +(f - 0.15).toFixed(2)))}
            className="rounded-md border border-border px-2 py-1 text-sm hover:bg-surface-2"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={() => setFontScale((f) => Math.min(3.5, +(f + 0.15).toFixed(2)))}
            className="rounded-md border border-border px-2 py-1 text-sm hover:bg-surface-2"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowList((s) => !s)}
            className="rounded-md border border-border px-2 py-1 hover:bg-surface-2"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => router.push(`/setlists/${setlistId}`)}
            className="rounded-md border border-border px-2 py-1 hover:bg-surface-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chart area with tap zones + swipe */}
      <div
        className="relative flex-1 overflow-auto"
        onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
          touchStartX.current = null;
        }}
      >
        {/* Left / right tap zones */}
        <button
          aria-label="Previous song"
          onClick={() => go(-1)}
          className="absolute left-0 top-0 z-10 h-full w-[15%]"
        />
        <button
          aria-label="Next song"
          onClick={() => go(1)}
          className="absolute right-0 top-0 z-10 h-full w-[15%]"
        />

        <div className="mx-auto max-w-4xl px-6 py-6">
          <ChordChart
            source={current.body}
            semitones={renderSemitones(current)}
            fontScale={fontScale}
          />
        </div>
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-between border-t border-border px-4 py-2">
        <button
          onClick={() => go(-1)}
          disabled={index === 0}
          className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm hover:bg-surface-2 disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" /> Prev
        </button>
        <span className="text-sm text-muted">{current.artist}</span>
        <button
          onClick={() => go(1)}
          disabled={index === last}
          className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm hover:bg-surface-2 disabled:opacity-30"
        >
          Next <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Quick-jump overlay */}
      {showList && (
        <div
          className="absolute inset-0 z-20 bg-black/70 p-4"
          onClick={() => setShowList(false)}
        >
          <ul
            className="mx-auto max-w-md overflow-hidden rounded-xl border border-border bg-surface"
            onClick={(e) => e.stopPropagation()}
          >
            {songs.map((s, i) => (
              <li key={s.id}>
                <button
                  onClick={() => {
                    setIndex(i);
                    setShowList(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-2",
                    i === index && "bg-surface-2",
                  )}
                >
                  <span className="w-5 text-center text-sm text-muted">
                    {i + 1}
                  </span>
                  <span className="truncate font-medium">{s.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
