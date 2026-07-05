/**
 * Turn OCR word boxes from a chords-over-lyrics chart into ChordPro.
 *
 * Tesseract reads the characters fine; the hard part is that it flattens the
 * page's 2D layout, losing which chord sits above which syllable. We keep the
 * word bounding boxes, re-cluster them into visual rows, decide whether each
 * row is chords / lyrics / a section header, and align chords to the lyric
 * character directly beneath them. Everything here is pure and unit-tested.
 */

export interface OcrWord {
  text: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * Matches a chord token: root, optional accidental, quality, extension, and
 * slash bass — e.g. G, Em, D/F#, Cadd9, Dadd4, Am7, Cmaj7, Dsus4.
 */
const CHORD_RE =
  /^[A-G][#b]?(?:maj|min|m|dim|aug|sus|add|M)?\d{0,2}(?:sus\d?)?(?:add\d{1,2})?(?:\/[A-G][#b]?)?$/;

/** Tokens that may appear on a chord line without disqualifying it. */
const MEASURE_TOKENS = new Set(["|", "%", "||", ":", "x2", "x3", "x4"]);

const SECTION_RE =
  /^\[?\s*(intro|verses?|pre[-\s]?chorus|chorus|bridge|interlude|outro|tag|refrain|solo|ending|coda|instrumental|hook)\b.*?\]?\s*$/i;

export function isChord(token: string): boolean {
  return CHORD_RE.test(token);
}

/** Median of a numeric list (0 for empty). */
function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * Cluster words into visual rows by vertical position. Words whose vertical
 * center is within ~60% of the median line height are treated as one row.
 */
export function clusterRows(words: OcrWord[]): OcrWord[][] {
  if (words.length === 0) return [];
  const heights = words.map((w) => w.y1 - w.y0);
  const tol = Math.max(6, median(heights) * 0.6);

  const byY = [...words].sort(
    (a, b) => (a.y0 + a.y1) / 2 - (b.y0 + b.y1) / 2,
  );

  const rows: OcrWord[][] = [];
  let current: OcrWord[] = [];
  let rowCenter = 0;

  for (const w of byY) {
    const yc = (w.y0 + w.y1) / 2;
    if (current.length === 0 || Math.abs(yc - rowCenter) <= tol) {
      current.push(w);
      // Running average keeps the anchor stable as words are added.
      rowCenter =
        current.reduce((sum, x) => sum + (x.y0 + x.y1) / 2, 0) / current.length;
    } else {
      rows.push(current);
      current = [w];
      rowCenter = yc;
    }
  }
  if (current.length) rows.push(current);

  // Left-to-right within each row.
  for (const row of rows) row.sort((a, b) => a.x0 - b.x0);
  return rows;
}

type RowKind = "section" | "chord" | "lyric";

function classifyRow(row: OcrWord[]): RowKind {
  const text = row.map((w) => w.text).join(" ").trim();
  if (SECTION_RE.test(text)) return "section";

  const tokens = row
    .map((w) => w.text)
    .filter((t) => t && !MEASURE_TOKENS.has(t));
  if (tokens.length > 0 && tokens.every(isChord)) return "chord";
  return "lyric";
}

/** Build a lyric string plus a per-character x-coordinate map. */
function layoutLyric(row: OcrWord[]): { text: string; charX: number[] } {
  let text = "";
  const charX: number[] = [];
  let prevX1 = 0;
  for (const w of row) {
    if (text.length > 0) {
      text += " ";
      // Anchor the gap to the END of the previous word so a chord at the next
      // word's left edge aligns to its first letter, not the space.
      charX.push(prevX1);
    }
    const span = Math.max(1, w.x1 - w.x0);
    for (let k = 0; k < w.text.length; k++) {
      text += w.text[k];
      charX.push(w.x0 + (span * k) / w.text.length);
    }
    prevX1 = w.x1;
  }
  return { text, charX };
}

/** Insert chords into the lyric line at the character each sits above. */
function mergeChordLyric(chords: OcrWord[], lyricRow: OcrWord[]): string {
  const { text, charX } = layoutLyric(lyricRow);

  const insertions = chords.map((c) => {
    let idx = charX.findIndex((x) => x >= c.x0);
    if (idx === -1) idx = text.length; // chord past the last character
    return { idx, chord: c.text };
  });

  // Apply right-to-left so earlier indices stay valid.
  insertions.sort((a, b) => b.idx - a.idx);
  let out = text;
  for (const { idx, chord } of insertions) {
    out = out.slice(0, idx) + `[${chord}]` + out.slice(idx);
  }
  return out;
}

/** A chord-only line (intro, turnaround, measures) → bracketed chords. */
function chordOnlyLine(row: OcrWord[]): string {
  return row
    .map((w) => (MEASURE_TOKENS.has(w.text) ? w.text : `[${w.text}]`))
    .join(" ");
}

function sectionLabel(row: OcrWord[]): string {
  return row
    .map((w) => w.text)
    .join(" ")
    .replace(/[[\]]/g, "")
    .trim();
}

/** Convert clustered rows into ChordPro text. */
export function rowsToChordPro(rows: OcrWord[][]): string {
  const out: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const kind = classifyRow(rows[i]);

    if (kind === "section") {
      if (out.length && out[out.length - 1] !== "") out.push("");
      out.push(`{comment: ${sectionLabel(rows[i])}}`);
      continue;
    }

    if (kind === "chord") {
      const next = rows[i + 1];
      if (next && classifyRow(next) === "lyric") {
        out.push(mergeChordLyric(rows[i], next));
        i++; // consume the lyric row
      } else {
        out.push(chordOnlyLine(rows[i]));
      }
      continue;
    }

    // Plain lyric line with no chords above it.
    out.push(rows[i].map((w) => w.text).join(" "));
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Full pipeline: OCR words → ChordPro. */
export function wordsToChordPro(words: OcrWord[]): string {
  return rowsToChordPro(clusterRows(words));
}
