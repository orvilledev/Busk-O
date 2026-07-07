"use client";

import { useMemo } from "react";
import { ChordLyricsPair, Comment, Tag, type Line } from "chordsheetjs";
import { parse, transpose } from "@/lib/chordpro";
import { cn } from "@/lib/utils";

interface ChordChartProps {
  /** ChordPro source. */
  source: string;
  /** Semitones to transpose by (default 0). */
  semitones?: number;
  /** Font scale multiplier for stage readability (default 1). */
  fontScale?: number;
  className?: string;
}

/** Renders a ChordPro song as chords stacked above lyrics. */
export function ChordChart({
  source,
  semitones = 0,
  fontScale = 1,
  className,
}: ChordChartProps) {
  const paragraphs = useMemo(() => {
    const song = transpose(parse(source), semitones);
    return song.bodyParagraphs;
  }, [source, semitones]);

  return (
    <div
      className={cn("flex flex-col gap-3 leading-relaxed text-sm sm:gap-4 sm:text-base", className)}
      style={{ fontSize: `${fontScale}rem` }}
    >
      {paragraphs.map((paragraph, pi) => {
        const isChorus = paragraph.lines.some((l) => l.isChorus());
        let currentSection = "";
        return (
          <div
            key={pi}
            className={cn(
              isChorus && "border-l-2 border-accent/60 pl-3",
            )}
          >
            {paragraph.lines.map((line, li) => {
              // Track current section from comments
              const comment = line.items.find(
                (i): i is Comment | Tag =>
                  i instanceof Comment || (i instanceof Tag && i.isComment()),
              );
              if (comment) {
                const text = comment instanceof Comment ? comment.content : comment.value;
                currentSection = text.toLowerCase();
              }
              return (
                <ChartLine
                  key={li}
                  line={line}
                  section={currentSection}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function ChartLine({ line, section = "" }: { line: Line; section?: string }) {
  // Section label from a {start_of_*: label="..."} tag, if any.
  const label = line.items.find(
    (i): i is Tag => i instanceof Tag && i.isSectionStart() && i.hasLabel(),
  );
  if (label) {
    return (
      <div className="mb-1 text-[0.8em] font-semibold uppercase tracking-wide text-muted">
        {label.label}
      </div>
    );
  }

  const pairs = line.items.filter(
    (i): i is ChordLyricsPair => i instanceof ChordLyricsPair,
  );
  const hasChords = pairs.some((p) => p.chords);
  // Repeat markers (x2), bars (|), and dash/dot separators are chart notation,
  // not lyrics — they must not disqualify a line from chord-only rendering.
  const REPEAT_RE = /^\(?(?:x\d+|\d+x)\)?$/i;
  const NOTATION_RE = /^(?:[|%:]+|[·._\s–—-]+)$/;
  const hasLyrics = pairs.some((p) => {
    const l = (p.lyrics ?? "").trim();
    return l !== "" && !REPEAT_RE.test(l) && !NOTATION_RE.test(l);
  });

  // Standalone comment line ({comment: ...}) — how OCR imports mark sections
  // (Intro, Verse, Chorus…). Note: hasRenderableItems() counts the tag itself
  // in this chordsheetjs version, so check for real chord/lyric content.
  const comment = line.items.find(
    (i): i is Comment | Tag =>
      i instanceof Comment || (i instanceof Tag && i.isComment()),
  );
  if (comment && !hasChords && !hasLyrics) {
    const text = comment instanceof Comment ? comment.content : comment.value;
    return (
      <div className="mb-1 mt-2 text-[0.8em] font-semibold uppercase tracking-wide text-muted">
        {text}
      </div>
    );
  }

  if (pairs.length === 0) return null;

  // Chord-only line (intro/interlude/instrumental/turnaround): render as a
  // single flat row — chords joined by dashes, bars kept, repeat markers at
  // the end. Markers and separators can land in either the chords or lyrics
  // slot depending on how the ChordPro parsed, so scan both.
  if (hasChords && !hasLyrics) {
    const tokens: { text: string; kind: "chord" | "bar" }[] = [];
    const markers: string[] = [];
    for (const p of pairs) {
      for (const t of [(p.chords ?? "").trim(), (p.lyrics ?? "").trim()]) {
        if (!t) continue;
        if (REPEAT_RE.test(t)) markers.push(t);
        else if (/^[|%:]+$/.test(t)) tokens.push({ text: t, kind: "bar" });
        else if (NOTATION_RE.test(t)) continue; // literal dashes — we draw our own
        else tokens.push({ text: t, kind: "chord" });
      }
    }
    return (
      <div className="flex min-h-5 flex-wrap items-center gap-1">
        {tokens.map((t, i) => (
          <span key={i} className="flex items-center gap-1">
            <span
              className={
                t.kind === "chord"
                  ? "font-mono text-[0.85em] font-semibold text-chord"
                  : "text-[0.85em] text-muted"
              }
            >
              {t.text}
            </span>
            {t.kind === "chord" && tokens[i + 1]?.kind === "chord" && (
              <span className="text-[0.85em] text-muted">-</span>
            )}
          </span>
        ))}
        {markers.map((m, i) => (
          <span key={`m${i}`} className="ml-1 text-[0.85em] text-muted">
            {m}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-0.5 flex-wrap">
      {pairs.map((pair, i) => {
        // Skip rendering lyrics that are just dashes/underscores/spaces (OCR
        // artifacts from lines under chords in the image).
        const lyricsContent = pair.lyrics ?? "";
        const isDashOnly = /^[\s_–—-]*$/.test(lyricsContent) && lyricsContent.trim() !== "";

        return (
          <span key={i} className="flex flex-col">
            <span className="flex items-center gap-0.5 min-h-5">
              {hasChords && (
                <span className="font-mono text-[0.85em] font-semibold text-chord">
                  {pair.chords || " "}
                </span>
              )}
            </span>
            {!isDashOnly && (
              <span className="whitespace-pre-wrap break-words">
                {lyricsContent || " "}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
