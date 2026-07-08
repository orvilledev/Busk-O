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
  { label: "e", note: "E4", freq: 329.63 },
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

/**
 * Estimate the fundamental frequency (Hz) of a time-domain buffer via
 * autocorrelation, or return -1 when the signal is too quiet/unclear.
 */
export function detectPitch(buf: Float32Array, sampleRate: number): number {
  const SIZE = buf.length;

  // Volume gate: ignore silence so the needle doesn't chase noise.
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;

  // Trim quiet head/tail so autocorrelation locks onto the sustained tone.
  let r1 = 0;
  let r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < thres) {
      r2 = SIZE - i;
      break;
    }
  }

  const b = buf.slice(r1, r2);
  const n = b.length;
  if (n === 0) return -1;

  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - i; j++) {
      c[i] += b[j] * b[j + i];
    }
  }

  // Skip the initial downslope, then take the first strong peak.
  let d = 0;
  while (d < n - 1 && c[d] > c[d + 1]) d++;
  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < n; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  if (maxpos <= 0) return -1;
  let T0 = maxpos;

  // Parabolic interpolation of the peak for sub-sample accuracy.
  const x1 = c[T0 - 1];
  const x2 = c[T0];
  const x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const bb = (x3 - x1) / 2;
  if (a) T0 = T0 - bb / (2 * a);

  return sampleRate / T0;
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
