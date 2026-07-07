import jsPDF from "jspdf";
import { ChordLyricsPair, Comment, Tag } from "chordsheetjs";
import { parse, transpose } from "./chordpro";
import { KEYS, transposeKey, type Key } from "./keys";
import type { Song } from "@/types/domain";

/**
 * Render a song to a clean, premium-looking chord sheet PDF.
 *
 * Unlike a naive dump of the ChordPro source, this positions each chord
 * directly above the lyric syllable it belongs to (measuring real glyph
 * widths so proportional type still aligns), styles section labels, marks
 * choruses with an accent rule, and brands the footer as the source.
 */

// --- Palette (print-legible on white) ----------------------------------------
const INK: [number, number, number] = [28, 28, 32];
const MUTED: [number, number, number] = [122, 122, 133];
const ACCENT: [number, number, number] = [201, 110, 16]; // amber, dark enough for paper
const RULE: [number, number, number] = [226, 226, 230];

// --- Type sizes (pt) ----------------------------------------------------------
const TITLE = 22;
const ARTIST = 12.5;
const META = 9.5;
const SECTION = 9.5;
const CHORD = 9;
const LYRIC = 11;
const FOOTER = 8;

// --- Geometry (mm) ------------------------------------------------------------
const MARGIN = 18;
const TOP = 18;
const CHORD_ROW = 4.4;
const LYRIC_ROW = 5.9;
const CHORD_GAP = 1.6; // min breathing room after a chord
const SECTION_BEFORE = 4.5;
const SECTION_AFTER = 1.6;
const PARA_GAP = 3.4;
const CHORUS_INDENT = 5;

const REPEAT_RE = /^\(?(?:x\d+|\d+x)\)?$/i;
const NOTATION_RE = /^(?:[|%:]+|[·._\s–—-]+)$/;
const BAR_RE = /^[|%:]+$/;

const isKey = (k: string | null): k is Key =>
  !!k && (KEYS as readonly string[]).includes(k);

interface PdfOptions {
  /** Semitones the on-screen view is transposed by. */
  semitones?: number;
  /** Capo fret from the on-screen view. */
  capo?: number;
}

