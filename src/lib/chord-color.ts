/**
 * User-selectable chord color. Chords render with `var(--chord)`, so switching
 * the preference just overrides that custom property on the document root and
 * every chord on screen updates live. The choice is saved to localStorage and
 * re-applied before paint by a small inline script in the root layout.
 */

export type ChordColorId = "amber" | "blue" | "rose";

export interface ChordColor {
  id: ChordColorId;
  label: string;
  value: string;
}

/** The three presets: the original amber, a blue, and a pink-red. */
export const CHORD_COLORS: readonly ChordColor[] = [
  { id: "amber", label: "Amber", value: "#f59e0b" },
  { id: "blue", label: "Blue", value: "#60a5fa" },
  { id: "rose", label: "Pink-red", value: "#fb7185" },
];

export const DEFAULT_CHORD_COLOR: ChordColorId = "amber";

/** localStorage key — kept in sync with the inline script in the root layout. */
export const CHORD_COLOR_KEY = "busko:chord-color";

export function chordColorValue(id: string): string {
  return (CHORD_COLORS.find((c) => c.id === id) ?? CHORD_COLORS[0]).value;
}

/** The saved preference, or the default when unset/invalid. */
export function getSavedChordColor(): ChordColorId {
  if (typeof window === "undefined") return DEFAULT_CHORD_COLOR;
  const v = window.localStorage.getItem(CHORD_COLOR_KEY);
  return CHORD_COLORS.some((c) => c.id === v)
    ? (v as ChordColorId)
    : DEFAULT_CHORD_COLOR;
}

/** In-tab subscribers — the `storage` event only fires in *other* tabs. */
const listeners = new Set<() => void>();

/** Subscribe to chord-color changes (this tab + other tabs). For useSyncExternalStore. */
export function subscribeChordColor(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  listeners.add(callback);
  return () => {
    window.removeEventListener("storage", callback);
    listeners.delete(callback);
  };
}

/** Apply a chord color everywhere and remember it. */
export function applyChordColor(id: ChordColorId): void {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--chord", chordColorValue(id));
  try {
    window.localStorage.setItem(CHORD_COLOR_KEY, id);
  } catch {
    // Ignore storage failures (private mode, quota) — the color still applies.
  }
  listeners.forEach((l) => l());
}
