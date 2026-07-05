import { useCallback, useState, type ClipboardEvent, type RefObject } from "react";
import { imageToChordPro, imageFromClipboard } from "@/lib/ocr-run";

export interface OcrPasteState {
  busy: boolean;
  progress: number;
}

/**
 * Paste-a-screenshot-to-ChordPro for a textarea. When the clipboard holds an
 * image, it's OCR'd (chords aligned over lyrics) and inserted at the caret;
 * plain-text pastes fall through untouched. Returns the recognition status and
 * the paste handler to spread onto the textarea.
 */
export function useOcrPaste(
  value: string,
  setValue: (v: string) => void,
  ref: RefObject<HTMLTextAreaElement | null>,
) {
  const [ocr, setOcr] = useState<OcrPasteState>({ busy: false, progress: 0 });

  const insertAtCaret = useCallback(
    (text: string) => {
      const el = ref.current;
      const start = el?.selectionStart ?? value.length;
      const end = el?.selectionEnd ?? value.length;
      const pad = start > 0 && value[start - 1] !== "\n" ? "\n" : "";
      setValue(value.slice(0, start) + pad + text + value.slice(end));
    },
    [value, setValue, ref],
  );

  const handlePaste = useCallback(
    async (e: ClipboardEvent<HTMLTextAreaElement>) => {
      const image = imageFromClipboard(e.clipboardData?.items);
      if (!image) return; // let normal text paste happen
      e.preventDefault();
      setOcr({ busy: true, progress: 0 });
      try {
        const chordpro = await imageToChordPro(image, (progress) =>
          setOcr({ busy: true, progress }),
        );
        insertAtCaret(chordpro);
      } finally {
        setOcr({ busy: false, progress: 0 });
      }
    },
    [insertAtCaret],
  );

  return { ocr, handlePaste };
}
