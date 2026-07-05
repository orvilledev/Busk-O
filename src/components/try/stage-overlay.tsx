"use client";

import { useRef, useState } from "react";
import { Minus, Pause, Play, Plus, X } from "lucide-react";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { ChordChart } from "@/components/songs/chord-chart";
import { cn } from "@/lib/utils";

/** Single-song fullscreen stage view for the try playground. */
export function StageOverlay({
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
  const [speed, setSpeed] = useState(24);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { scrolling, setScrolling } = useAutoScroll(scrollRef, speed);

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
