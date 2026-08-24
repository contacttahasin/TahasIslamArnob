"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../shared/hooks/useReducedMotion";
import { hexToRgbString } from "@/app/lib/color";

// A tiled feTurbulence noise tile, inlined as an SVG data URI rather than a
// binary asset — keeps the grain self-contained (no network request, no new
// file in /public) and small enough that it costs nothing to inline.
const RING_GRAIN_DATA_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.4 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

type Star = { x: number; y: number; r: number; base: number; amp: number; speed: number; phase: number };
type Dust = { x: number; y: number; vx: number; vy: number; r: number; o: number; accent: boolean };

const STAR_COUNT_FULL = 55;
const STAR_COUNT_LOW = 24;
const DUST_COUNT_FULL = 26;
const DUST_COUNT_LOW = 12;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

/** Same coarse heuristic used by ProjectsRing/CarShowcase/ThreeBackground —
 * duplicated locally (a few lines) rather than threaded in as a prop, so
 * this component stays a self-contained drop-in. */
function useAtmosphereLowPower() {
  const [lowPower, setLowPower] = useState(false);
  /* eslint-disable react-hooks/set-state-in-effect --
   * one-time post-hydration correction of an SSR-unavailable value
   * (navigator/window), not a derived sync loop. */
  useEffect(() => {
    const cores = navigator.hardwareConcurrency ?? 4;
    const narrow = window.innerWidth < 640;
    setLowPower(cores <= 4 && narrow);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */
  return lowPower;
}

/**
 * Canvas2D star + dust particle field — deliberately not another R3F scene.
 * This codebase has repeatedly hit black-canvas issues with drei's
 * Sparkles/postprocessing (see RingLights.tsx, ThreeBackgroundCanvas.tsx);
 * a few dozen small circles on a plain 2D canvas gets the same "tiny
 * floating particles + subtle stars" result with none of that risk and a
 * fraction of the GPU cost — cheap enough to run every frame on mobile.
 */
function RingParticleField({
  reducedMotion,
  lowPower,
  accentRgb,
}: {
  reducedMotion: boolean;
  lowPower: boolean;
  accentRgb: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.5);
    let width = 0;
    let height = 0;

    const resize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const starCount = lowPower ? STAR_COUNT_LOW : STAR_COUNT_FULL;
    const dustCount = lowPower ? DUST_COUNT_LOW : DUST_COUNT_FULL;

    const stars: Star[] = Array.from({ length: starCount }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: rand(0.5, 1.4),
      base: rand(0.15, 0.35),
      amp: rand(0.15, 0.35),
      speed: rand(0.4, 1.1),
      phase: rand(0, Math.PI * 2),
    }));

    const dust: Dust[] = Array.from({ length: dustCount }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: rand(-0.008, 0.008),
      vy: rand(-0.006, 0.006),
      r: rand(0.7, 1.8),
      o: rand(0.15, 0.4),
      accent: Math.random() > 0.5,
    }));

    let raf = 0;
    let visible = !document.hidden;

    const draw = (tSec: number) => {
      ctx.clearRect(0, 0, width, height);

      for (const s of stars) {
        const flicker = reducedMotion ? 0 : Math.sin(tSec * s.speed + s.phase) * s.amp;
        const o = Math.max(0, s.base + flicker);
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${o.toFixed(3)})`;
        ctx.arc(s.x * width, s.y * height, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const d of dust) {
        if (!reducedMotion) {
          d.x += d.vx * 0.01;
          d.y += d.vy * 0.01;
          if (d.x < -0.05) d.x = 1.05;
          if (d.x > 1.05) d.x = -0.05;
          if (d.y < -0.05) d.y = 1.05;
          if (d.y > 1.05) d.y = -0.05;
        }
        ctx.beginPath();
        ctx.fillStyle = d.accent ? `rgba(${accentRgb},${d.o})` : `rgba(255,255,255,${d.o})`;
        ctx.arc(d.x * width, d.y * height, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    if (reducedMotion) {
      draw(0);
    } else {
      const loop = (tMs: number) => {
        if (visible) draw(tMs / 1000);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    const handleVisibility = () => {
      visible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reducedMotion, lowPower, accentRgb]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}

type RingAtmosphereProps = {
  /** The nav's theme picker accent (useTheme().theme.base/.light) — one
   * side of every layer below is tinted from this instead of a fixed blue,
   * so the atmosphere re-colors live when the user switches themes in the
   * nav; the other side stays white, keeping the "ambient blue & white
   * lighting" contrast the spec asked for regardless of which accent is
   * picked. */
  accentHex: string;
  accentLightHex: string;
};

/**
 * Cinematic atmosphere behind the ring showcase — an ambient wash tinted by
 * the site's current nav theme accent (paired with white for contrast),
 * soft drifting fog, volumetric light beams, a starfield + dust, a
 * vignette, and light film grain, all layered under the ring's own canvas.
 * Purely decorative: absolutely positioned and pointer-events-none, meant
 * to be mounted as the first child of ProjectsRing's section so normal DOM
 * stacking order keeps it behind the ring/label without an explicit
 * z-index — it doesn't touch the ring, its rotation, or its modal.
 */
export default function RingAtmosphere({ accentHex, accentLightHex }: RingAtmosphereProps) {
  const reducedMotion = useReducedMotion();
  const lowPower = useAtmosphereLowPower();
  const accentRgb = hexToRgbString(accentHex);
  const accentLightRgb = hexToRgbString(accentLightHex);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Ambient theme-accent/white wash — the base atmosphere color beneath everything else */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(60% 50% at 30% 20%, rgba(${accentRgb},0.16), transparent 65%), radial-gradient(55% 45% at 75% 15%, rgba(255,255,255,0.08), transparent 60%)`,
        }}
      />

      {/* Soft drifting fog — two large blurred blobs, slow independent drift */}
      <div
        className="ring-fog-a absolute left-[10%] top-[15%] h-[70%] w-[55%] rounded-full blur-[60px]"
        style={{
          background: `radial-gradient(circle, rgba(${accentLightRgb},0.18), transparent 70%)`,
          willChange: "transform",
        }}
      />
      <div
        className="ring-fog-b absolute right-[5%] top-[25%] h-[65%] w-[50%] rounded-full blur-[70px]"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.10), transparent 70%)",
          willChange: "transform",
        }}
      />

      {/* Volumetric light beams — narrow blurred wedges, screen-blended so
          they read as light rather than a flat shape on the dark background */}
      <div
        className="ring-beam absolute left-1/3 top-[-10%] h-[130%] w-[18%] mix-blend-screen"
        style={{
          background: `linear-gradient(to bottom, rgba(${accentLightRgb},0.55), rgba(${accentLightRgb},0) 75%)`,
          clipPath: "polygon(45% 0%, 55% 0%, 100% 100%, 0% 100%)",
          filter: "blur(28px)",
          opacity: 0.22,
          willChange: "transform, opacity",
        }}
      />
      <div
        className="ring-beam absolute left-2/3 top-[-10%] h-[130%] w-[14%] mix-blend-screen"
        style={{
          background: "linear-gradient(to bottom, rgba(255,255,255,0.45), rgba(255,255,255,0) 75%)",
          clipPath: "polygon(45% 0%, 55% 0%, 100% 100%, 0% 100%)",
          filter: "blur(24px)",
          opacity: 0.22,
          animationDelay: "-6s",
          willChange: "transform, opacity",
        }}
      />

      {/* Starfield + drifting dust particles */}
      <RingParticleField reducedMotion={reducedMotion} lowPower={lowPower} accentRgb={accentRgb} />

      {/* Soft vignette — darkens the section's own corners so the ring stays the clear focal point */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.45) 100%)",
        }}
      />

      {/* Light film grain — a tiled noise texture, nudged through a few
          stepped positions for a subtle film-flicker read instead of a
          static overlay */}
      <div
        className="ring-grain absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{ backgroundImage: RING_GRAIN_DATA_URI, backgroundRepeat: "repeat" }}
      />
    </div>
  );
}
