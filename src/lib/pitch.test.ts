import { describe, expect, it } from "vitest";
import {
  GUITAR_STRINGS,
  detectPitch,
  frequencyToNote,
  nearestString,
} from "./pitch";

const SAMPLE_RATE = 44100;

/** Build a time-domain buffer of a sine wave at `freq` Hz. */
function sine(freq: number, size = 2048): Float32Array {
  const buf = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    buf[i] = Math.sin((2 * Math.PI * freq * i) / SAMPLE_RATE);
  }
  return buf;
}

describe("detectPitch", () => {
  it("recovers each open-string frequency within 1 Hz", () => {
    for (const s of GUITAR_STRINGS) {
      const detected = detectPitch(sine(s.freq), SAMPLE_RATE);
      expect(Math.abs(detected - s.freq)).toBeLessThan(1);
    }
  });

  it("returns -1 for silence", () => {
    expect(detectPitch(new Float32Array(2048), SAMPLE_RATE)).toBe(-1);
  });
});

describe("frequencyToNote", () => {
  it("reads 440 Hz as A4, 0 cents", () => {
    const r = frequencyToNote(440);
    expect(r.note).toBe("A");
    expect(r.octave).toBe(4);
    expect(r.cents).toBe(0);
  });

  it("reads 82.41 Hz as E2", () => {
    const r = frequencyToNote(82.41);
    expect(r.note).toBe("E");
    expect(r.octave).toBe(2);
    expect(Math.abs(r.cents)).toBeLessThanOrEqual(1);
  });

  it("reports a sharp note with positive cents", () => {
    // ~half a semitone above A4 → clearly sharp.
    expect(frequencyToNote(448).cents).toBeGreaterThan(10);
  });
});

describe("nearestString", () => {
  it("maps a slightly flat low E to the E2 string", () => {
    expect(nearestString(80).note).toBe("E2");
  });

  it("maps ~196 Hz to the G3 string", () => {
    expect(nearestString(196).note).toBe("G3");
  });
});
