import { describe, it, expect } from "vitest";
import {
  parse,
  getKey,
  transpose,
  toChordPro,
  chordsOverWordsToChordPro,
  semitonesBetween,
  transposeKey,
  capoFret,
} from "./chordpro";

const AMAZING_GRACE = `{title: Amazing Grace}
{key: G}

{start_of_verse}
[G]Amazing [G7]grace how [C]sweet the [G]sound
That [G]saved a [Em]wretch like [D]me
{end_of_verse}

{start_of_chorus}
My [G]chains are [C]gone, I've been set [G]free
{end_of_chorus}`;

describe("parse", () => {
  it("reads metadata and sections", () => {
    const song = parse(AMAZING_GRACE);
    expect(song.title).toBe("Amazing Grace");
    const hasChorus = song.lines.some((l) => l.isChorus());
    expect(hasChorus).toBe(true);
  });

  it("does not throw on empty or garbage input", () => {
    expect(() => parse("")).not.toThrow();
    expect(() => parse("just some words no chords")).not.toThrow();
  });
});

describe("getKey", () => {
  it("returns the declared key", () => {
    expect(getKey(parse(AMAZING_GRACE))).toBe("G");
  });

  it("returns null when no key directive is present", () => {
    expect(getKey(parse("[C]Hello [G]world"))).toBeNull();
  });
});

describe("transpose", () => {
  it("moves every chord up by the given semitones", () => {
    const up = transpose(parse(AMAZING_GRACE), 2); // G -> A
    const chords = toChordPro(up);
    expect(chords).toContain("[A]");
    expect(chords).toContain("[D]"); // C -> D
    expect(chords).not.toContain("[G]");
  });

  it("is a no-op for zero semitones", () => {
    const song = parse(AMAZING_GRACE);
    expect(transpose(song, 0)).toBe(song);
  });

  it("updates the key metadata", () => {
    const up = transpose(parse(AMAZING_GRACE), 2);
    expect(getKey(up)).toBe("A");
  });

  it("handles minor keys and flats", () => {
    const src = "{key: Am}\n[Am]Sad [Dm]song [E]here";
    const down = transpose(parse(src), -2); // Am -> Gm
    expect(getKey(down)).toBe("Gm");
  });
});

describe("chordsOverWordsToChordPro", () => {
  it("converts chords-over-lyrics into bracketed ChordPro", () => {
    const input = ["G        C", "Amazing grace"].join("\n");
    const out = chordsOverWordsToChordPro(input);
    expect(out).toContain("[G]");
    expect(out).toContain("[C]");
    expect(out).toContain("Amazing");
  });
});

describe("key math", () => {
  it("finds the shortest signed distance between keys", () => {
    expect(semitonesBetween("G", "A")).toBe(2);
    expect(semitonesBetween("A", "G")).toBe(-2);
    expect(semitonesBetween("C", "B")).toBe(-1); // shorter than +11
  });

  it("transposes a key with wraparound", () => {
    expect(transposeKey("A", 3)).toBe("C");
    expect(transposeKey("C", -1)).toBe("B");
  });

  it("computes capo fret to reach a sounding key", () => {
    expect(capoFret("G", "A")).toBe(2); // G shapes + capo 2 = A
    expect(capoFret("C", "C")).toBe(0);
  });
});
