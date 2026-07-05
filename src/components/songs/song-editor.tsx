"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Wand2 } from "lucide-react";
import { chordsOverWordsToChordPro, KEYS } from "@/lib/chordpro";
import { useOcrPaste } from "@/hooks/use-ocr-paste";
import { ChordChart } from "./chord-chart";
import { Button } from "@/components/ui/button";
import type { Song } from "@/types/domain";

interface SongEditorProps {
  /** Existing song when editing; omitted when creating. */
  song?: Song;
  /** Server action bound to receive the form data. */
  action: (formData: FormData) => Promise<void>;
}

const field =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent";
const labelClass = "mb-1 block text-xs font-medium text-muted";

export function SongEditor({ song, action }: SongEditorProps) {
  const [body, setBody] = useState(song?.body ?? "");
  const [submitting, setSubmitting] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const { ocr, handlePaste } = useOcrPaste(body, setBody, bodyRef);

  function handleConvert() {
    // Interpret the current textarea as chords-over-lyrics and rewrite it as
    // ChordPro. Handy right after pasting a chart off the web.
    setBody(chordsOverWordsToChordPro(body));
  }

  return (
    <form
      action={action}
      onSubmit={() => setSubmitting(true)}
      className="flex flex-col gap-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="title">
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            defaultValue={song?.title ?? ""}
            placeholder="Amazing Grace"
            className={field}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="artist">
            Artist
          </label>
          <input
            id="artist"
            name="artist"
            defaultValue={song?.artist ?? ""}
            placeholder="Traditional"
            className={field}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="original_key">
              Key
            </label>
            <select
              id="original_key"
              name="original_key"
              defaultValue={song?.original_key ?? ""}
              className={field}
            >
              <option value="">—</option>
              {KEYS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="tempo">
              Tempo
            </label>
            <input
              id="tempo"
              name="tempo"
              type="number"
              min={0}
              defaultValue={song?.tempo ?? ""}
              placeholder="BPM"
              className={field}
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="tags">
            Tags <span className="text-muted">(comma separated)</span>
          </label>
          <input
            id="tags"
            name="tags"
            defaultValue={song?.tags?.join(", ") ?? ""}
            placeholder="hymn, communion, slow"
            className={field}
          />
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className={labelClass} htmlFor="body">
            Chords &amp; lyrics{" "}
            <span className="text-muted">
              — or paste a screenshot to read it in
            </span>
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleConvert}
            title="Convert pasted chords-over-lyrics into ChordPro"
          >
            <Wand2 className="h-4 w-4" /> Convert paste
          </Button>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="relative">
            <textarea
              id="body"
              name="body"
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onPaste={handlePaste}
              spellCheck={false}
              className={`${field} min-h-80 w-full font-mono`}
              placeholder={
                "{start_of_verse}\n[G]Amazing [C]grace...\n{end_of_verse}\n\n(Tip: paste a screenshot of a chart here)"
              }
            />
            {ocr.busy && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-background/80 text-sm">
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
                <span>Reading chart… {ocr.progress}%</span>
              </div>
            )}
          </div>
          <div className="min-h-80 overflow-auto rounded-lg border border-border bg-surface p-3">
            {body.trim() ? (
              <ChordChart source={body} />
            ) : (
              <p className="flex items-center gap-1.5 text-sm text-muted">
                <ImagePlus className="h-4 w-4" /> Preview appears here — type
                ChordPro or paste a screenshot.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {song ? "Save changes" : "Create song"}
        </Button>
      </div>
    </form>
  );
}
