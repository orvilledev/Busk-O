import {
  ChordProParser,
  ChordProFormatter,
  ChordsOverWordsParser,
  Song,
} from "chordsheetjs";

/**
 * Thin wrapper around chordsheetjs. ChordPro is Busk-O's canonical storage
 * format; everything here operates on that so the rest of the app never has to
 * touch the library directly.
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

/** Parse ChordPro source into a Song AST. Never throws on bad input. */
export function parse(source: string): Song {
  return new ChordProParser().parse(source);
}

/**
 * Convert a "chords over lyrics" chart (chords on their own line above the
 * lyric line) into canonical ChordPro. Used by paste- and OCR-import.
 */
export function chordsOverWordsToChordPro(source: string): string {
  const song = new ChordsOverWordsParser().parse(source);
  return new ChordProFormatter().format(song);
}

/** Serialize a Song back to ChordPro (e.g. after transposing for export). */
export function toChordPro(song: Song): string {
  return new ChordProFormatter().format(song);
}

/**
 * The song's key, if declared via a `{key: ...}` directive. Returns the string
 * spelling (e.g. "G", "F#m") or null when the chart has no key metadata.
 */
export function getKey(song: Song): string | null {
  const key = song.currentKey;
  return key ? key.toString() : null;
}

/** Transpose a song by a number of semitones (positive up, negative down). */
export function transpose(song: Song, semitones: number): Song {
  if (semitones === 0) return song;
  return song.transpose(semitones);
}

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
