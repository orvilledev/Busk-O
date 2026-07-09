/**
 * Client-side pitch detection for the guitar tuner. Pure math + Web Audio time
 * samples — no dependencies, works offline. Uses autocorrelation, which is
 * reliable for a single plucked string (the tuner's use case).
 */

/** Standard tuning, low to high, with each open string's target frequency. */
export const GUITAR_STRINGS = [
  { label: "E", note: "E2", freq: 82.41 },
  { label: "A", note: "A2", freq: 110.0 },
  { label: "D", note: "D3", freq: 146.83 },
  { label: "G", note: "G3", freq: 196.0 },
  { label: "B", note: "B3", freq: 246.94 },
  { label: "E", note: "E4", freq: 329.63 },
] as const;

export type GuitarString = (typeof GUITAR_STRINGS)[number];

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
const A4 = 440;

export interface NoteReading {
  /** Note letter (with sharp), e.g. "E". */
  note: string;
  /** Scientific octave number, e.g. 2. */
  octave: number;
  /** Offset from the nearest note in cents, -50..+50. */
  cents: number;
  /** Detected fundamental frequency in Hz. */
  frequency: number;
}

/** Range of fundamentals a guitar tuner needs to see (Hz). */
const MIN_FREQ = 60;
const MAX_FREQ = 500;
/** YIN dip threshold — below this, a lag is accepted as the period. */
const YIN_THRESHOLD = 0.15;

/**
 * Estimate the fundamental frequency (Hz) of a time-domain buffer, or return
 * -1 when the signal is too quiet or not clearly pitched.
 *
 * Uses the YIN algorithm (cumulative-mean-normalized difference). Unlike plain
 * autocorrelation, it is not biased toward shorter lags, so it doesn't jump an
 * octave up on a harmonic-rich guitar note. The lag search is confined to the
 * guitar's range, which also keeps it fast.
 */
export function detectPitch(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length;

  // Volume gate: ignore near-silence so the needle doesn't chase noise.
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;

  const window = Math.floor(SIZE / 2);
  const minTau = Math.max(2, Math.floor(sampleRate / MAX_FREQ));
  const maxTau = Math.min(window, Math.ceil(sampleRate / MIN_FREQ));
  if (maxTau <= minTau) return -1;

  // Difference function, cumulative-mean normalized as we go.
  const cmnd = new Float32Array(maxTau + 1);
  cmnd[0] = 1;
  let runningSum = 0;
  for (let tau = 1; tau <= maxTau; tau++) {
    let sum = 0;
    for (let i = 0; i < window; i++) {
      const delta = buf[i] - buf[i + tau];
      sum += delta * delta;
    }
    runningSum += sum;
    cmnd[tau] = runningSum > 0 ? (sum * tau) / runningSum : 1;
  }

  // Take the first dip below the threshold (the true period); if none is that
  // clear, fall back to the deepest dip in range.
  let tau = -1;
  for (let t = minTau; t <= maxTau; t++) {
    if (cmnd[t] < YIN_THRESHOLD) {
      while (t + 1 <= maxTau && cmnd[t + 1] < cmnd[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau === -1) {
    let best = Infinity;
    for (let t = minTau; t <= maxTau; t++) {
      if (cmnd[t] < best) {
        best = cmnd[t];
        tau = t;
      }
    }
    if (best > 0.6) return -1; // nothing periodic enough
  }
  if (tau <= 0) return -1;

  // Parabolic interpolation around the dip for sub-sample precision.
  let betterTau = tau;
  if (tau > 1 && tau < maxTau) {
    const s0 = cmnd[tau - 1];
    const s1 = cmnd[tau];
    const s2 = cmnd[tau + 1];
    const denom = 2 * (2 * s1 - s2 - s0);
    if (denom !== 0) betterTau = tau + (s2 - s0) / denom;
  }

  return sampleRate / betterTau;
}

/** Convert a frequency to its nearest note, octave, and cents offset. */
export function frequencyToNote(freq: number): NoteReading {
  const midi = 69 + 12 * Math.log2(freq / A4);
  const rounded = Math.round(midi);
  const cents = Math.round((midi - rounded) * 100);
  const note = NOTE_NAMES[((rounded % 12) + 12) % 12];
  const octave = Math.floor(rounded / 12) - 1;
  return { note, octave, cents, frequency: freq };
}

/** The open string nearest a frequency (by musical distance), for labelling. */
export function nearestString(freq: number): GuitarString {
  return GUITAR_STRINGS.reduce((best, s) =>
    Math.abs(Math.log2(s.freq / freq)) < Math.abs(Math.log2(best.freq / freq))
      ? s
      : best,
  );
}
