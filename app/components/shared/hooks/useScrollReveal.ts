"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type BuildFn = (tl: gsap.core.Timeline) => void;
type IdleFn = (ctx: gsap.Context) => void;

type UseScrollRevealOptions = {
  start?: string;
  once?: boolean;
  /**
   * Runs only after the entrance timeline fully completes, wrapped in
   * `ctx.add()` so it's tracked for cleanup on unmount. Use this for any
   * continuous idle animation (floats, loops, marquees driven by GSAP).
   *
   * Starting an idle tween unconditionally alongside the entrance timeline
   * makes both fight over the same transform property and produces garbage
   * intermediate values — this was a real bug (cards clipping their own
   * container) fixed twice on the home page before this hook existed.
   */
  idle?: IdleFn;
};

/**
 * Standardizes the GSAP `gsap.context()` + ScrollTrigger entrance-reveal
 * pattern used across the site (fade + blur + translateY, once-fired on
 * scroll into view). Pass a `build` callback to add tweens to `tl`.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  build: BuildFn,
  { start = "top 75%", once = true, idle }: UseScrollRevealOptions = {}
) {
  const sectionRef = useRef<T>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start,
          toggleActions: "play none none none",
          once,
        },
        onComplete: idle
          ? () => {
              ctx.add(() => idle(ctx));
            }
          : undefined,
      });

      build(tl);
    }, sectionRef);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return sectionRef;
}
