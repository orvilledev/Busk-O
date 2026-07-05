import { useEffect } from "react";

/**
 * Hold a Screen Wake Lock while `active`, re-acquiring it when the tab becomes
 * visible again (browsers drop the lock on tab switch). Fails quietly where the
 * API is unavailable. Used by stage/performance views so the phone won't sleep.
 */
export function useWakeLock(active = true) {
  useEffect(() => {
    if (!active) return;

    let lock: WakeLockSentinel | null = null;
    let released = false;

    async function acquire() {
      try {
        if ("wakeLock" in navigator) {
          lock = await navigator.wakeLock.request("screen");
        }
      } catch {
        // Denied or unsupported — nothing we can do, fail quietly.
      }
    }
    acquire();

    function onVisible() {
      if (document.visibilityState === "visible" && !released) acquire();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, [active]);
}
