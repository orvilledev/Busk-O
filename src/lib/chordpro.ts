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

/** Line number (1-based) a Peggy parse error points at, if any. */
function errorLine(e: unknown): number | null {
  const line = (e as { location?: { start?: { line?: number } } })?.location
    ?.start?.line;
  return typeof line === "number" && line > 0 ? line : null;
}

/**
 * ChordPro directives and chord brackets never span lines, so a line with
 * unbalanced {} or [] can never be valid — it's mid-edit typing.
 */
function isBalancedLine(line: string): boolean {
  return (
    (line.match(/\{/g) ?? []).length === (line.match(/\}/g) ?? []).length &&
    (line.match(/\[/g) ?? []).length === (line.match(/\]/g) ?? []).length
  );
}

/**
 * Parse ChordPro source into a Song AST. Never throws on bad input.
 *
 * The live editor preview re-parses on every keystroke, so the source is
 * routinely mid-edit invalid (an unclosed "{directive" or "[bracket").
 * chordsheetjs' PEG parser throws on those — which used to crash the whole
 * page. Instead we blank structurally invalid lines and retry, so the rest
 * of the chart keeps rendering while the line being typed simply disappears
 * from the preview until it's valid again.
 */
export function parse(source: string): Song {
  try {
    return new ChordProParser().parse(source);
  } catch {
    /* fall through to repair */
  }

  // An unclosed "{" swallows the rest of the document, so the parser reports
  // the error far from the real culprit — blank unbalanced lines up front,
  // then let the error-line loop mop up anything else.
  const lines = source.split("\n").map((l) => (isBalancedLine(l) ? l : ""));
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return new ChordProParser().parse(lines.join("\n"));
    } catch (e) {
      const line = errorLine(e);
      if (line === null || line > lines.length || lines[line - 1] === "") break;
      lines[line - 1] = "";
    }
  }

  // Last resorts: strip ChordPro syntax entirely, then give up to empty.
  try {
    return new ChordProParser().parse(source.replace(/[{}[\]]/g, ""));
  } catch {
    return new ChordProParser().parse("");
  }
}

/**
 * Convert a "chords over lyrics" chart (chords on their own line above the
 * lyric line) into canonical ChordPro. Used by paste- and OCR-import.
 * Returns the input unchanged if it can't be interpreted — never throws.
 */
export function chordsOverWordsToChordPro(source: string): string {
  try {
    const song = new ChordsOverWordsParser().parse(source);
    return new ChordProFormatter().format(song);
  } catch {
    return source;
  }
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

/**
 * Shift [Chord] brackets on one line left or right by `delta` lyric
 * characters without touching the lyric text — for fixing alignment after an
 * import put chords a character or two off. `from`/`to` (character offsets in
 * the raw line) limit the shift to chords whose brackets touch that range, so
 * a partial selection moves only the highlighted chords; omitted, the whole
 * line's chords move. Shifted chords clamp at the line edges; a line where
 * nothing moves returns unchanged.
 */
export function shiftLineChords(
  line: string,
  delta: number,
  from = 0,
  to = line.length,
): string {
  // Split into bare lyric text + chord tokens anchored to lyric positions.
  const chords: { token: string; pos: number; selected: boolean }[] = [];
  let lyric = "";
  let last = 0;
  for (const m of line.matchAll(/\[[^\]]*\]/g)) {
    lyric += line.slice(last, m.index);
    chords.push({
      token: m[0],
      pos: lyric.length,
      selected: m.index < to && m.index + m[0].length > from,
    });
    last = m.index + m[0].length;
  }
  lyric += line.slice(last);

  const placed = chords.map((c) => ({
    token: c.token,
    pos: c.selected
      ? Math.max(0, Math.min(lyric.length, c.pos + delta))
      : c.pos,
  }));
  if (placed.every((p, i) => p.pos === chords[i].pos)) return line;

  // Rebuild in anchor order (stable sort keeps ties in original order, and
  // lets a shifted chord pass an unselected one cleanly).
  placed.sort((a, b) => a.pos - b.pos);
  let out = "";
  let prev = 0;
  for (const p of placed) {
    out += lyric.slice(prev, p.pos) + p.token;
    prev = p.pos;
  }
  return out + lyric.slice(prev);
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
