"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardPaste, ImagePlus, Loader2 } from "lucide-react";
import { detectKey } from "@/lib/chordpro";
import { imageToChordPro, imageFromClipboard } from "@/lib/ocr-run";
import { SongEditor } from "@/components/songs/song-editor";
import { cn } from "@/lib/utils";
import { createSong } from "@/app/(app)/songs/actions";

type Status = "idle" | "recognizing" | "ready";

export function OcrImport() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [body, setBody] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const recognize = useCallback(async (file: File) => {
    setStatus("recognizing");
    setProgress(0);
    try {
      // Result lands in the editor below for review — never saved blind.
      setBody(await imageToChordPro(file, setProgress));
    } finally {
      setStatus("ready");
    }
  }, []);

  /** Accept an image from the file picker, a drop, or a paste. */
  const ingest = useCallback(
    (file: File | null | undefined) => {
      if (!file) return;
      setImageUrl(URL.createObjectURL(file));
      setStatus("idle");
      setBody("");
      recognize(file);
    },
    [recognize],
  );

  // Paste a screenshot anywhere on the page — unless a field is focused, in
  // which case that field's own paste handler takes it.
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const el = document.activeElement?.tagName;
      if (el === "TEXTAREA" || el === "INPUT") return;
      const image = imageFromClipboard(e.clipboardData?.items);
      if (image) {
        e.preventDefault();
        ingest(image);
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [ingest]);

  const ready = status === "ready" && body.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Choose, drop, or <strong className="text-foreground">paste</strong>{" "}
        (Ctrl/⌘+V) a chords-over-lyrics chart. We read it with OCR and align the
        chords over the right syllables into ChordPro, then you fill in the
        details and save. OCR is never perfect — review before saving.
      </p>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          ingest(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-surface py-8 text-center transition-colors hover:border-accent",
          dragActive ? "border-accent bg-accent/5" : "border-border",
        )}
      >
        <ImagePlus className="h-8 w-8 text-muted" />
        <span className="text-sm font-medium">
          Choose, drop, or paste an image
        </span>
        <span className="flex items-center gap-1 text-xs text-muted">
          <ClipboardPaste className="h-3.5 w-3.5" /> Ctrl/⌘+V works anywhere on
          this page · JPG, PNG, or HEIC
        </span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => ingest(e.target.files?.[0])}
        />
      </label>

      {status === "recognizing" && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Reading chart… {progress}%
        </div>
      )}

      {imageUrl && ready && (
        <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
          <div>
            <span className="mb-1 block text-xs font-medium text-muted">
              Source image
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Source chart"
              className="w-full rounded-lg border border-border object-contain"
            />
          </div>
          <div>
            <h2 className="mb-3 text-sm font-semibold">
              Details — the key is auto-detected; add the rest, then save
            </h2>
            {/* Remount per image so the prefilled defaults refresh. */}
            <SongEditor
              key={imageUrl}
              action={createSong}
              defaults={{ body, original_key: detectKey(body) ?? undefined }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
