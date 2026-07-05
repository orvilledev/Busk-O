import { toPlainLyrics } from "./chordpro";
import type { ExportSetlist } from "./pptx";

/** Trigger a browser download of a text blob. */
export function downloadText(fileName: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function slug(name: string) {
  return name.trim().replace(/[^\w-]+/g, "-").replace(/-+/g, "-") || "setlist";
}

/** Lyrics-only text of a whole setlist, for sharing with the band. */
export function setlistToLyricsText(setlist: ExportSetlist): string {
  const parts = setlist.songs.map((s, i) => {
    const header = `${i + 1}. ${s.title}${s.artist ? ` — ${s.artist}` : ""}`;
    return `${header}\n${"=".repeat(header.length)}\n${toPlainLyrics(s.body)}`;
  });
  return `${setlist.name}\n\n${parts.join("\n\n\n")}\n`;
}

/** Raw ChordPro of a whole setlist (chords preserved). */
export function setlistToChordPro(setlist: ExportSetlist): string {
  const parts = setlist.songs.map((s) => {
    const meta = [`{title: ${s.title}}`];
    if (s.artist) meta.push(`{artist: ${s.artist}}`);
    if (s.transpose_key) meta.push(`{key: ${s.transpose_key}}`);
    if (s.capo) meta.push(`{capo: ${s.capo}}`);
    return `${meta.join("\n")}\n${s.body}`;
  });
  return parts.join("\n\n{new_song}\n\n");
}

export function downloadLyricsText(setlist: ExportSetlist) {
  downloadText(`${slug(setlist.name)}-lyrics.txt`, setlistToLyricsText(setlist));
}

export function downloadChordPro(setlist: ExportSetlist) {
  downloadText(`${slug(setlist.name)}.cho`, setlistToChordPro(setlist));
}
