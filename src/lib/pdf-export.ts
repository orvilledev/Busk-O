import jsPDF from "jspdf";
import { ChordLyricsPair, Comment, Tag } from "chordsheetjs";
import { parse, transpose } from "./chordpro";
import { KEYS, transposeKey, type Key } from "./keys";
import type { Song } from "@/types/domain";

/**
 * Render a song to a clean, premium-looking chord sheet PDF.
 *
 * Chords are positioned directly above the lyric syllable they belong to
 * (measuring real glyph widths so proportional type still aligns). The body
 * flows in two columns — left, then right, then onto a new page — so most
 * songs fit on a single sheet; long ones spill over naturally. Section labels
 * are styled, choruses get an accent rule, and the footer brands the source.
 */

// --- Palette (print-legible on white) ----------------------------------------
const INK: [number, number, number] = [28, 28, 32];
const MUTED: [number, number, number] = [122, 122, 133];
const ACCENT: [number, number, number] = [201, 110, 16]; // amber, dark enough for paper
const RULE: [number, number, number] = [226, 226, 230];

// --- Type sizes (pt) ----------------------------------------------------------
const TITLE = 20;
const ARTIST = 11.5;
const META = 9;
const SECTION = 8.5;
const CHORD = 8;
const LYRIC = 10;
const FOOTER = 8;

// --- Geometry (mm) ------------------------------------------------------------
// Tuned so a typical song fits in two columns on one page; long songs spill.
const MARGIN = 15;
const TOP = 14;
const GUTTER = 8; // space between the two columns
const CHORD_ROW = 3.6;
const LYRIC_ROW = 4.9;
const CHORD_GAP = 1.4; // min breathing room after a chord
const SECTION_BEFORE = 3.2;
const SECTION_AFTER = 1.1;
const PARA_GAP = 2.4;
const CHORUS_INDENT = 4;

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
  const rightEdge = MARGIN + contentW;
  const pageBottom = pageH - 15; // leave room for footer
  const colWidth = (contentW - GUTTER) / 2;

  // Mutable render cursor. `col` is the active column (0 = left, 1 = right);
  // `pageTop` is where columns begin on the current page (below the header on
  // page 1, at TOP thereafter).
  const st = { y: TOP, col: 0, pageTop: TOP, chorus: false };

  const setColor = (c: [number, number, number]) =>
    pdf.setTextColor(c[0], c[1], c[2]);
  const setDraw = (c: [number, number, number]) =>
    pdf.setDrawColor(c[0], c[1], c[2]);

  // Column geometry for the current cursor.
  const colBaseX = (col = st.col) => MARGIN + col * (colWidth + GUTTER);
  const leftX = () => colBaseX() + (st.chorus ? CHORUS_INDENT : 0);
  const rightX = () => colBaseX() + colWidth;

  const measure = (text: string, size: number, bold: boolean) => {
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    return pdf.getTextWidth(text);
  };

  // Move to the next column, or the next page's left column when the right
  // column is full. This is the single place flow crosses a boundary.
  const advanceFlow = () => {
    if (st.col === 0) {
      st.col = 1;
      st.y = st.pageTop;
    } else {
      pdf.addPage();
      st.pageTop = TOP;
      st.col = 0;
      st.y = TOP;
    }
  };

  const ensure = (needed: number) => {
    if (st.y + needed > pageBottom) advanceFlow();
  };

  // --- Header (spans full width on page 1) ----------------------------------
  const drawHeader = () => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(TITLE);
    setColor(INK);
    const titleLines = pdf.splitTextToSize(song.title || "Untitled", contentW);
    for (const line of titleLines) {
      pdf.text(line, MARGIN, st.y + 7.2);
      st.y += 8.2;
    }

    if (song.artist) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(ARTIST);
      setColor(MUTED);
      pdf.text(song.artist, MARGIN, st.y + 4);
      st.y += 6.4;
    }

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
    setDraw(RULE);
    pdf.setLineWidth(0.4);
    pdf.line(MARGIN, st.y, rightEdge, st.y);
    setDraw(ACCENT);
    pdf.setLineWidth(1.3);
    pdf.line(MARGIN, st.y, MARGIN + 26, st.y);
    st.y += 6;

    // Columns start below the header on this page.
    st.pageTop = st.y;
    st.col = 0;
  };

  // --- Section label --------------------------------------------------------
  const drawSection = (label: string) => {
    ensure(SECTION_BEFORE + 5.4 + LYRIC_ROW);
    st.y += SECTION_BEFORE;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(SECTION);
    setColor(ACCENT);
    pdf.text(label.toUpperCase(), leftX(), st.y + 3.0, { charSpace: 0.4 });
    st.y += 5.0 + SECTION_AFTER;
  };

  // --- Chord-over-lyric line ------------------------------------------------
  const drawLyricLine = (
    segs: { chord: string; lyric: string }[],
    hasChords: boolean,
  ) => {
    const rowH = (hasChords ? CHORD_ROW : 0) + LYRIC_ROW;
    ensure(rowH);
    let top = st.y;
    let x = leftX();

    const chordBase = () => top + 3.0;
    const lyricBase = () => top + (hasChords ? CHORD_ROW : 0) + 4.0;

    for (const s of segs) {
      const lw = measure(s.lyric, LYRIC, false);
      const cw = hasChords && s.chord ? measure(s.chord, CHORD, true) + CHORD_GAP : 0;
      const adv = Math.max(lw, cw);

      // Wrap to a fresh chord+lyric row when we'd overflow the text column.
      if (x + adv > rightX() && x > leftX()) {
        top += rowH;
        if (top + rowH > pageBottom) {
          advanceFlow();
          top = st.y;
        }
        x = leftX();
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

    const rowH = CHORD_ROW + 3.0;
    ensure(rowH);
    let top = st.y;
    let x = leftX();
    const base = () => top + 3.6;
    const wrapIfNeeded = (w: number) => {
      if (x + w > rightX() && x > leftX()) {
        top += rowH;
        if (top + rowH > pageBottom) {
          advanceFlow();
          top = st.y;
        }
        x = leftX();
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
    st.chorus = para.lines.some((l) => l.isChorus());
    const startPage = pdf.getCurrentPageInfo().pageNumber;
    const startCol = st.col;
    const startY = st.y;

    for (const line of para.lines) renderLine(line);

    // Accent rule beside a chorus — only when it stayed in one column.
    if (
      st.chorus &&
      pdf.getCurrentPageInfo().pageNumber === startPage &&
      st.col === startCol
    ) {
      const bx = colBaseX(startCol);
      setDraw(ACCENT);
      pdf.setLineWidth(1.0);
      pdf.line(bx + 1.2, startY - 0.5, bx + 1.2, st.y - 2.2);
    }

    st.chorus = false;
    if (pi < paragraphs.length - 1) st.y += PARA_GAP;
  });

  // --- Footer on every page -------------------------------------------------
  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    const fy = pageH - 9;
    setDraw(RULE);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN, fy - 4.5, rightEdge, fy - 4.5);

    pdf.setFontSize(FOOTER);
    pdf.setFont("helvetica", "bold");
    setColor(ACCENT);
    pdf.text("Busk-O", MARGIN, fy);

    pdf.setFont("helvetica", "normal");
    setColor(MUTED);
    pdf.text("Chords, lyrics & setlists for the stage", pageW / 2, fy, {
      align: "center",
    });
    pdf.text(`${i} / ${total}`, rightEdge, fy, { align: "right" });
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
