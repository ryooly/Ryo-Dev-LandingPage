import { useEffect } from "react";
import Lenis from "lenis";

let lenisInstance: Lenis | undefined;

export function getLenis() {
  return lenisInstance;
}

type UseLenisOptions = {
  duration?: number;

  easing?: (t: number) => number;

  lerp?: number;
};

export function useLenis({
  duration = 1.1,
  easing = (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  lerp = 0.1,
}: UseLenisOptions = {}) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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
      autoRaf: true,
      anchors: true,
    });

    lenisInstance = lenis;

    return () => {
      lenis.destroy();
      lenisInstance = undefined;
    };
  }, [duration, easing, lerp]);
}
