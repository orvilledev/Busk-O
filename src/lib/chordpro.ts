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

/**
 * Normalize enharmonic equivalents: B# → C, E# → F.
 * These shouldn't appear in well-formed charts, but chordsheetjs may produce
 * them during transposition. We fix them here for music theory accuracy.
 */
function normalizeEnharmonics(chord: string): string {
  return chord
    .replace(/B#/g, "C")
    .replace(/E#/g, "F");
}

/** Transpose a song by a number of semitones (positive up, negative down). */
export function transpose(song: Song, semitones: number): Song {
  if (semitones === 0) return song;
  const transposed = song.transpose(semitones);

  // Fix enharmonic equivalents in chords after transposition
  const source = toChordPro(transposed);
  const normalized = source.replace(/\[([^\]]+)\]/g, (match, chord) => {
    return `[${normalizeEnharmonics(chord)}]`;
  });

  return parse(normalized);
}

const FLAT_TO_SHARP: Record<string, string> = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
};

/**
 * Best guess at a song's key from ChordPro. Prefers a `{key: ...}` directive;
 * otherwise falls back to the root of the first chord (a common, good-enough
 * heuristic for lead sheets). Flats are normalized to the sharp spelling used
 * by the key picker. Returns null if there are no chords. It's a starting
 * point the user can correct, not gospel.
 */
export function detectKey(body: string): string | null {
  const declared = getKey(parse(body));
  if (declared) return declared;
  const first = body.match(/\[([A-G][#b]?)/);
  if (!first) return null;
  return FLAT_TO_SHARP[first[1]] ?? first[1];
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
