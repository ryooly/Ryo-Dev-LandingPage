import { useEffect } from "react";
import Lenis from "lenis";

let lenisInstance: Lenis | undefined;

export function getLenis() {
  return lenisInstance;
}

const defaultEasing = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

type UseLenisOptions = {
  wrapper?: HTMLElement | null;

  duration?: number;

  easing?: (t: number) => number;

  lerp?: number;
};

export function useLenis({
  wrapper = null,
  duration,
  easing = defaultEasing,
  lerp = 0.1,
}: UseLenisOptions = {}) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const scroller = wrapper ?? document.documentElement;
    const viewport = wrapper ? wrapper.clientHeight : window.innerHeight;

    if (scroller.scrollHeight <= viewport) return;

    const lenis = new Lenis({
      ...(wrapper ? { wrapper, content: wrapper.firstElementChild ?? wrapper } : {}),
      ...(duration === undefined ? { lerp } : { duration, easing }),
      smoothWheel: true,
      touchMultiplier: 1.6,
      wheelMultiplier: 1,
      gestureOrientation: "vertical",
      autoResize: true,
      autoRaf: true,
      anchors: !wrapper,
    });

    lenisInstance = lenis;

    return () => {
      lenis.destroy();
      if (lenisInstance === lenis) lenisInstance = undefined;
    };
  }, [wrapper, duration, easing, lerp]);
}
