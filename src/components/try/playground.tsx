"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Gauge, Pause, Play, RotateCcw, Type } from "lucide-react";
import { DEMO_SONGS } from "@/lib/demo-songs";
import { KEYS, transposeKey, type Key } from "@/lib/keys";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { ChordChart } from "@/components/songs/chord-chart";
import { ChordColorPicker } from "@/components/songs/chord-color-picker";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";
import { cn } from "@/lib/utils";

const isKey = (k: string): k is Key => (KEYS as readonly string[]).includes(k);

/**
 * The backend-free "try" experience — mirrors the in-app song view (title,
 * transpose/capo, text size, chord color, auto-scroll, stage view) so visitors
 * feel exactly what using Busk-O on stage is like.
 */
export function Playground() {
  const [songIndex, setSongIndex] = useState(0);
  const [semitones, setSemitones] = useState(0);
  const [capo, setCapo] = useState(0);
  const [fontScale, setFontScale] = useState(1);
  const [speed, setSpeed] = useState(24); // px per second
  const [moreOpen, setMoreOpen] = useState(false);

  const song = DEMO_SONGS[songIndex];
  const baseKey = song?.key ?? null;
  const renderSemitones = semitones - capo;
  const sounding =
    baseKey && isKey(baseKey) ? transposeKey(baseKey, semitones) : null;
  const shape =
    baseKey && isKey(baseKey) ? transposeKey(baseKey, renderSemitones) : null;

  // Auto-scroll the whole page hands-free, exactly like the app's song view.
  const scrollElRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    scrollElRef.current =
      (document.scrollingElement as HTMLElement | null) ??
      document.documentElement;
  }, []);
  const { scrolling, setScrolling } = useAutoScroll(scrollElRef, speed);

  function loadSong(i: number) {
    setSongIndex(i);
    setSemitones(0);
    setCapo(0);
  }

  return (
    <div>
      {/* Header: title + performance actions */}
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold sm:text-2xl">{song.title}</h1>
          {song.artist && (
            <p className="text-sm text-muted sm:text-base">{song.artist}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            onClick={() => setScrolling((s) => !s)}
            aria-pressed={scrolling}
            title={scrolling ? "Pause auto-scroll" : "Play (auto-scroll)"}
          >
            {scrolling ? (
              <Pause className="h-4 w-4 shrink-0" />
            ) : (
              <Play className="h-4 w-4 shrink-0" />
            )}
            <span className="hidden sm:inline">
              {scrolling ? " Pause" : " Play"}
            </span>
          </Button>
        </div>
      </div>

      {/* Demo song switcher (only when more than one is bundled) */}
      {DEMO_SONGS.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {DEMO_SONGS.map((s, i) => (
            <button
              key={s.title}
              onClick={() => loadSong(i)}
              className={cn(
                "rounded-full px-3 py-1 text-sm transition-colors",
                i === songIndex
                  ? "bg-accent text-accent-foreground"
                  : "bg-surface-2 text-muted hover:text-foreground",
              )}
            >
              {s.title}
            </button>
          ))}
        </div>
      )}

      {/* Controls. On phones only transpose and chord colour show by default;
          everything else tucks behind "More". On sm+ all controls are inline. */}
      <div className="mb-5 grid gap-3 rounded-xl border border-border bg-surface p-3 text-sm sm:flex sm:flex-wrap sm:items-center sm:gap-4">
        <div className="flex flex-wrap items-center gap-3 sm:contents">
          <Stepper
            label="Transpose"
            display={semitones > 0 ? `+${semitones}` : `${semitones}`}
            onDec={() => setSemitones((s) => s - 1)}
            onInc={() => setSemitones((s) => s + 1)}
          />
          <ChordColorPicker />
          <button
            onClick={() => setMoreOpen((o) => !o)}
            aria-expanded={moreOpen}
            className="ml-auto flex items-center gap-1 text-muted hover:text-foreground sm:hidden"
          >
            More
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", moreOpen && "rotate-180")}
            />
          </button>
        </div>

        <div
          className={cn(
            moreOpen ? "flex" : "hidden",
            "flex-wrap items-center gap-3 sm:contents",
          )}
        >
        <Stepper
          label="Capo"
          display={`${capo}`}
          onDec={() => setCapo((c) => Math.max(0, c - 1))}
          onInc={() => setCapo((c) => Math.min(11, c + 1))}
        />
        <div className="flex items-center gap-1">
          <Type className="h-4 w-4 text-muted" />
          <button
            className="rounded-md border border-border px-2 py-0.5 hover:bg-surface-2"
            onClick={() => setFontScale((f) => Math.max(0.7, +(f - 0.1).toFixed(1)))}
          >
            A−
          </button>
          <button
            className="rounded-md border border-border px-2 py-0.5 hover:bg-surface-2"
            onClick={() => setFontScale((f) => Math.min(2.5, +(f + 0.1).toFixed(1)))}
          >
            A+
          </button>
        </div>
        {scrolling && (
          <div className="flex items-center gap-1" title="Auto-scroll speed">
            <Gauge className="h-4 w-4 text-muted" />
            <button
              className="rounded-md border border-border px-2 py-0.5 hover:bg-surface-2"
              onClick={() => setSpeed((s) => Math.max(6, s - 6))}
            >
              −
            </button>
            <span className="w-6 text-center font-mono text-xs">{speed}</span>
            <button
              className="rounded-md border border-border px-2 py-0.5 hover:bg-surface-2"
              onClick={() => setSpeed((s) => Math.min(120, s + 6))}
            >
              +
            </button>
          </div>
        )}
        {(semitones !== 0 || capo !== 0) && (
          <button
            onClick={() => {
              setSemitones(0);
              setCapo(0);
            }}
            className="flex items-center gap-1 text-muted hover:text-foreground sm:ml-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        )}
        <div className="text-xs text-muted sm:ml-auto sm:text-sm">
          {shape ? (
            capo > 0 ? (
              <>
                Capo {capo} · play in{" "}
                <span className="font-semibold text-foreground">{shape}</span> ·
                sounds{" "}
                <span className="font-semibold text-foreground">{sounding}</span>
              </>
            ) : (
              <>
                Key{" "}
                <span className="font-semibold text-foreground">{sounding}</span>
              </>
            )
          ) : null}
        </div>
        </div>
      </div>

      <ChordChart
        source={song.body}
        semitones={renderSemitones}
        fontScale={fontScale}
      />
    </div>
  );
}
