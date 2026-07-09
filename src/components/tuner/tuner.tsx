"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import {
  GUITAR_STRINGS,
  detectPitch,
  frequencyToMidi,
  frequencyToNote,
  nearestString,
  type NoteReading,
} from "@/lib/pitch";
import { Button } from "@/components/ui/button";

/** How close (in cents) counts as "in tune". */
const IN_TUNE = 5;
/** Recent detections kept for majority (median) note recognition. */
const HISTORY = 12;
// The note track spans the open strings (E2–E4) with a little padding, in MIDI.
const TRACK_LOW = 38;
const TRACK_HIGH = 66;

/**
 * Microphone guitar tuner. All client-side (Web Audio + YIN pitch detection),
 * so it works offline. Needs a user gesture + mic permission to start the
 * audio graph.
 */
export function Tuner() {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState<NoteReading | null>(null);
  const [inTune, setInTune] = useState(false);

  // Audio graph + loop handles, kept in refs so re-renders don't recreate them.
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const smoothFreqRef = useRef(0);
  const silentFramesRef = useRef(0);
  const wasInTuneRef = useRef(false);
  const historyRef = useRef<number[]>([]);

  /** Short chime through the speakers the moment a string lands in tune. */
  function playChime() {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.32);
  }

  function stop() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    streamRef.current = null;
    smoothFreqRef.current = 0;
    wasInTuneRef.current = false;
    historyRef.current = [];
    setListening(false);
    setReading(null);
    setInTune(false);
  }

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctx();
      await ctx.resume(); // iOS starts contexts suspended
      ctxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      // A longer window steadies low notes (E2 ≈ 82 Hz) for YIN detection.
      analyser.fftSize = 4096;
      source.connect(analyser);

      const buf = new Float32Array(analyser.fftSize);
      setListening(true);

      const tick = () => {
        analyser.getFloatTimeDomainData(buf);
        const freq = detectPitch(buf, ctx.sampleRate);

        if (freq > 0) {
          silentFramesRef.current = 0;

          // Keep a short rolling history and follow its majority. The median
          // ignores the occasional octave/noise outlier, so the note locks on
          // to what's actually being played instead of flickering.
          const hist = historyRef.current;
          hist.push(freq);
          if (hist.length > HISTORY) hist.shift();

          if (hist.length >= 5) {
            const med = median(hist);
            // Average only the detections in the same note-neighbourhood as the
            // median (within ~60¢), for a clean, stable frequency.
            const inliers = hist.filter(
              (f) => Math.abs(1200 * Math.log2(f / med)) < 60,
            );
            const avg = inliers.reduce((a, b) => a + b, 0) / inliers.length;

            // Extra smoothing so the needle glides slowly toward the pitch.
            const prev = smoothFreqRef.current;
            const next = prev > 0 ? prev * 0.85 + avg * 0.15 : avg;
            smoothFreqRef.current = next;

            setReading(frequencyToNote(next));

            // "In tune" is measured against the nearest open string, so it only
            // greens on a real string pitch. Hysteresis (enter ±5¢, leave past
            // ±9¢) stops chatter; chime once on the transition into tune.
            const off = Math.abs(1200 * Math.log2(next / nearestString(next).freq));
            let tuned = wasInTuneRef.current;
            if (off <= IN_TUNE) tuned = true;
            else if (off > IN_TUNE + 4) tuned = false;
            if (tuned && !wasInTuneRef.current) playChime();
            wasInTuneRef.current = tuned;
            setInTune(tuned);
          }
        } else if (++silentFramesRef.current > 40) {
          // Hold the last note through brief gaps; clear after real silence.
          historyRef.current = [];
          smoothFreqRef.current = 0;
          wasInTuneRef.current = false;
          setReading(null);
          setInTune(false);
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      const name = (err as DOMException)?.name;
      setError(
        name === "NotAllowedError"
          ? "Microphone access was blocked. Allow it in your browser settings and try again."
          : "Couldn't access the microphone on this device.",
      );
      stop();
    }
  }

  // Tear down the audio graph when the component unmounts.
  useEffect(() => () => stop(), []);

  const cents = reading?.cents ?? 0;
  const target = reading ? nearestString(reading.frequency) : null;
  // Where the current pitch sits on the E2–E4 note track (0–100%).
  const markerPct = reading ? midiToPct(frequencyToMidi(reading.frequency)) : 50;
  // Below the target string → tighten to raise it; above → loosen.
  const belowTarget = target ? reading!.frequency < target.freq : false;

  return (
    <div className="flex flex-col items-center">
      {/* Note read-out */}
      <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full border border-border bg-surface">
        {reading ? (
          <>
            <div
              className={centsColor(inTune, cents)}
              style={{ fontSize: "3.5rem", lineHeight: 1, fontWeight: 700 }}
            >
              {reading.note}
              <span className="align-super text-xl text-muted">
                {reading.octave}
              </span>
            </div>
            <div className="mt-1 text-sm text-muted">
              {reading.frequency.toFixed(1)} Hz
            </div>
          </>
        ) : (
          <div className="px-4 text-center text-sm text-muted">
            {listening ? "Play a string…" : "Tap start to tune"}
          </div>
        )}
      </div>

      {/* Note-position track: slide the marker from note to note until it
          lands on your string. Left of your string → tighten; right → loosen. */}
      <div className="mt-8 w-full max-w-sm">
        <div className="relative h-20">
          {/* baseline */}
          <div className="absolute inset-x-0 top-7 h-0.5 rounded bg-border" />

          {/* open-string landmarks */}
          {GUITAR_STRINGS.map((s) => {
            const pct = midiToPct(frequencyToMidi(s.freq));
            const active = target?.note === s.note;
            const tone = active
              ? inTune
                ? "text-emerald-400"
                : "text-accent"
              : "text-muted";
            const tick = active
              ? inTune
                ? "bg-emerald-400"
                : "bg-accent"
              : "bg-border";
            return (
              <div
                key={s.note}
                className="absolute flex -translate-x-1/2 flex-col items-center"
                style={{ left: `${pct}%`, top: "16px" }}
              >
                <div className={`h-6 w-0.5 ${tick}`} />
                <span className={`mt-1.5 text-sm font-bold ${tone}`}>
                  {s.label}
                </span>
              </div>
            );
          })}

          {/* current-pitch marker */}
          {reading && (
            <div
              className={`absolute top-0 h-14 w-1 -translate-x-1/2 rounded-full transition-[left] duration-[600ms] ease-out ${
                inTune ? "bg-emerald-400" : "bg-accent"
              }`}
              style={{ left: `${markerPct}%` }}
            />
          )}
        </div>

        {/* plain-language guidance */}
        <p
          className={`mt-2 text-center text-base font-semibold ${
            inTune ? "text-emerald-400" : "text-foreground"
          }`}
        >
          {!reading
            ? listening
              ? "Play a string"
              : " "
            : inTune
              ? "In tune ✓"
              : belowTarget
                ? "Tighten ↑"
                : "Loosen ↓"}
        </p>
      </div>

      {/* Controls */}
      <div className="mt-8">
        {listening ? (
          <Button variant="secondary" size="lg" onClick={stop}>
            <MicOff className="h-4 w-4" /> Stop
          </Button>
        ) : (
          <Button size="lg" onClick={start}>
            <Mic className="h-4 w-4" /> Start tuning
          </Button>
        )}
      </div>

      {error && (
        <p className="mt-4 max-w-xs text-center text-sm text-danger">{error}</p>
      )}
      <p className="mt-4 max-w-xs text-center text-xs text-muted">
        Uses your microphone on-device — nothing is recorded or uploaded.
      </p>
    </div>
  );
}

function centsColor(inTune: boolean, cents: number): string {
  if (inTune) return "text-emerald-400";
  return Math.abs(cents) <= 15 ? "text-foreground" : "text-accent";
}

/** Position (0–100%) of a MIDI note along the E2–E4 tuning track. */
function midiToPct(midi: number): number {
  const pct = ((midi - TRACK_LOW) / (TRACK_HIGH - TRACK_LOW)) * 100;
  return Math.max(0, Math.min(100, pct));
}

/** Median of a small numeric array (robust to octave/noise outliers). */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}
