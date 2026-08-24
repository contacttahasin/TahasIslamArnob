"use client";

import { useEffect, useState } from "react";

export type FontSizeRule = { minWidth: number; vw?: number; px?: number };

const resolve = (rules: readonly FontSizeRule[], width: number): number => {
  const sorted = [...rules].sort((a, b) => a.minWidth - b.minWidth);
  let active = sorted[0];
  for (const rule of sorted) {
    if (width >= rule.minWidth) active = rule;
  }
  return active.px ?? ((active.vw ?? 0) / 100) * width;
};

/**
 * Mirrors a Tailwind arbitrary-vw + breakpoint-px stack (e.g.
 * `text-[9vw] md:text-[4.4vw] lg:text-[3.2vw]`) as a plain px number, for
 * components (StrokeText/DepthText) that take a numeric fontSize instead
 * of a CSS value. `rules` should be a module-level constant — a new array
 * identity every render would re-trigger the resize listener for nothing.
 */
export function useResponsiveFontSize(rules: readonly FontSizeRule[], fallbackPx: number) {
  const [fontSize, setFontSize] = useState(() =>
    typeof window === "undefined" ? fallbackPx : resolve(rules, window.innerWidth)
  );

  useEffect(() => {
    const compute = () => setFontSize(resolve(rules, window.innerWidth));
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rules]);

  return fontSize;
}
