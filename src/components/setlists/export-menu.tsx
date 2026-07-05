"use client";

import { useState } from "react";
import { Download, FileText, Loader2, Music2, Presentation } from "lucide-react";
import { exportSetlistPptx, type ExportSetlist } from "@/lib/pptx";
import { downloadChordPro, downloadLyricsText } from "@/lib/export-text";
import { Button } from "@/components/ui/button";

export function ExportMenu({ setlist }: { setlist: ExportSetlist }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function withBusy(fn: () => void | Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } catch {
      // Surface nothing intrusive; export is a convenience action.
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  const item =
    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-2";

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        disabled={busy || setlist.songs.length === 0}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Export
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
            <button
              className={item}
              onClick={() => withBusy(() => exportSetlistPptx(setlist))}
            >
              <Presentation className="h-4 w-4 text-accent" />
              PowerPoint (lyric slides)
            </button>
            <button
              className={item}
              onClick={() => withBusy(() => downloadLyricsText(setlist))}
            >
              <FileText className="h-4 w-4 text-muted" />
              Lyrics text (.txt)
            </button>
            <button
              className={item}
              onClick={() => withBusy(() => downloadChordPro(setlist))}
            >
              <Music2 className="h-4 w-4 text-muted" />
              ChordPro (.cho)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
