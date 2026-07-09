"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import {
  GUITAR_STRINGS,
  detectPitch,
  frequencyToNote,
  nearestString,
  type NoteReading,
} from "@/lib/pitch";
import { Button } from "@/components/ui/button";

/** How close (in cents) counts as "in tune". */
const IN_TUNE = 5;
/** Recent detections kept for majority (median) note recognition. */
const HISTORY = 12;

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

            const note = frequencyToNote(next);
            setReading(note);

            // Latch "in tune" with hysteresis (enter ±5¢, leave past ±9¢) so it
            // doesn't chatter — and chime once on the transition into tune.
            const c = Math.abs(note.cents);
            let tuned = wasInTuneRef.current;
            if (c <= IN_TUNE) tuned = true;
            else if (c > IN_TUNE + 4) tuned = false;
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
  // Map -50..+50 cents to 0..100% across the meter.
  const needlePct = Math.max(0, Math.min(100, 50 + cents));

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

      {/* Cents meter */}
      <div className="mt-6 w-full max-w-xs">
        <div className="relative h-14">
          {/* center + edge ticks */}
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
          <div className="absolute left-1/2 top-2 h-10 w-0.5 -translate-x-1/2 bg-foreground/40" />
          {[10, 30, 70, 90].map((p) => (
            <div
              key={p}
              className="absolute top-4 h-6 w-px bg-border"
              style={{ left: `${p}%` }}
            />
          ))}
          {/* needle */}
          <div
            className={`absolute top-1 h-12 w-1 -translate-x-1/2 rounded-full transition-[left,background-color] duration-[600ms] ease-out ${
              inTune ? "bg-emerald-400" : "bg-accent"
            }`}
            style={{ left: `${needlePct}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-muted">
          <span>♭ flat</span>
          <span className={inTune ? "font-semibold text-emerald-400" : ""}>
            {reading ? `${cents > 0 ? "+" : ""}${cents}¢` : "—"}
          </span>
          <span>sharp ♯</span>
        </div>
      </div>

      {/* String targets */}
      <div className="mt-6 flex gap-2">
        {GUITAR_STRINGS.map((s) => {
          const active = target?.note === s.note;
          return (
            <div
              key={s.note}
              className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition-colors ${
                active && inTune
                  ? "border-emerald-400 bg-emerald-400/15 text-emerald-400"
                  : active
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border text-muted"
              }`}
              title={s.note}
            >
              {s.label}
            </div>
          );
        })}
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

/** Median of a small numeric array (robust to octave/noise outliers). */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}
