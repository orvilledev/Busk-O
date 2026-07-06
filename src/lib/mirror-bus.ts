/**
 * Tiny pub/sub for "the local mirror changed" — lets list screens re-read
 * IndexedDB the moment a sync or local patch lands, without prop drilling.
 */

type Listener = () => void;

const listeners = new Set<Listener>();

export function subscribeMirror(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitMirrorUpdated(): void {
  for (const fn of listeners) fn();
}
