import { useEffect, useState, type RefObject } from "react";

/**
 * Smoothly auto-scroll a container at `speed` px/second so a performer can keep
 * both hands on their instrument. Owns the on/off state; stops itself at the
 * bottom. Returns controls the UI can bind to a play/pause button.
 */
export function useAutoScroll(
  ref: RefObject<HTMLElement | null>,
  speed: number,
) {
  const [scrolling, setScrolling] = useState(false);

  useEffect(() => {
    if (!scrolling) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let prev = performance.now();
    let remainder = 0;

    function step(now: number) {
      remainder += (speed * (now - prev)) / 1000;
      prev = now;
      const whole = Math.floor(remainder);
      if (whole > 0) {
        el!.scrollTop += whole;
        remainder -= whole;
      }
      if (el!.scrollTop + el!.clientHeight >= el!.scrollHeight - 1) {
        setScrolling(false); // reached the end
        return;
      }
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [scrolling, speed, ref]);

  return { scrolling, setScrolling };
}
