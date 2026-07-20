"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, MoveLeft, MoveRight, Wand2 } from "lucide-react";
import {
  chordSpanAt,
  chordsOverWordsToChordPro,
  KEYS,
  shiftLineChords,
} from "@/lib/chordpro";
import { useOcrPaste } from "@/hooks/use-ocr-paste";
import { ChordChart } from "./chord-chart";
import { Button } from "@/components/ui/button";
import type { Song } from "@/types/domain";

/** Prefill values for create mode (e.g. from an OCR import). */
export type SongEditorDefaults = Partial<
  Pick<Song, "title" | "artist" | "original_key" | "tempo" | "tags" | "body">
>;

interface SongEditorProps {
  /** Existing song when editing; omitted when creating. */
  song?: Song;
  /** Initial values when creating a new song (ignored if `song` is set). */
  defaults?: SongEditorDefaults;
  /** Server action bound to receive the form data. */
  action: (formData: FormData) => Promise<void>;
}

const field =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-muted focus:border-accent";
const labelClass = "mb-1 block text-xs font-medium text-muted";

export function SongEditor({ song, defaults, action }: SongEditorProps) {
  const initial: SongEditorDefaults = song ?? defaults ?? {};
  // Songs saved before line endings were normalized may carry CRLF. The
  // textarea DOM always normalizes to LF, so keep the state in LF too —
  // otherwise cursor offsets drift and chord nudging targets the wrong spot.
  const [body, setBody] = useState(() =>
    (initial.body ?? "").replace(/\r\n?/g, "\n"),
  );
  const [submitting, setSubmitting] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const pendingSelection = useRef<{ start: number; end: number } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewHeight, setPreviewHeight] = useState<number>();
  const { ocr, handlePaste } = useOcrPaste(body, setBody, bodyRef);

  // Keep the editor at least as tall as the preview so the two columns line up
  // for reference — side by side (where the grid also stretches them) and, on
  // narrow screens, when they stack. Tracks content, resize, and breakpoint
  // changes via the preview's rendered height.
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const measure = () => setPreviewHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function handleConvert() {
    // Interpret the current textarea as chords-over-lyrics and rewrite it as
    // ChordPro. Handy right after pasting a chart off the web.
    setBody(chordsOverWordsToChordPro(body));
  }

  /**
   * Shift chords one lyric character left or right, leaving the lyrics as
   * they are. With text highlighted, only chords whose brackets touch the
   * highlight move; a bare cursor inside a [Chord] moves just that chord;
   * a bare cursor in lyric text moves every chord on that line.
   */
  function nudgeChords(delta: -1 | 1) {
    const ta = bodyRef.current;
    if (!ta) return;
    const selStart = ta.selectionStart;
    const selEnd = ta.selectionEnd;
    const hasHighlight = selStart !== selEnd;
    const lineStart = body.lastIndexOf("\n", selStart - 1) + 1;
    const newlineAfter = body.indexOf("\n", selEnd);
    const lineEnd = newlineAfter === -1 ? body.length : newlineAfter;

    let offset = lineStart;
    let caretOnChord = false;
    const shifted = body
      .slice(lineStart, lineEnd)
      .split("\n")
      .map((line) => {
        const start = offset;
        offset += line.length + 1;
        if (hasHighlight) {
          return shiftLineChords(line, delta, selStart - start, selEnd - start);
        }
        // Bare cursor (always a single line): touching a bracket grabs that
        // chord alone — its full span passed as the range selects exactly it.
        const span = chordSpanAt(line, selStart - start);
        caretOnChord = span !== null;
        return span
          ? shiftLineChords(line, delta, span.start, span.end)
          : shiftLineChords(line, delta);
      })
      .join("\n");
    if (shifted === body.slice(lineStart, lineEnd)) return;

    // Keep the selection on what was nudged (same length — the shift is a
    // permutation): a highlight or an in-chord caret follows the moved
    // chords by delta, a bare cursor in lyrics re-selects the whole line.
    // Applied in a layout effect: the controlled value resets the caret when
    // React commits, so setting it here would be overwritten.
    pendingSelection.current = hasHighlight
      ? {
          start: Math.max(
            body.lastIndexOf("\n", selStart - 1) + 1,
            selStart + delta,
          ),
          end: Math.min(lineEnd, selEnd + delta),
        }
      : caretOnChord
        ? { start: selStart + delta, end: selStart + delta }
        : { start: lineStart, end: lineStart + shifted.length };
    setBody(body.slice(0, lineStart) + shifted + body.slice(lineEnd));
  }

  useLayoutEffect(() => {
    const ta = bodyRef.current;
    if (!pendingSelection.current || !ta) return;
    ta.focus();
    ta.setSelectionRange(pendingSelection.current.start, pendingSelection.current.end);
    pendingSelection.current = null;
  }, [body]);

  /**
   * Alt+←/→ always nudges. Shift+←/→ nudges only when the caret sits inside
   * a [Chord] bracket — anywhere else it keeps its native extend-selection
   * behavior, which the highlight-to-nudge flow depends on.
   */
  function handleBodyKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.ctrlKey || e.metaKey) return;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const delta = e.key === "ArrowLeft" ? -1 : 1;

    if (e.altKey) {
      e.preventDefault();
      nudgeChords(delta);
      return;
    }

    if (e.shiftKey) {
      const ta = e.currentTarget;
      if (ta.selectionStart !== ta.selectionEnd) return; // extending a selection
      const lineStart = body.lastIndexOf("\n", ta.selectionStart - 1) + 1;
      const newlineAfter = body.indexOf("\n", ta.selectionStart);
      const line = body.slice(
        lineStart,
        newlineAfter === -1 ? body.length : newlineAfter,
      );
      if (chordSpanAt(line, ta.selectionStart - lineStart) !== null) {
        e.preventDefault();
        nudgeChords(delta);
      }
    }
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
            defaultValue={initial.title ?? ""}
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
            defaultValue={initial.artist ?? ""}
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
              defaultValue={initial.original_key ?? ""}
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
              defaultValue={initial.tempo ?? ""}
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
            defaultValue={initial.tags?.join(", ") ?? ""}
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
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => nudgeChords(-1)}
              title="Nudge left: highlighted chords, the chord at the cursor (Shift+← or Alt+←), or the whole line (Alt+←)"
            >
              <MoveLeft className="h-4 w-4" />
              <span className="sr-only">Shift chords left</span>
            </Button>
            <span className="text-xs text-muted">Nudge chords</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => nudgeChords(1)}
              title="Nudge right: highlighted chords, the chord at the cursor (Shift+→ or Alt+→), or the whole line (Alt+→)"
            >
              <MoveRight className="h-4 w-4" />
              <span className="sr-only">Shift chords right</span>
            </Button>
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
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div
            className="relative h-full min-h-80"
            style={previewHeight ? { minHeight: previewHeight } : undefined}
          >
            <textarea
              id="body"
              name="body"
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={handleBodyKeyDown}
              spellCheck={false}
              className={`${field} h-full min-h-80 w-full font-mono`}
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
          <div
            ref={previewRef}
            className="min-h-80 overflow-auto rounded-lg border border-border bg-surface p-3"
          >
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
