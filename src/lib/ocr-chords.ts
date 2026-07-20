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
 * Matches a chord token: root, optional accidental, quality, extension,
 * altered tail, and slash bass — e.g. G, Em, E7, FM7, Dm7, Abdim, Cmaj7,
 * G7sus4, Cadd9, Am7b5, D/F#.
 */
const CHORD_RE =
  /^[A-G][#b]?(?:maj|min|dim|aug|sus|add|m|M)?\d{0,2}(?:sus\d{0,2}|add\d{1,2})?(?:[#b]\d{1,2})?(?:\/[A-G][#b]?)?$/;

/** Bar/measure separators that may appear on a chord line. */
const MEASURE_TOKENS = new Set(["|", "%", "||", ":"]);

/** Repeat markers like x2, x3, 4x, (x2) — kept but not treated as chords. */
const REPEAT_RE = /^\(?(?:x\d+|\d+x)\)?$/i;

const SECTION_RE =
  /^\[?\s*(intro|verses?|pre[-\s]?chorus|chorus|bridge|interlude|outro|tag|refrain|solo|ending|coda|instrumental|hook)\b.*?\]?\s*$/i;

export function isChord(token: string): boolean {
  return CHORD_RE.test(token);
}

/**
 * Strip OCR punctuation noise wrapping a token so real chords survive:
 * "«x3" → "x3", "(Cadd9)" → "Cadd9", "|G" → "G". Slash chords (D/F#) and
 * accidentals (C#) are preserved.
 */
export function normalizeToken(t: string): string {
  return t
    .trim()
    .replace(/^[«»"'“”‘’(\[{|]+/, "")
    .replace(/[«»"'“”‘’)\]}|,.:;]+$/, "");
}

/** Dashes and dots used as separators between chords ("Am – G"). */
const SEPARATOR_RE = /^[-–—·.]+$/;

/** A token that belongs on a chord line but isn't itself a chord. */
function isChordLineNoise(t: string): boolean {
  return (
    t === "" || MEASURE_TOKENS.has(t) || REPEAT_RE.test(t) || SEPARATOR_RE.test(t)
  );
}

/**
 * Split a token that OCR merged from adjacent chords ("GF" → G F,
 * "Dm7G7" → Dm7 G7) by greedy longest-match tokenization. Returns null
 * unless the WHOLE token divides into 2+ chords, so lyric words like
 * "Ang" (A + "ng"?) never split.
 */
export function splitMergedChords(t: string): string[] | null {
  if (t.length < 2 || !/^[A-G]/.test(t)) return null;
  const parts: string[] = [];
  let i = 0;
  while (i < t.length) {
    let matched = "";
    for (let j = t.length; j > i; j--) {
      const sub = t.slice(i, j);
      if (isChord(sub)) {
        matched = sub;
        break;
      }
    }
    if (!matched) return null;
    parts.push(matched);
    i += matched.length;
  }
  return parts.length >= 2 ? parts : null;
}

/**
 * OCR guesses letter case from glyph size, so shape-identical letters come
 * back lowercase: "c/B" → C/B, "C/b" → C/B, "cmaj7" → Cmaj7. Recase the root
 * and slash bass, but only for tokens with chord structure (slash, digit, or
 * quality suffix) so lyric words like "am" or "be" never become chords.
 */
function fixChordCase(t: string): string {
  if (!/[/\d]/.test(t) && !/maj|min|dim|aug|sus|add/i.test(t)) return t;
  return t
    .replace(/^[a-g]/, (c) => c.toUpperCase())
    .replace(/\/([a-g])([#b]?)$/, (_, n: string, acc: string) => "/" + n.toUpperCase() + acc);
}

/**
 * Read a token as one or more chords, repairing common OCR damage:
 * - doubled root letter: "Cc" → C
 * - case slips: "c/B" → C/B
 * - merged neighbours: "GF" → G F
 * Returns null when the token isn't chord-like at all.
 */
export function readChords(t: string): string[] | null {
  const recased = fixChordCase(t);
  const candidates = recased === t ? [t] : [t, recased];
  for (const cand of candidates) {
    if (isChord(cand)) return [cand];
    const dedoubled = cand.replace(/^([A-G])\1/i, "$1");
    if (dedoubled !== cand && isChord(dedoubled)) return [dedoubled];
  }
  return splitMergedChords(t) ?? (recased !== t ? splitMergedChords(recased) : null);
}

/**
 * OCR frequently misreads vertical strokes as "1":
 * - Capital "I" as "1": "If" → "1f", "I've" → "1've"
 * - Lowercase "l" as "1": "hello" → "he11o", "like" → "1ike", "blessed" → "b1essed"
 *
 * Fix in *lyric* words only (not chords or numbers):
 * - Capital I: lone "1", uppercase letter after, or apostrophe after
 * - Lowercase l: "1" between lowercase letters, or word-initial "1" + 2+ lowercase letters
 *
 * Replacements are the same length, so chord-over-syllable alignment stays correct.
 */
export function fixLyricOcr(word: string): string {
  // Fix capital I: lone "1" or "1" before uppercase/apostrophe (not lowercase)
  if (/^1[^\w'#/]*$/.test(word)) return "I" + word.slice(1);
  if (/^1[A-Z']/.test(word) && !/^1(?:st|nd|rd|th)\b/i.test(word)) {
    word = "I" + word.slice(1);
  }

  // Contractions: "I'11" / "we'11" → "I'll" / "we'll". Requires a letter
  // before the apostrophe so a bare year like "'11" survives.
  word = word.replace(/([A-Za-z]')11(?=$|[^\d])/g, "$1ll");

  // Fix lowercase l: "1" between letters or word-initial "1" in words with 2+ letters
  // But skip ordinals like "1st", "1nd", "1rd", "1th"
  if (/[a-z]/.test(word) && !/^\d+$/.test(word) && !/^1(?:st|nd|rd|th)\b/i.test(word)) {
    // Replace one or more "1"s between lowercase letters: "he11o" → "hello"
    // Use a loop to handle cases like "ha11e1ujah" where replacements are adjacent
    let prev = "";
    while (prev !== word) {
      prev = word;
      word = word.replace(/([a-z])(1+)([a-z])/g, (m, g1, g2, g3) =>
        g1 + g2.replace(/1/g, "l") + g3
      );
    }
    word = word.replace(/([a-z])1([^a-z0-9]|$)/g, "$1l$2"); // "be1," → "bel,"
    // Word-initial "1" followed by 2+ lowercase letters
    if (/^1[a-z]{2,}/.test(word)) {
      word = "l" + word.slice(1);
    }
  }

  return word;
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
    .map((w) => normalizeToken(w.text))
    .filter((t) => !isChordLineNoise(t));
  if (tokens.length === 0) return "lyric";

  // Fuzzy: real chord lines survive a token or two of OCR damage, while
  // lyric lines (mostly plain words) stay well under the bar. Short lyric
  // fragments like "Am I" (50%) still classify as lyrics.
  const chordish = tokens.filter((t) => readChords(t) !== null).length;
  return chordish / tokens.length >= 0.7 ? "chord" : "lyric";
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
    const wt = fixLyricOcr(w.text); // same length, so coords stay aligned
    const span = Math.max(1, w.x1 - w.x0);
    for (let k = 0; k < wt.length; k++) {
      text += wt[k];
      charX.push(w.x0 + (span * k) / wt.length);
    }
    prevX1 = w.x1;
  }
  return { text, charX };
}

/** Insert chords into the lyric line at the character each sits above. */
function mergeChordLyric(chords: OcrWord[], lyricRow: OcrWord[]): string {
  const { text, charX } = layoutLyric(lyricRow);

  const insertions = chords
    .map((c) => ({ x0: c.x0, list: readChords(normalizeToken(c.text)) }))
    .filter(
      (c): c is { x0: number; list: string[] } => c.list !== null,
    ) // drop bars / repeat markers / noise
    .map(({ x0, list }) => {
      let idx = charX.findIndex((x) => x >= x0);
      if (idx === -1) idx = text.length; // chord past the last character
      return { idx, insert: list.map((ch) => `[${ch}]`).join("") };
    });

  // Apply right-to-left so earlier indices stay valid.
  insertions.sort((a, b) => b.idx - a.idx);
  let out = text;
  for (const { idx, insert } of insertions) {
    out = out.slice(0, idx) + insert + out.slice(idx);
  }
  return out;
}

/** A chord-only line (intro, turnaround, measures) → bracketed chords. */
function chordOnlyLine(row: OcrWord[]): string {
  return row
    .map((w) => {
      const t = normalizeToken(w.text);
      const list = readChords(t);
      if (list) return list.map((ch) => `[${ch}]`).join(" ");
      if (MEASURE_TOKENS.has(t)) return t;
      return t || w.text; // repeat markers / separators kept literally
    })
    .filter(Boolean)
    .join(" ")
    .trim();
}

/**
 * Capitalize the first lyric letter of a line, skipping over any leading
 * [Chord] brackets (chord spelling is case-sensitive and must stay untouched)
 * and any leading punctuation/digits. Lines with no lyric letters (e.g. a
 * bare chord line) are returned unchanged.
 */
export function capitalizeFirstLyricLetter(line: string): string {
  let depth = 0;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === "[") {
      depth++;
      continue;
    }
    if (c === "]") {
      depth--;
      continue;
    }
    if (depth > 0) continue;
    if (/[a-z]/.test(c)) {
      return line.slice(0, i) + c.toUpperCase() + line.slice(i + 1);
    }
    if (/[A-Z]/.test(c)) return line; // already capitalized
  }
  return line;
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
        out.push(capitalizeFirstLyricLetter(mergeChordLyric(rows[i], next)));
        i++; // consume the lyric row
      } else {
        out.push(chordOnlyLine(rows[i]));
      }
      continue;
    }

    // Plain lyric line with no chords above it.
    out.push(
      capitalizeFirstLyricLetter(
        rows[i].map((w) => fixLyricOcr(w.text)).join(" "),
      ),
    );
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Full pipeline: OCR words → ChordPro. */
export function wordsToChordPro(words: OcrWord[]): string {
  return rowsToChordPro(clusterRows(words));
}
