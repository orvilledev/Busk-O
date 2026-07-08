"use client";

import { useState } from "react";
import { Maximize2, Music, RotateCcw, Type } from "lucide-react";
import { DEMO_SONGS } from "@/lib/demo-songs";
import { KEYS, transposeKey, type Key } from "@/lib/keys";
import { ChordChart } from "@/components/songs/chord-chart";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";
import { cn } from "@/lib/utils";
import { StageOverlay } from "./stage-overlay";

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

      {/* Chart preview */}
      <div className="min-h-96 overflow-auto rounded-lg border border-border bg-surface p-4">
        <ChordChart source={body} semitones={renderSemitones} fontScale={fontScale} />
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
