"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import type { Group } from "three";
import type { PublicProject } from "@/app/components/projects/types";
import RingAtmosphere from "./RingAtmosphere";
import RingHintBar from "./RingHintBar";
import RingPagination from "./RingPagination";
import RingSidePanel from "./RingSidePanel";
import { useRingRotation3D } from "./useRingRotation3D";
import { useReducedMotion } from "../shared/hooks/useReducedMotion";
import { useTheme } from "@/app/lib/themeContext";

// WebGL needs a real browser — dynamic + ssr:false matches every other 3D
// component in this codebase (CarShowcase, ThreeBackground, About's
// ThreeScene).
const RingCanvas = dynamic(() => import("./RingCanvas"), { ssr: false, loading: () => null });

// Slowed slightly from 3 — a more deliberate, premium pace that gives each
// card longer in view as it passes front instead of hurrying through.
const AUTO_ROTATE_DEG_PER_SEC = 2.3;
const RESUME_DELAY_MS = 2600;
// Beat between the ring finishing its snap-to-front rotation and the modal
// fading in — reads as "the card arrives, then opens" rather than a single
// abrupt cut.
const MODAL_OPEN_DELAY_MS = 220;

/** Coarse heuristic reused verbatim from CarShowcase/ThreeBackground: low
 * core count + narrow viewport skips full quality (lower dpr, softer
 * shadows) rather than the 3D scene entirely — this ring *is* the page's
 * hero content, not a decorative extra, so it always renders. */
function useLowPowerDevice() {
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

// A sparse ring (a handful of real projects) reads as broken — this cycles
// through whatever's available to fill a visually full circle, the dynamic
// equivalent of the old hardcoded data/ring.ts padding array. Once there
// are MIN_RING_SIZE+ real projects, every card is unique and this is a
// no-op.
const MIN_RING_SIZE = 12;

export default function ProjectsRing({ projects }: { projects: PublicProject[] }) {
  const cards = useMemo<PublicProject[]>(() => {
    if (projects.length === 0 || projects.length >= MIN_RING_SIZE) return projects;
    return Array.from({ length: MIN_RING_SIZE }, (_, i) => projects[i % projects.length]);
  }, [projects]);
  const count = cards.length;

  const containerRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<Group>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isPending, setIsPending] = useState(false);

  const reducedMotion = useReducedMotion();
  const lowPower = useLowPowerDevice();
  const { theme } = useTheme();

  useEffect(() => {
    return () => {
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
    };
  }, []);

  const { bind, rotateToIndex, stepFocus, consumeDidDrag, markInteraction, activeIndex } = useRingRotation3D({
    cardCount: count,
    containerRef,
    groupRef,
    autoRotateSpeed: AUTO_ROTATE_DEG_PER_SEC,
    resumeDelayMs: RESUME_DELAY_MS,
    paused: selectedIndex !== null || isPending,
    reducedMotion,
  });

  const handleActivate = useCallback(
    (index: number) => {
      triggerElementRef.current = document.activeElement as HTMLElement | null;
      setIsPending(true);
      markInteraction();
      rotateToIndex(index, () => {
        openTimeoutRef.current = setTimeout(() => {
          setIsPending(false);
          setSelectedIndex(index);
        }, MODAL_OPEN_DELAY_MS);
      });
    },
    [rotateToIndex, markInteraction]
  );

  const handleClose = useCallback(() => {
    setSelectedIndex(null);
    markInteraction();
    triggerElementRef.current?.focus?.();
  }, [markInteraction]);

  // Panel prev/next — unlike handleActivate's "ring arrives, then panel
  // opens" beat (a deliberate first-open flourish), stepping through an
  // already-open panel swaps content immediately while the ring catches
  // up in parallel, which reads as snappier for repeated browsing.
  const handleStep = useCallback(
    (direction: 1 | -1) => {
      setSelectedIndex((current) => {
        if (current === null || count === 0) return current;
        const next = (current + direction + count) % count;
        markInteraction();
        rotateToIndex(next);
        return next;
      });
    },
    [count, rotateToIndex, markInteraction]
  );

  // Dots are a plain carousel position indicator — clicking one rotates
  // the ring to face that card without opening the detail panel, distinct
  // from clicking a card (handleActivate) which does both.
  const handleDotSelect = useCallback(
    (index: number) => {
      markInteraction();
      rotateToIndex(index);
    },
    [rotateToIndex, markInteraction]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (selectedIndex !== null) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        markInteraction();
        stepFocus(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        markInteraction();
        stepFocus(-1);
      }
    },
    [stepFocus, selectedIndex, markInteraction]
  );

  const selectedProject = selectedIndex !== null ? cards[selectedIndex] : null;

  if (count === 0) return null;

  return (
    <section
      aria-label="Featured projects — rotating showcase"
      className="relative flex h-[calc(60vh+3rem)] w-full select-none flex-col overflow-hidden bg-noir-bg pb-12 sm:h-[calc(54vh+4rem)] sm:pb-16"
    >
      {/* Cinematic backdrop — fog, light beams, stars/dust, an ambient wash
          tinted by the nav's current theme accent (paired with white),
          vignette, film grain. Purely decorative (see RingAtmosphere.tsx);
          the ring's own canvas alpha:true background lets it show through
          exactly like the plain glow divs it replaced. */}
      <RingAtmosphere accentHex={theme.base} accentLightHex={theme.light} />

      {/* Cleared below the fixed top nav (h-15 + z-99999, see app/layout.tsx)
          which floats over every page's content rather than pushing it
          down — this label needs real clearance since, unlike the ring's
          decorative visuals, it's text meant to be read. */}
      <span className="relative z-10 mb-6 flex shrink-0 items-center justify-center gap-3 pt-20 text-xs font-bold uppercase tracking-[0.4em] text-noir-gold sm:mb-6 sm:pt-24">
        <span className="h-1 w-1 rounded-full bg-noir-gold" />
        Latest Project
        <span className="h-1 w-1 rounded-full bg-noir-gold" />
      </span>

      <RingHintBar />

      <div
        ref={containerRef}
        {...bind}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label="Rotating project ring — drag, scroll, or use arrow keys to rotate, click a card to view it"
        className="relative min-h-0 w-full flex-1 touch-pan-y outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-noir-gold-bright"
        style={{
          cursor: "grab",
          WebkitBoxReflect: "below -90px linear-gradient(to bottom, rgba(255,255,255,0.24), rgba(255,255,255,0) 82%)",
        } as React.CSSProperties}
      >
        <RingCanvas
          cards={cards}
          groupRef={groupRef}
          selectedIndex={selectedIndex}
          onActivate={handleActivate}
          consumeDidDrag={consumeDidDrag}
          accentHex={theme.base}
          accentLightHex={theme.light}
          lowPower={lowPower}
        />
      </div>

      <RingPagination count={count} activeIndex={selectedIndex ?? activeIndex} onSelect={handleDotSelect} />

      <AnimatePresence>
        {selectedProject && (
          <RingSidePanel
            project={selectedProject}
            index={selectedIndex ?? 0}
            total={count}
            onClose={handleClose}
            onPrev={() => handleStep(-1)}
            onNext={() => handleStep(1)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
