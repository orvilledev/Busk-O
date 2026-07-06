import { describe, it, expect } from "vitest";
import {
  isChord,
  normalizeToken,
  fixLyricOcr,
  clusterRows,
  rowsToChordPro,
  wordsToChordPro,
  type OcrWord,
} from "./ocr-chords";

const w = (text: string, x0: number, y0: number): OcrWord => ({
  text,
  x0,
  y0,
  x1: x0 + text.length * 10,
  y1: y0 + 16,
});

describe("isChord", () => {
  it("accepts real chord spellings", () => {
    for (const c of ["G", "Em", "C", "D", "Am7", "Cmaj7", "Dsus4", "D/F#", "G/B", "Cadd9", "Dadd4"]) {
      expect(isChord(c), c).toBe(true);
    }
  });

  it("rejects lyric words", () => {
    for (const bad of ["love", "the", "dancing", "Baby", "ti-ime", "[Verse]"]) {
      expect(isChord(bad), bad).toBe(false);
    }
  });
});

describe("clusterRows", () => {
  it("separates a chord line from the lyric line below it", () => {
    const words = [
      w("G", 60, 70),
      w("Em", 240, 70),
      w("I", 10, 100),
      w("found", 60, 100),
      w("me", 290, 100),
    ];
    const rows = clusterRows(words);
    expect(rows).toHaveLength(2);
    expect(rows[0].map((r) => r.text)).toEqual(["G", "Em"]);
    expect(rows[1][0].text).toBe("I");
  });
});

describe("rowsToChordPro alignment", () => {
  it("places each chord above the character it sits over", () => {
    // "I found a love for me" with G over "found", Em over "for".
    const lyric = [
      w("I", 10, 100),
      w("found", 60, 100),
      w("a", 150, 100),
      w("love", 175, 100),
      w("for", 240, 100),
      w("me", 290, 100),
    ];
    const chords = [w("G", 60, 78), w("Em", 240, 78)];
    const out = rowsToChordPro([chords, lyric]);
    expect(out).toBe("I [G]found a love [Em]for me");
  });

  it("brackets a chord that starts before the first word", () => {
    const lyric = [w("Darling", 40, 100), w("just", 130, 100)];
    const chords = [w("G", 10, 78)];
    expect(rowsToChordPro([chords, lyric])).toBe("[G]Darling just");
  });
});

describe("rowsToChordPro row kinds", () => {
  it("keeps an intro chord line with no lyrics as bracketed chords", () => {
    const out = rowsToChordPro([[w("G", 10, 20)]]);
    expect(out).toBe("[G]");
  });

  it("preserves measure bars in a turnaround line", () => {
    const row = [
      w("|", 10, 20),
      w("G", 30, 20),
      w("D/F#", 60, 20),
      w("Em", 120, 20),
      w("D", 170, 20),
      w("|", 200, 20),
      w("C", 220, 20),
      w("D", 260, 20),
      w("|", 300, 20),
    ];
    expect(rowsToChordPro([row])).toBe("| [G] [D/F#] [Em] [D] | [C] [D] |");
  });

  it("converts section headers to comments", () => {
    const out = rowsToChordPro([[w("[Chorus]", 10, 20)]]);
    expect(out).toContain("{comment: Chorus}");
  });
});

describe("normalizeToken", () => {
  it("strips wrapping OCR punctuation but keeps chord characters", () => {
    expect(normalizeToken("«x3")).toBe("x3");
    expect(normalizeToken("(Cadd9)")).toBe("Cadd9");
    expect(normalizeToken("|G")).toBe("G");
    expect(normalizeToken("D/F#")).toBe("D/F#");
    expect(normalizeToken("C#")).toBe("C#");
  });
});

describe("fixLyricOcr (I misread as 1)", () => {
  it("fixes a lone I and word-initial I", () => {
    expect(fixLyricOcr("1")).toBe("I");
    expect(fixLyricOcr("1,")).toBe("I,");
    expect(fixLyricOcr("1f")).toBe("If");
    expect(fixLyricOcr("1t")).toBe("It");
    expect(fixLyricOcr("1've")).toBe("I've");
    expect(fixLyricOcr("1'll")).toBe("I'll");
  });

  it("leaves real numbers and ordinals alone", () => {
    expect(fixLyricOcr("10")).toBe("10");
    expect(fixLyricOcr("1999")).toBe("1999");
    expect(fixLyricOcr("1st")).toBe("1st");
    expect(fixLyricOcr("love")).toBe("love");
  });

  it("corrects lyrics when building a chord line", () => {
    // "I love your hair" with a G over "I" that OCR read as "1".
    const chords = [w("G", 20, 20)];
    const lyric = [w("1", 20, 46), w("love", 45, 46), w("your", 100, 46)];
    expect(rowsToChordPro([chords, lyric])).toBe("[G]I love your");
  });

  it("does not corrupt a section number like Verse 1", () => {
    const out = rowsToChordPro([[w("[Verse", 10, 20), w("1]", 80, 20)]]);
    expect(out).toContain("{comment: Verse 1}");
  });
});

describe("noise tolerance on chord rows", () => {
  it("keeps an intro line as chords despite a misread repeat marker", () => {
    // "G Dsus4 Cadd9 «x3" — the «x3 must not disqualify the chord row.
    const row = [
      w("G", 20, 20),
      w("Dsus4", 60, 20),
      w("Cadd9", 140, 20),
      w("«x3", 230, 20),
    ];
    expect(rowsToChordPro([row])).toBe("[G] [Dsus4] [Cadd9] x3");
  });

  it("brackets a parenthesized chord", () => {
    expect(rowsToChordPro([[w("(Cadd9)", 10, 20)]])).toBe("[Cadd9]");
  });

  it("drops repeat markers when merging chords over a lyric", () => {
    const chords = [w("G", 20, 20), w("x3", 200, 20)];
    const lyric = [w("You", 20, 46), w("look", 70, 46)];
    // x3 is a repeat marker, not a chord — only [G] should be inserted.
    expect(rowsToChordPro([chords, lyric])).toBe("[G]You look");
  });
});

describe("wordsToChordPro end-to-end", () => {
  it("handles a small multi-section snippet", () => {
    const words = [
      w("[Verse]", 10, 10),
      w("G", 60, 40),
      w("Em", 240, 40),
      w("I", 10, 62),
      w("found", 60, 62),
      w("love", 240, 62),
    ];
    const out = wordsToChordPro(words);
    expect(out).toContain("{comment: Verse}");
    expect(out).toContain("[G]found");
    expect(out).toContain("[Em]love");
  });
});
