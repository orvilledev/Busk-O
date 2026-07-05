/**
 * Pure musical-key helpers with NO dependency on chordsheetjs. Kept separate so
 * control-only UI (key dropdowns, transpose/capo steppers) can import these
 * without pulling the ~270 KB ChordPro parser into their bundle.
 */

/** The twelve keys we offer in the UI, using sharps as the canonical spelling. */
export const KEYS = [
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
] as const;

export type Key = (typeof KEYS)[number];

/**
 * Number of semitones between two keys, ignoring octaves. Used to translate a
 * "play in this key" choice into a transpose delta, and to compute capo hints.
 */
export function semitonesBetween(from: Key, to: Key): number {
  const delta = (KEYS.indexOf(to) - KEYS.indexOf(from) + 12) % 12;
  // Prefer the shorter direction so we don't always transpose "up".
  return delta > 6 ? delta - 12 : delta;
}

/** The key you get by transposing `from` by `semitones` (wraps around). */
export function transposeKey(from: Key, semitones: number): Key {
  const idx = (KEYS.indexOf(from) + (semitones % 12) + 12) % 12;
  return KEYS[idx];
}

/**
 * Capo hint. If a guitarist plays shapes for `shapeKey` with a capo on the
 * given fret, the music sounds in `soundingKey`. Returns the fret (0–11).
 */
export function capoFret(shapeKey: Key, soundingKey: Key): number {
  return (KEYS.indexOf(soundingKey) - KEYS.indexOf(shapeKey) + 12) % 12;
}