export function generateSongPdf(song: Song, opts: PdfOptions = {}): jsPDF {
  const semitones = opts.semitones ?? 0;
  const capo = opts.capo ?? 0;
  // Chords are drawn in the shape the player fingers (down by the capo),
  // exactly as the app renders them on screen.
  const shapeSemitones = semitones - capo;

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const contentW = pageW - MARGIN * 2;
  const rightX = MARGIN + contentW;
  const pageBottom = pageH - 16; // leave room for footer

  // Mutable render cursor.
  const st = { y: TOP, left: MARGIN };

  const setColor = (c: [number, number, number]) =>
    pdf.setTextColor(c[0], c[1], c[2]);
  const setDraw = (c: [number, number, number]) =>
    pdf.setDrawColor(c[0], c[1], c[2]);

  const measure = (text: string, size: number, bold: boolean) => {
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    return pdf.getTextWidth(text);
  };

  const newPage = () => {
    pdf.addPage();
    st.y = TOP;
  };

  const ensure = (needed: number) => {
    if (st.y + needed > pageBottom) newPage();
  };

  // --- Header ---------------------------------------------------------------
  const drawHeader = () => {
    // Title (wraps if long).
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(TITLE);
    setColor(INK);
    const titleLines = pdf.splitTextToSize(song.title || "Untitled", contentW);
    for (const line of titleLines) {
      pdf.text(line, MARGIN, st.y + 7.5);
      st.y += 8.6;
    }

    // Artist.
    if (song.artist) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(ARTIST);
      setColor(MUTED);
      pdf.text(song.artist, MARGIN, st.y + 4);
      st.y += 6.6;
    }

    // Meta row: key · capo · tempo · time.
    const base = isKey(song.original_key) ? song.original_key : null;
    const soundingKey = base ? transposeKey(base, semitones) : null;
    const shapeKey = base ? transposeKey(base, shapeSemitones) : null;
    const meta: string[] = [];
    if (soundingKey) meta.push(`Key ${soundingKey}`);
    if (capo > 0) meta.push(`Capo ${capo}${shapeKey ? ` · play ${shapeKey}` : ""}`);
    if (song.tempo) meta.push(`${song.tempo} BPM`);
    if (song.time_signature) meta.push(song.time_signature);
    if (meta.length) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(META);
      setColor(MUTED);
      pdf.text(meta.join("     •     "), MARGIN, st.y + 3.5);
      st.y += 6;
    }

    st.y += 1.5;
    // Rule: full-width hairline with a short amber accent overlay.
    setDraw(RULE);
    pdf.setLineWidth(0.4);
    pdf.line(MARGIN, st.y, rightX, st.y);
    setDraw(ACCENT);
    pdf.setLineWidth(1.3);
    pdf.line(MARGIN, st.y, MARGIN + 26, st.y);
    st.y += 6.5;
  };

  // --- Section label --------------------------------------------------------
  const drawSection = (label: string) => {
    ensure(SECTION_BEFORE + 6 + LYRIC_ROW);
    st.y += SECTION_BEFORE;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(SECTION);
    setColor(ACCENT);
    pdf.text(label.toUpperCase(), st.left, st.y + 3.2, { charSpace: 0.45 });
    st.y += 5.4 + SECTION_AFTER;
  };

  // --- Chord-over-lyric line ------------------------------------------------
  const drawLyricLine = (
    segs: { chord: string; lyric: string }[],
    hasChords: boolean,
  ) => {
    const rowH = (hasChords ? CHORD_ROW : 0) + LYRIC_ROW;
    ensure(rowH);
    let top = st.y;
    let x = st.left;

    const chordBase = () => top + 3.3;
    const lyricBase = () => top + (hasChords ? CHORD_ROW : 0) + 4.3;

    for (const s of segs) {
      const lw = measure(s.lyric, LYRIC, false);
      const cw = hasChords && s.chord ? measure(s.chord, CHORD, true) + CHORD_GAP : 0;
      const adv = Math.max(lw, cw);

      // Wrap to a fresh chord+lyric row when we'd overflow the text column.
      if (x + adv > rightX && x > st.left) {
        top += rowH;
        if (top + rowH > pageBottom) {
          pdf.addPage();
          top = TOP;
        }
        x = st.left;
      }

      if (hasChords && s.chord) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(CHORD);
        setColor(ACCENT);
        pdf.text(s.chord, x, chordBase());
      }
      if (s.lyric) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(LYRIC);
        setColor(INK);
        pdf.text(s.lyric, x, lyricBase());
      }
      x += adv;
    }

    st.y = top + rowH;
  };

  // --- Chord-only line (intro / interlude / turnaround) ---------------------
  const drawChordOnly = (pairs: ChordLyricsPair[]) => {
    const tokens: { text: string; kind: "chord" | "bar" }[] = [];
    const markers: string[] = [];
    for (const p of pairs) {
      for (const t of [(p.chords ?? "").trim(), (p.lyrics ?? "").trim()]) {
        if (!t) continue;
        if (REPEAT_RE.test(t)) markers.push(t);
        else if (BAR_RE.test(t)) tokens.push({ text: t, kind: "bar" });
        else if (NOTATION_RE.test(t)) continue;
        else tokens.push({ text: t, kind: "chord" });
      }
    }
    if (tokens.length === 0 && markers.length === 0) return;

    const rowH = CHORD_ROW + 3.2;
    ensure(rowH);
    let top = st.y;
    let x = st.left;
    const base = () => top + 4;
    const wrapIfNeeded = (w: number) => {
      if (x + w > rightX && x > st.left) {
        top += rowH;
        if (top + rowH > pageBottom) {
          pdf.addPage();
          top = TOP;
        }
        x = st.left;
      }
    };

    let prevKind: "chord" | "bar" | null = null;
    for (const tok of tokens) {
      if (prevKind === "chord" && tok.kind === "chord") {
        const dash = " - ";
        const dw = measure(dash, CHORD, false);
        wrapIfNeeded(dw);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(CHORD);
        setColor(MUTED);
        pdf.text(dash, x, base());
        x += dw;
      } else if (prevKind !== null) {
        x += measure(" ", CHORD, false) * 2;
      }
      const bold = tok.kind === "chord";
      const w = measure(tok.text, CHORD, bold);
      wrapIfNeeded(w);
      pdf.setFont("helvetica", bold ? "bold" : "normal");
      pdf.setFontSize(CHORD);
      setColor(bold ? ACCENT : MUTED);
      pdf.text(tok.text, x, base());
      x += w;
      prevKind = tok.kind;
    }

    for (const m of markers) {
      const gap = measure("  ", CHORD, false);
      const w = measure(m, CHORD, false);
      wrapIfNeeded(gap + w);
      x += gap;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(CHORD);
      setColor(MUTED);
      pdf.text(m, x, base());
      x += w;
    }

    st.y = top + rowH;
  };

  // --- One parsed line ------------------------------------------------------
  const renderLine = (line: import("chordsheetjs").Line) => {
    const labelTag = line.items.find(
      (i): i is Tag => i instanceof Tag && i.isSectionStart() && i.hasLabel(),
    );
    if (labelTag) {
      drawSection(labelTag.label);
      return;
    }

    const pairs = line.items.filter(
      (i): i is ChordLyricsPair => i instanceof ChordLyricsPair,
    );
    const hasChords = pairs.some((p) => p.chords);
    const hasLyrics = pairs.some((p) => {
      const l = (p.lyrics ?? "").trim();
      return l !== "" && !REPEAT_RE.test(l) && !NOTATION_RE.test(l);
    });

    const comment = line.items.find(
      (i): i is Comment | Tag =>
        i instanceof Comment || (i instanceof Tag && i.isComment()),
    );
    if (comment && !hasChords && !hasLyrics) {
      const text = comment instanceof Comment ? comment.content : comment.value;
      drawSection(text);
      return;
    }

    if (pairs.length === 0) return;

    if (hasChords && !hasLyrics) {
      drawChordOnly(pairs);
      return;
    }

    const segs = pairs.map((p) => ({
      chord: (p.chords ?? "").trim(),
      lyric: p.lyrics ?? "",
    }));
    drawLyricLine(segs, hasChords);
  };

  // --- Body -----------------------------------------------------------------
  drawHeader();

  const parsed = transpose(parse(song.body), shapeSemitones);
  const paragraphs = parsed.bodyParagraphs;
  paragraphs.forEach((para, pi) => {
    const isChorus = para.lines.some((l) => l.isChorus());
    st.left = isChorus ? MARGIN + CHORUS_INDENT : MARGIN;
    const startPage = pdf.getCurrentPageInfo().pageNumber;
    const startY = st.y;

    for (const line of para.lines) renderLine(line);

    // Accent rule down the side of a chorus (only when it didn't page-break).
    if (isChorus && pdf.getCurrentPageInfo().pageNumber === startPage) {
      setDraw(ACCENT);
      pdf.setLineWidth(1.1);
      pdf.line(MARGIN + 1.5, startY - 1, MARGIN + 1.5, st.y - 2.5);
    }

    st.left = MARGIN;
    if (pi < paragraphs.length - 1) st.y += PARA_GAP;
  });

  // --- Footer on every page -------------------------------------------------
  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    const fy = pageH - 10;
    setDraw(RULE);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN, fy - 4.5, rightX, fy - 4.5);

    pdf.setFontSize(FOOTER);
    pdf.setFont("helvetica", "bold");
    setColor(ACCENT);
    pdf.text("Busk-O", MARGIN, fy);

    pdf.setFont("helvetica", "normal");
    setColor(MUTED);
    pdf.text("Chords, lyrics & setlists for the stage", pageW / 2, fy, {
      align: "center",
    });
    pdf.text(`${i} / ${total}`, rightX, fy, { align: "right" });
  }

  return pdf;
}

/** A filesystem-safe filename from the song title. */
function fileName(song: Song): string {
  const slug = (song.title || "song")
    .trim()
    .replace(/[^\w-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `${slug || "song"}.pdf`;
}

/** Generate and download a song as a PDF. */
export function downloadSongPdf(song: Song, opts: PdfOptions = {}) {
  generateSongPdf(song, opts).save(fileName(song));
}
