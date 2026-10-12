import { useEffect } from "react";
import Lenis from "lenis";

// One shared instance so any component can reach the smoother when it needs to
// stop or start scrolling (e.g. an open dialog locking the page).
let lenisInstance: Lenis | undefined;

export function getLenis() {
  return lenisInstance;
}

type UseLenisOptions = {
  /** Scroll animation duration in seconds. */
  duration?: number;
  /** Easing applied to programmatic scrolls (scrollTo, anchor links). */
  easing?: (t: number) => number;
  /** Frame-rate independent smoothing factor, 0..1. Lower = longer glide. */
  lerp?: number;
};

export function useLenis({
  duration = 1.1,
  easing = (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  lerp = 0.1,
}: UseLenisOptions = {}) {
  useEffect(() => {
    // Honour the OS "reduce motion" setting: leave native instant scrolling alone.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Nothing to smooth if the document cannot scroll at all.
    if (document.documentElement.scrollHeight <= window.innerHeight) return;

    const lenis = new Lenis({
      duration,
      easing,
      lerp,
      smoothWheel: true,
      touchMultiplier: 1.6,
      wheelMultiplier: 1,
      gestureOrientation: "vertical",
      autoResize: true,
      autoRaf: true, // Lenis drives its own requestAnimationFrame loop
      anchors: true, // Let in-page #hash links scroll smoothly
    });

    lenisInstance = lenis;

    return () => {
      lenis.destroy();
      lenisInstance = undefined;
    };
  }, [duration, easing, lerp]);
}
