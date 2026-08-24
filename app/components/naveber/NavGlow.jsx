"use client";

import { useEffect, useRef } from "react";

/** Distance (px) over which the glow ramps from its resting state to full. */
const RAMP = 420;

/**
 * Light-spill backdrop for the fixed navbar — a soft accent-tinted glow
 * that sits behind the bar and bleeds downward onto the page, plus a thin
 * lit edge along the bottom. Both strengthen and drift as the page
 * scrolls, so the bar reads as a lamp the content passes under rather
 * than a flat strip.
 *
 * Scroll is written straight to CSS custom properties on this element
 * (inside a rAF, passive listener) instead of React state — nothing here
 * needs to re-render, and every animated property is opacity/transform so
 * it stays on the compositor. Colors come from --accent-rgb, the same var
 * the navbar's own ThemePicker writes to <html>, so the glow re-tints
 * live with the picked theme.
 */
export default function NavGlow() {
  const rootRef = useRef(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = null;

    const apply = () => {
      frame = null;
      const progress = Math.min(window.scrollY / RAMP, 1);
      // Eased so the first bit of scroll is felt immediately and the top
      // end settles instead of snapping.
      const eased = 1 - Math.pow(1 - progress, 2);
      el.style.setProperty("--nav-glow", String(0.35 + eased * 0.65));
      el.style.setProperty("--nav-glow-shift", `${eased * 14}px`);
      // A slow lateral drift, so the light looks like it is moving over
      // the page rather than just brightening in place.
      el.style.setProperty("--nav-glow-x", `${Math.sin(progress * Math.PI) * 8}%`);
    };

    const onScroll = () => {
      if (reduced || frame !== null) return;
      frame = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-visible"
      style={{ "--nav-glow": 0.35, "--nav-glow-shift": "0px", "--nav-glow-x": "0%" }}
    >
      {/* Main spill — a wide, very soft ellipse hanging below the bar. */}
      <div
        className="absolute left-1/2 top-0 h-40 w-[140%] -translate-x-1/2 blur-3xl transition-opacity duration-300"
        style={{
          opacity: "var(--nav-glow)",
          transform: "translate3d(calc(-50% + var(--nav-glow-x)), var(--nav-glow-shift), 0)",
          background:
            "radial-gradient(60% 100% at 50% 0%, rgba(var(--accent-rgb), 0.5), rgba(var(--accent-rgb), 0.12) 45%, transparent 75%)",
        }}
      />

      {/* Tighter core right under the bar, so the falloff isn't uniform. */}
      <div
        className="absolute left-1/2 top-0 h-20 w-[70%] -translate-x-1/2 blur-2xl"
        style={{
          opacity: "calc(var(--nav-glow) * 0.7)",
          background:
            "radial-gradient(50% 100% at 50% 0%, rgba(var(--accent-rgb), 0.45), transparent 70%)",
        }}
      />

      {/* Lit bottom edge — the lamp's own rim. */}
      <div
        className="absolute inset-x-0 top-15 h-px"
        style={{
          opacity: "var(--nav-glow)",
          background:
            "linear-gradient(90deg, transparent, rgba(var(--accent-rgb), 0.55), transparent)",
        }}
      />
    </div>
  );
}
