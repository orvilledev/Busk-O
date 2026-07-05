"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { getOutbox } from "@/lib/db";
import { sync } from "@/lib/sync";

type SyncState = "idle" | "syncing" | "offline" | "error";

interface SyncContextValue {
  online: boolean;
  state: SyncState;
  pending: number;
  /** Force a flush + pull now. */
  syncNow: () => void;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSync must be used within <SyncProvider>");
  return ctx;
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(true);
  const [state, setState] = useState<SyncState>("idle");
  const [pending, setPending] = useState(0);
  const running = useRef(false);

  const refreshPending = useCallback(async () => {
    try {
      setPending((await getOutbox()).length);
    } catch {
      /* idb unavailable (e.g. SSR) — ignore */
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (running.current || typeof navigator === "undefined") return;
    if (!navigator.onLine) {
      setState("offline");
      return;
    }
    running.current = true;
    setState("syncing");
    try {
      await sync(createClient());
      setState("idle");
    } catch {
      setState("error");
    } finally {
      running.current = false;
      await refreshPending();
    }
  }, [refreshPending]);

  useEffect(() => {
    // Deferred so we don't setState synchronously inside the effect body.
    const init = setTimeout(() => {
      setOnline(navigator.onLine);
      refreshPending();
      if (navigator.onLine) syncNow();
      else setState("offline");
    }, 0);

    const onOnline = () => {
      setOnline(true);
      syncNow();
    };
    const onOffline = () => {
      setOnline(false);
      setState("offline");
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      clearTimeout(init);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [syncNow, refreshPending]);

  return (
    <SyncContext.Provider value={{ online, state, pending, syncNow }}>
      {children}
    </SyncContext.Provider>
  );
}
