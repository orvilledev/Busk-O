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
  toLyricSections,
  toPlainLyrics,
  detectKey,
  insideChordBracket,
  shiftLineChords,
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

  it("survives mid-edit malformed input (regression: crashed the editor)", () => {
    // Unclosed directive / bracket exactly as typed mid-edit.
    expect(() => parse("{start_of_verse\n[G Amazing [C grace\n[")).not.toThrow();
    expect(() => parse("{")).not.toThrow();
    expect(() => parse("[")).not.toThrow();
    expect(() => parse("{comment: ok}\n{bad")).not.toThrow();
  });

  it("keeps the valid lines when one line is broken", () => {
    const song = parse("{bad\n[G]Amazing grace");
    const out = toChordPro(song);
    expect(out).toContain("[G]");
    expect(out).toContain("Amazing grace");
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

  it("returns the input unchanged when it can't be interpreted", () => {
    const weird = "{{{{ not a chart ]]]";
    expect(() => chordsOverWordsToChordPro(weird)).not.toThrow();
  });
});

describe("toLyricSections", () => {
  it("strips chords and groups by section", () => {
    const sections = toLyricSections(AMAZING_GRACE);
    expect(sections.length).toBe(2);
    expect(sections[0].lines[0]).toBe("Amazing grace how sweet the sound");
    expect(sections[0].lines[0]).not.toContain("[");
    expect(sections[1].isChorus).toBe(true);
  });

  it("drops empty and non-lyric lines", () => {
    const sections = toLyricSections("{title: X}\n\n[C]Only [G]line");
    expect(sections).toHaveLength(1);
    expect(sections[0].lines).toEqual(["Only line"]);
  });
});

describe("toPlainLyrics", () => {
  it("separates sections with a blank line", () => {
    const text = toPlainLyrics(AMAZING_GRACE);
    expect(text).toContain("Amazing grace how sweet the sound");
    expect(text).toContain("\n\n");
    expect(text).not.toContain("[G]");
  });
});

describe("detectKey", () => {
  it("uses a {key} directive when present", () => {
    expect(detectKey(AMAZING_GRACE)).toBe("G");
  });

  it("falls back to the first chord's root", () => {
    expect(detectKey("[G]You look so [Dsus4]wonderful [Cadd9]in your dress")).toBe(
      "G",
    );
  });

  it("normalizes a flat root to its sharp spelling", () => {
    expect(detectKey("[Bb]Hello [F]world")).toBe("A#");
  });

  it("returns null when there are no chords", () => {
    expect(detectKey("just lyrics, no chords")).toBeNull();
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

describe("shiftLineChords", () => {
  it("moves every chord one lyric character right", () => {
    expect(shiftLineChords("You [C]pushed me up", 1)).toBe("You p[C]ushed me up");
  });

  it("moves every chord one lyric character left", () => {
    expect(shiftLineChords("You p[C]ushed me up", -1)).toBe("You [C]pushed me up");
  });

  it("never changes the lyric text", () => {
    const line = "And [Am7]if you go, [B7]you know [Em7]the tears";
    const stripped = (s: string) => s.replace(/\[[^\]]*\]/g, "");
    expect(stripped(shiftLineChords(line, 1))).toBe(stripped(line));
    expect(stripped(shiftLineChords(line, -1))).toBe(stripped(line));
  });

  it("round-trips: right then left restores the line", () => {
    const line = "And [F]suddenly [G]the madness[G7] starts";
    expect(shiftLineChords(shiftLineChords(line, 1), -1)).toBe(line);
  });

  it("clamps at the line edges", () => {
    expect(shiftLineChords("[C]You pushed", -1)).toBe("[C]You pushed");
    expect(shiftLineChords("You pushed[C]", 1)).toBe("You pushed[C]");
  });

  it("keeps chord order when chords share an anchor", () => {
    expect(shiftLineChords("[C][G]ab", 1)).toBe("a[C][G]b");
  });

  it("leaves chord-free and directive lines alone", () => {
    expect(shiftLineChords("just some words", 1)).toBe("just some words");
    expect(shiftLineChords("{comment: Verse 2}", 1)).toBe("{comment: Verse 2}");
    expect(shiftLineChords("", 1)).toBe("");
  });

  it("with a range, moves only the chords whose brackets touch it", () => {
    const line = "And [Am7]if you go, [B7]you know [Em7]the tears";
    // Range covering just [B7] (raw offsets 20-24).
    expect(shiftLineChords(line, 1, 20, 24)).toBe(
      "And [Am7]if you go, y[B7]ou know [Em7]the tears",
    );
    // Range covering [Am7] and [B7] but not [Em7].
    expect(shiftLineChords(line, 1, 4, 24)).toBe(
      "And i[Am7]f you go, y[B7]ou know [Em7]the tears",
    );
  });

  it("counts a partially highlighted bracket as selected", () => {
    // Range clips only the first char of "[C]".
    expect(shiftLineChords("You [C]pushed me up", 1, 4, 5)).toBe(
      "You p[C]ushed me up",
    );
  });

  it("moves nothing when the range touches no chord", () => {
    const line = "You [C]pushed me up";
    expect(shiftLineChords(line, 1, 8, 14)).toBe(line);
    expect(shiftLineChords(line, 1, 4, 4)).toBe(line); // empty range
  });

  it("lets a shifted chord pass an unselected neighbour", () => {
    // Only [C] (offsets 0-3) selected; it hops over [G]'s anchor.
    expect(shiftLineChords("[C][G]ab", 1, 0, 3)).toBe("[G]a[C]b");
  });

  it("a collapsed range inside a bracket moves exactly that chord", () => {
    const line = "And [Am7]if you go, [B7]you know [Em7]the tears";
    // Caret inside [B7] (raw offsets 20-24).
    expect(shiftLineChords(line, 1, 22, 22)).toBe(
      "And [Am7]if you go, y[B7]ou know [Em7]the tears",
    );
    // Caret at a bracket boundary is not "inside" — nothing moves.
    expect(shiftLineChords(line, 1, 20, 20)).toBe(line);
    expect(shiftLineChords(line, 1, 24, 24)).toBe(line);
  });
});

describe("insideChordBracket", () => {
  const line = "You [C]pushed me up";

  it("is true for any caret between the brackets", () => {
    expect(insideChordBracket(line, 5)).toBe(true); // after [
    expect(insideChordBracket(line, 6)).toBe(true); // after C
  });

  it("is false at the bracket boundaries and in lyrics", () => {
    expect(insideChordBracket(line, 4)).toBe(false); // before [
    expect(insideChordBracket(line, 7)).toBe(false); // after ]
    expect(insideChordBracket(line, 0)).toBe(false);
    expect(insideChordBracket(line, 10)).toBe(false);
    expect(insideChordBracket("no chords here", 3)).toBe(false);
  });
});
