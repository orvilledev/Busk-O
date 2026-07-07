"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardPaste, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { detectKey } from "@/lib/chordpro";
import { imageToChordPro, imageFromClipboard } from "@/lib/ocr-run";
import { SongEditor } from "@/components/songs/song-editor";
import { cn } from "@/lib/utils";
import { createSong } from "@/app/(app)/songs/actions";

type Status = "idle" | "recognizing" | "ready";

interface ImageData {
  file: File;
  url: string;
}

export function OcrImport() {
  const [images, setImages] = useState<ImageData[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [body, setBody] = useState("");
  const [dragActive, setDragActive] = useState(false);

  /** Process all images in order and concatenate results. */
  const recognize = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    setStatus("recognizing");
    setProgress(0);
    try {
      const results: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const result = await imageToChordPro(files[i], (p) => {
          // Scale progress across all files
          const overallProgress = Math.round(
            ((i + p / 100) / files.length) * 100
          );
          setProgress(overallProgress);
        });
        results.push(result);
      }
      // Concatenate all results with a blank line between them
      setBody(results.join("\n\n"));
    } finally {
      setStatus("ready");
    }
  }, []);

  /** Accept images from the file picker, a drop, or a paste. */
  const ingest = useCallback(
    (newFiles: File[] | null | undefined) => {
      if (!newFiles || newFiles.length === 0) return;
      const imageList: ImageData[] = Array.from(newFiles).map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }));
      setImages((prev) => [...prev, ...imageList]);
      setStatus("idle");
      setBody("");
      recognize([...images.map((i) => i.file), ...newFiles]);
    },
    [images, recognize]
  );

  // Paste a screenshot anywhere on the page — unless a field is focused
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const el = document.activeElement?.tagName;
      if (el === "TEXTAREA" || el === "INPUT") return;
      const image = imageFromClipboard(e.clipboardData?.items);
      if (image) {
        e.preventDefault();
        ingest([image]);
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [ingest]);

  function removeImage(index: number) {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    if (newImages.length === 0) {
      setBody("");
      setStatus("idle");
    } else {
      recognize(newImages.map((i) => i.file));
    }
  }

  const ready = status === "ready" && body.trim().length > 0 && images.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Choose, drop, or <strong className="text-foreground">paste</strong>{" "}
        (Ctrl/⌘+V) one or more chords-over-lyrics charts. Upload them in order
        — we'll read them with OCR and combine them into ChordPro, then you fill
        in the details and save. OCR is never perfect — review before saving.
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
          ingest(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-surface py-8 text-center transition-colors hover:border-accent",
          dragActive ? "border-accent bg-accent/5" : "border-border"
        )}
      >
        <ImagePlus className="h-8 w-8 text-muted" />
        <span className="text-sm font-medium">
          Choose, drop, or paste images
        </span>
        <span className="flex items-center gap-1 text-xs text-muted">
          <ClipboardPaste className="h-3.5 w-3.5" /> Ctrl/⌘+V works anywhere on
          this page · JPG, PNG, or HEIC
        </span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => ingest(Array.from(e.target.files ?? []))}
        />
      </label>

      {/* Show all uploaded images */}
      {images.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="mb-2 text-xs font-medium text-muted">
            {images.length} image{images.length !== 1 ? "s" : ""} selected (in order)
          </p>
          <div className="flex flex-wrap gap-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative h-20 w-20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={`Image ${idx + 1}`}
                  className="h-full w-full rounded-lg border border-border object-cover"
                />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute -right-2 -top-2 rounded-full bg-danger p-1 text-white hover:bg-danger/80"
                  title="Remove image"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                  {idx + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {status === "recognizing" && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Reading charts… {progress}%
        </div>
      )}

      {ready && (
        <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
          <div>
            <span className="mb-1 block text-xs font-medium text-muted">
              Source images
            </span>
            <div className="flex flex-col gap-2">
              {images.map((img, idx) => (
                <div key={idx}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={`Source chart ${idx + 1}`}
                    className="w-full rounded-lg border border-border object-contain"
                  />
                  <p className="mt-1 text-center text-xs text-muted">
                    Page {idx + 1}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-3 text-sm font-semibold">
              Details — the key is auto-detected; add the rest, then save
            </h2>
            {/* Remount per image set so the prefilled defaults refresh. */}
            <SongEditor
              key={images.length}
              action={createSong}
              defaults={{ body, original_key: detectKey(body) ?? undefined }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
