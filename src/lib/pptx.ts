import { toLyricSections } from "./chordpro";

/** Minimal song shape needed to build projection slides. */
export interface ExportSong {
  title: string;
  artist: string | null;
  body: string;
  transpose_key: string | null;
  capo: number | null;
  notes: string | null;
}

export interface ExportSetlist {
  name: string;
  eventDate: string | null;
  songs: ExportSong[];
}

const BG = "0A0A0B";
const FG = "FFFFFF";
const ACCENT = "F59E0B";
const MUTED = "9A9AA5";

/** A safe-ish filename from a setlist name. */
function fileName(name: string): string {
  const slug = name.trim().replace(/[^\w-]+/g, "-").replace(/-+/g, "-");
  return `${slug || "setlist"}.pptx`;
}

/**
 * Build and download a PowerPoint of a setlist: a lineup summary slide, then
 * for each song a title slide followed by one lyrics slide per section.
 * pptxgenjs is imported lazily so it never weighs down the initial bundle.
 */
export async function exportSetlistPptx(setlist: ExportSetlist): Promise<void> {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in
  pptx.defineSlideMaster({
    title: "BUSKO_DARK",
    background: { color: BG },
  });

  // --- Lineup summary slide ---
  const lineup = pptx.addSlide({ masterName: "BUSKO_DARK" });
  lineup.addText(setlist.name, {
    x: 0.6,
    y: 0.5,
    w: 12.1,
    h: 0.9,
    fontSize: 34,
    bold: true,
    color: FG,
  });
  if (setlist.eventDate) {
    lineup.addText(setlist.eventDate, {
      x: 0.6,
      y: 1.35,
      w: 12.1,
      h: 0.4,
      fontSize: 16,
      color: MUTED,
    });
  }
  const lines = setlist.songs.map((s, i) => {
    const bits = [`${i + 1}.  ${s.title}`];
    if (s.transpose_key) bits.push(`(${s.transpose_key})`);
    if (s.capo) bits.push(`capo ${s.capo}`);
    if (s.notes) bits.push(`— ${s.notes}`);
    return { text: bits.join("  "), options: { fontSize: 20, color: FG, paraSpaceAfter: 8 } };
  });
  lineup.addText(lines.length ? lines : [{ text: "(no songs)", options: { color: MUTED } }], {
    x: 0.8,
    y: 2,
    w: 11.7,
    h: 5,
    valign: "top",
  });

  // --- Per-song slides ---
  for (const song of setlist.songs) {
    const title = pptx.addSlide({ masterName: "BUSKO_DARK" });
    title.addText(song.title, {
      x: 0.5,
      y: 2.7,
      w: 12.3,
      h: 1.4,
      fontSize: 44,
      bold: true,
      color: FG,
      align: "center",
    });
    if (song.artist) {
      title.addText(song.artist, {
        x: 0.5,
        y: 4.1,
        w: 12.3,
        h: 0.6,
        fontSize: 22,
        color: MUTED,
        align: "center",
      });
    }

    for (const section of toLyricSections(song.body)) {
      const slide = pptx.addSlide({ masterName: "BUSKO_DARK" });
      slide.addText(section.lines.join("\n"), {
        x: 0.5,
        y: 0.5,
        w: 12.3,
        h: 6.5,
        fontSize: 32,
        color: section.isChorus ? ACCENT : FG,
        align: "center",
        valign: "middle",
        lineSpacingMultiple: 1.2,
      });
    }
  }

  await pptx.writeFile({ fileName: fileName(setlist.name) });
}
