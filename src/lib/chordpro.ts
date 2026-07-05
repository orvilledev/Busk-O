import {
  ChordProParser,
  ChordProFormatter,
  ChordsOverWordsParser,
  ChordLyricsPair,
  Song,
} from "chordsheetjs";

/**
 * Thin wrapper around chordsheetjs. ChordPro is Busk-O's canonical storage
 * format; everything here operates on that so the rest of the app never has to
 * touch the library directly.
 *
 * Pure key math lives in ./keys (no chordsheetjs) and is re-exported here for
 * convenience — but bundle-sensitive UI should import it from ./keys directly.
 */
export {
  KEYS,
  type Key,
  semitonesBetween,
  transposeKey,
  capoFret,
} from "./keys";

/** Parse ChordPro source into a Song AST. Never throws on bad input. */
export function parse(source: string): Song {
  return new ChordProParser().parse(source);
}

/**
 * Convert a "chords over lyrics" chart (chords on their own line above the
 * lyric line) into canonical ChordPro. Used by paste- and OCR-import.
 */
export function chordsOverWordsToChordPro(source: string): string {
  const song = new ChordsOverWordsParser().parse(source);
  return new ChordProFormatter().format(song);
}

/** Serialize a Song back to ChordPro (e.g. after transposing for export). */
export function toChordPro(song: Song): string {
  return new ChordProFormatter().format(song);
}

/**
 * The song's key, if declared via a `{key: ...}` directive. Returns the string
 * spelling (e.g. "G", "F#m") or null when the chart has no key metadata.
 */
export function getKey(song: Song): string | null {
  const key = song.currentKey;
  return key ? key.toString() : null;
}

/** Transpose a song by a number of semitones (positive up, negative down). */
export function transpose(song: Song, semitones: number): Song {
  if (semitones === 0) return song;
  return song.transpose(semitones);
}

/** A block of lyrics (one paragraph) with its section role. */
export interface LyricSection {
  isChorus: boolean;
  lines: string[];
}

/**
 * Extract lyrics-only sections (chords stripped) for projection slides.
 * Empty lines and non-lyric directives are dropped.
 */
export function toLyricSections(source: string): LyricSection[] {
  const song = parse(source);
  const sections: LyricSection[] = [];

  for (const paragraph of song.bodyParagraphs) {
    const lines: string[] = [];
    for (const line of paragraph.lines) {
      const text = line.items
        .filter((i): i is ChordLyricsPair => i instanceof ChordLyricsPair)
        .map((p) => p.lyrics ?? "")
        .join("")
        .trim();
      if (text) lines.push(text);
    }
    if (lines.length > 0) {
      sections.push({
        isChorus: paragraph.lines.some((l) => l.isChorus()),
        lines,
      });
    }
  }

  return sections;
}

/** Full lyrics as plain text, blank line between sections. */
export function toPlainLyrics(source: string): string {
  return toLyricSections(source)
    .map((s) => s.lines.join("\n"))
    .join("\n\n");
}
