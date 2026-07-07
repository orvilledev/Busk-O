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
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
        {label.label}
      </div>
    );
  }

  const pairs = line.items.filter(
    (i): i is ChordLyricsPair => i instanceof ChordLyricsPair,
  );
  const hasChords = pairs.some((p) => p.chords);
  // Treat repeat markers as noise, not as lyrics
  const hasLyrics = pairs.some(
    (p) =>
      (p.lyrics ?? "").trim() &&
      !/^\(?(?:x\d+|\d+x)\)?$/i.test((p.lyrics ?? "").trim()),
  );

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
      <div className="mb-1 mt-2 text-xs font-semibold uppercase tracking-wide text-muted">
        {text}
      </div>
    );
  }

  if (pairs.length === 0) return null;

  const showDashSeparators = hasChords && !hasLyrics;

  // Find repeat marker index if present
  const repeatMarkerIndex = pairs.findIndex(
    (p) => /^\(?(?:x\d+|\d+x)\)?$/i.test((p.chords ?? "").trim()),
  );

  return (
    <div className="flex items-start gap-0.5 flex-wrap">
      {pairs.map((pair, i) => {
        // Skip rendering lyrics that are just dashes/underscores/spaces (OCR
        // artifacts from lines under chords in the image).
        const lyricsContent = pair.lyrics ?? "";
        const isDashOnly = /^[\s_–—-]*$/.test(lyricsContent) && lyricsContent.trim() !== "";
        const chordText = (pair.chords ?? "").trim();
        const isRepeatMarker = /^\(?(?:x\d+|\d+x)\)?$/i.test(chordText);

        // Skip rendering repeat marker as a separate item
        if (isRepeatMarker) return null;

        const isLastChord = i === pairs.length - 1 || i === repeatMarkerIndex - 1;

        // Don't show dashes before repeat markers
        const shouldShowDash = showDashSeparators && !isLastChord;

        return (
          <span key={i} className="flex flex-col">
            <span className="flex items-center gap-0.5 min-h-5">
              {hasChords && (
                <span className="font-mono text-xs font-semibold text-chord sm:text-sm">
                  {pair.chords || " "}
                </span>
              )}
              {shouldShowDash && (
                <span className="text-muted text-xs sm:text-sm">-</span>
              )}
              {isLastChord && repeatMarkerIndex >= 0 && (
                <span className="text-xs sm:text-sm text-muted ml-1">
                  {pairs[repeatMarkerIndex].chords}
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
