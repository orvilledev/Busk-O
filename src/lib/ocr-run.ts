import { preprocessForOcr } from "./ocr-image";
import {
  capitalizeFirstLyricLetter,
  wordsToChordPro,
  type OcrWord,
} from "./ocr-chords";

/**
 * Client-side OCR: an image → aligned ChordPro. Shared by the import page and
 * the song editor's paste handler. Lazily loads tesseract.js so it only ships
 * to users who actually run OCR.
 */

interface TesseractWord {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}
interface TesseractBlock {
  paragraphs: { lines: { words: TesseractWord[] }[] }[];
}

/** Flatten Tesseract's block tree into flat words with coordinates. */
function flattenWords(blocks: TesseractBlock[] | null | undefined): OcrWord[] {
  const words: OcrWord[] = [];
  for (const block of blocks ?? []) {
    for (const para of block.paragraphs ?? []) {
      for (const line of para.lines ?? []) {
        for (const wd of line.words ?? []) {
          const t = wd.text?.trim();
          if (t) {
            words.push({
              text: t,
              x0: wd.bbox.x0,
              y0: wd.bbox.y0,
              x1: wd.bbox.x1,
              y1: wd.bbox.y1,
            });
          }
        }
      }
    }
  }
  return words;
}

/**
 * Recognize a chords-over-lyrics image and return ChordPro. Uses word bounding
 * boxes to place chords over the right syllables; falls back to raw text if no
 * boxes come back. `onProgress` receives 0–100 during recognition.
 */
export async function imageToChordPro(
  source: Blob,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const prepped = await preprocessForOcr(source);

  const worker = await createWorker("eng", 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") onProgress?.(Math.round(m.progress * 100));
    },
  });
  await worker.setParameters({ preserve_interword_spaces: "1" });
  const { data } = await worker.recognize(prepped, {}, { blocks: true, text: true });
  await worker.terminate();

  const words = flattenWords(data.blocks as TesseractBlock[] | null);
  if (words.length > 0) return wordsToChordPro(words);

  // No word boxes came back — fall back to raw recognized text, still
  // capitalizing each line's first letter for consistency.
  return data.text
    .trim()
    .split("\n")
    .map(capitalizeFirstLyricLetter)
    .join("\n");
}

/** Pull the first image out of a paste/drop, if any. */
export function imageFromClipboard(
  items: DataTransferItemList | undefined,
): File | null {
  if (!items) return null;
  for (const item of items) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) return file;
    }
  }
  return null;
}
