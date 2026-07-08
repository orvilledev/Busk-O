"use client";

import { useSyncExternalStore } from "react";
import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CHORD_COLORS,
  DEFAULT_CHORD_COLOR,
  applyChordColor,
  getSavedChordColor,
  subscribeChordColor,
} from "@/lib/chord-color";

/** Three swatches to pick the on-screen chord color. Applies app-wide. */
export function ChordColorPicker({ className }: { className?: string }) {
  // Read the saved color as an external store — SSR uses the default snapshot,
  // so hydration matches, then it switches to the saved value after mount.
  const active = useSyncExternalStore(
    subscribeChordColor,
    getSavedChordColor,
    () => DEFAULT_CHORD_COLOR,
  );

  return (
    <div className={cn("flex items-center gap-1.5", className)} title="Chord color">
      <Palette className="h-4 w-4 text-muted" />
      {CHORD_COLORS.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => applyChordColor(c.id)}
          aria-label={`Chord color: ${c.label}`}
          aria-pressed={active === c.id}
          title={c.label}
          className={cn(
            "h-5 w-5 rounded-full border border-black/20 transition",
            active === c.id &&
              "ring-2 ring-foreground ring-offset-2 ring-offset-surface",
          )}
          style={{ backgroundColor: c.value }}
        />
      ))}
    </div>
  );
}
