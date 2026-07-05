"use client";

import { useEffect, useRef, useState } from "react";
import {
  Maximize2,
  Minus,
  Music,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Type,
  X,
} from "lucide-react";
import { DEMO_SONGS } from "@/lib/demo-songs";
import { KEYS, transposeKey, type Key } from "@/lib/keys";
import { ChordChart } from "@/components/songs/chord-chart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const isKey = (k: string): k is Key => (KEYS as readonly string[]).includes(k);

export function Playground() {
  const [songIndex, setSongIndex] = useState(0);
  const [body, setBody] = useState(DEMO_SONGS[0].body);
  const [semitones, setSemitones] = useState(0);
  const [capo, setCapo] = useState(0);
  const [fontScale, setFontScale] = useState(1.1);
  const [stage, setStage] = useState(false);

  const baseKey = DEMO_SONGS[songIndex]?.key ?? null;
  const renderSemitones = semitones - capo;
  const sounding = baseKey && isKey(baseKey) ? transposeKey(baseKey, semitones) : null;
  const shape = sounding ? transposeKey(sounding, -capo) : null;

  function loadSong(i: number) {
    setSongIndex(i);
    setBody(DEMO_SONGS[i].body);
    setSemitones(0);
    setCapo(0);
  }

  return (
    <div>
      <div className="mb-4 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm">
        <strong>Local preview.</strong> You&apos;re trying Busk-O with no account —
        edits live only in this tab. Connect Supabase to unlock accounts,
        setlists, offline sync, export &amp; OCR import.
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Music className="h-4 w-4 text-muted" />
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
        <Button
          variant="secondary"
          size="sm"
          className="ml-auto"
          onClick={() => setStage(true)}
        >
          <Maximize2 className="h-4 w-4" /> Stage view
        </Button>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-3 text-sm">
        <Stepper
          label="Transpose"
          display={semitones > 0 ? `+${semitones}` : `${semitones}`}
          onDec={() => setSemitones((s) => s - 1)}
          onInc={() => setSemitones((s) => s + 1)}
        />
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
        {(semitones !== 0 || capo !== 0) && (
          <button
            onClick={() => {
              setSemitones(0);
              setCapo(0);
            }}
            className="flex items-center gap-1 text-muted hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        )}
        {shape && (
          <div className="ml-auto text-muted">
            {capo > 0 ? (
              <>
                Capo {capo} · play{" "}
                <span className="font-semibold text-foreground">{shape}</span> ·
                sounds{" "}
                <span className="font-semibold text-foreground">{sounding}</span>
              </>
            ) : (
              <>
                Key{" "}
                <span className="font-semibold text-foreground">{sounding}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Editor + preview */}
      <div className="grid gap-3 lg:grid-cols-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          spellCheck={false}
          className="min-h-96 w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-sm outline-none focus:border-accent"
        />
        <div className="min-h-96 overflow-auto rounded-lg border border-border bg-surface p-4">
          <ChordChart source={body} semitones={renderSemitones} fontScale={fontScale} />
        </div>
      </div>

      {stage && (
        <StageOverlay
          source={body}
          semitones={renderSemitones}
          title={DEMO_SONGS[songIndex]?.title ?? "Song"}
          onClose={() => setStage(false)}
        />
      )}
    </div>
  );
}

function Stepper({
  label,
  display,
  onDec,
  onInc,
}: {
  label: string;
  display: string;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-muted">{label}</span>
      <button
        onClick={onDec}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-surface-2"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-8 text-center font-mono">{display}</span>
      <button
        onClick={onInc}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-surface-2"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function StageOverlay({
  source,
  semitones,
  title,
  onClose,
}: {
  source: string;
  semitones: number;
  title: string;
  onClose: () => void;
}) {
  const [font, setFont] = useState(1.8);
  const [scrolling, setScrolling] = useState(false);
  const [speed, setSpeed] = useState(24);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scrolling) return;
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0;
    let prev = performance.now();
    let remainder = 0;
    function step(now: number) {
      remainder += (speed * (now - prev)) / 1000;
      prev = now;
      const whole = Math.floor(remainder);
      if (whole > 0) {
        el!.scrollTop += whole;
        remainder -= whole;
      }
      if (el!.scrollTop + el!.clientHeight >= el!.scrollHeight - 1) {
        setScrolling(false);
        return;
      }
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [scrolling, speed]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="truncate text-lg font-bold">{title}</div>
        <div className="flex items-center gap-1">
          {scrolling && (
            <div className="mr-1 hidden items-center gap-1 sm:flex">
              <button
                onClick={() => setSpeed((s) => Math.max(6, s - 6))}
                className="rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-2"
              >
                −
              </button>
              <span className="w-6 text-center font-mono text-xs">{speed}</span>
              <button
                onClick={() => setSpeed((s) => Math.min(120, s + 6))}
                className="rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-2"
              >
                +
              </button>
            </div>
          )}
          <button
            onClick={() => setScrolling((s) => !s)}
            aria-label={scrolling ? "Pause auto-scroll" : "Start auto-scroll"}
            className={cn(
              "rounded-md border border-border px-2 py-1 hover:bg-surface-2",
              scrolling && "bg-accent text-accent-foreground",
            )}
          >
            {scrolling ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setFont((f) => Math.max(0.9, +(f - 0.15).toFixed(2)))}
            aria-label="Smaller text"
            className="rounded-md border border-border px-2 py-1 hover:bg-surface-2"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={() => setFont((f) => Math.min(3.5, +(f + 0.15).toFixed(2)))}
            aria-label="Larger text"
            className="rounded-md border border-border px-2 py-1 hover:bg-surface-2"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            aria-label="Exit stage view"
            className="rounded-md border border-border px-2 py-1 hover:bg-surface-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <ChordChart source={source} semitones={semitones} fontScale={font} />
        </div>
      </div>
    </div>
  );
}
