"use client";

import { useState } from "react";
import { ImagePlus, Loader2, ScanLine, Wand2 } from "lucide-react";
import { chordsOverWordsToChordPro } from "@/lib/chordpro";
import { ChordChart } from "@/components/songs/chord-chart";
import { Button } from "@/components/ui/button";
import { createSong } from "@/app/(app)/songs/actions";

type Status = "idle" | "recognizing" | "ready";

export function OcrImport() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const field =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent";

  function onFile(file: File | undefined) {
    if (!file) return;
    setImageUrl(URL.createObjectURL(file));
    setStatus("idle");
    setBody("");
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
    recognize(file);
  }

  async function recognize(file: File) {
    setStatus("recognizing");
    setProgress(0);
    try {
      const Tesseract = (await import("tesseract.js")).default;
      const { data } = await Tesseract.recognize(file, "eng", {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") setProgress(Math.round(m.progress * 100));
        },
      });
      // OCR output always lands in the editor for review — never saved blind.
      setBody(data.text.trim());
      setStatus("ready");
    } catch {
      setStatus("ready");
    }
  }

  async function save() {
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    const fd = new FormData();
    fd.set("title", title);
    fd.set("body", body);
    try {
      await createSong(fd); // redirects to the new song on success
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Snap a photo of a chord chart. We&apos;ll read the text with OCR — then
        you clean it up and convert it to a chart before saving. OCR is never
        perfect, so always review.
      </p>

      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface py-10 text-center hover:border-accent">
        <ImagePlus className="h-8 w-8 text-muted" />
        <span className="text-sm font-medium">Choose or drop an image</span>
        <span className="text-xs text-muted">JPG, PNG, or HEIC</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </label>

      {imageUrl && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Source chart"
              className="max-h-64 w-full rounded-lg border border-border object-contain"
            />
            {status === "recognizing" && (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> Reading text… {progress}%
              </div>
            )}

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Song title"
              className={field}
            />

            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted">
                Recognized text (edit freely)
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setBody(chordsOverWordsToChordPro(body))}
                disabled={!body.trim()}
                title="Convert chords-over-lyrics to ChordPro"
              >
                <Wand2 className="h-4 w-4" /> To ChordPro
              </Button>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              spellCheck={false}
              className={`${field} min-h-64 font-mono`}
              placeholder="Recognized text appears here…"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted">Chart preview</span>
            <div className="min-h-64 flex-1 overflow-auto rounded-lg border border-border bg-surface p-3">
              {body.trim() ? (
                <ChordChart source={body} />
              ) : (
                <p className="text-sm text-muted">
                  Convert the text to see the chart.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {imageUrl && (
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving || !title.trim() || !body.trim()}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ScanLine className="h-4 w-4" />
            )}
            Save song
          </Button>
        </div>
      )}
    </div>
  );
}
