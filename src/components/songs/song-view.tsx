"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Minus,
  Plus,
  Pencil,
  Trash2,
  Type,
  RotateCcw,
} from "lucide-react";
import { KEYS, transposeKey, type Key } from "@/lib/keys";
import { ChordChart } from "./chord-chart";
import { Button } from "@/components/ui/button";
import type { Song } from "@/types/domain";

const isKey = (k: string | null): k is Key =>
  !!k && (KEYS as readonly string[]).includes(k);

export function SongView({
  song,
  deleteAction,
}: {
  song: Song;
  deleteAction: () => Promise<void>;
}) {
  const [semitones, setSemitones] = useState(0);
  const [capo, setCapo] = useState(0);
  const [fontScale, setFontScale] = useState(1);

  // Guitarists read shapes transposed down by the capo; the audience hears the
  // sounding key. When there's no declared key we just show the raw transpose.
  const renderSemitones = semitones - capo;
  const base = isKey(song.original_key) ? song.original_key : null;
  const soundingKey = base ? transposeKey(base, semitones) : null;
  const shapeKey = base ? transposeKey(base, renderSemitones) : null;

  function reset() {
    setSemitones(0);
    setCapo(0);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{song.title}</h1>
          {song.artist && <p className="text-muted">{song.artist}</p>}
          {song.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {song.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/songs/${song.id}/edit`}>
            <Button variant="secondary" size="sm">
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          </Link>
          <form action={deleteAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-danger hover:bg-danger/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-5 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-3 text-sm">
        <Stepper
          label="Transpose"
          value={semitones}
          display={semitones > 0 ? `+${semitones}` : `${semitones}`}
          onDec={() => setSemitones((s) => s - 1)}
          onInc={() => setSemitones((s) => s + 1)}
        />
        <Stepper
          label="Capo"
          value={capo}
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
            onClick={reset}
            className="flex items-center gap-1 text-muted hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        )}
        <div className="ml-auto text-muted">
          {shapeKey ? (
            capo > 0 ? (
              <>
                Capo {capo} · play in{" "}
                <span className="font-semibold text-foreground">{shapeKey}</span>{" "}
                · sounds{" "}
                <span className="font-semibold text-foreground">
                  {soundingKey}
                </span>
              </>
            ) : (
              <>
                Key{" "}
                <span className="font-semibold text-foreground">
                  {soundingKey}
                </span>
              </>
            )
          ) : null}
        </div>
      </div>

      <ChordChart source={song.body} semitones={renderSemitones} fontScale={fontScale} />
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
  value: number;
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
