"use client";

import { useCallback, useEffect, useState } from "react";
import { subscribeMirror } from "@/lib/mirror-bus";
import { useSync } from "@/components/offline/sync-provider";

/**
 * Local-first read: resolve `read` from IndexedDB immediately (~ms, no
 * network), kick a throttled background sync, and re-read whenever the
 * mirror changes. `read` must be referentially stable (module-level fn).
 * Returns null until the first read resolves.
 */
export function useMirror<T>(read: () => Promise<T>): T | null {
  const [data, setData] = useState<T | null>(null);
  const { syncNow } = useSync();

  const load = useCallback(() => {
    read()
      .then(setData)
      .catch(() => {});
  }, [read]);

  useEffect(() => {
    load();
    syncNow();
    return subscribeMirror(load);
  }, [load, syncNow]);

  return data;
}
