"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "../shared/hooks/useReducedMotion";

const ThreeBackgroundCanvas = dynamic(() => import("./ThreeBackgroundCanvas"), {
  ssr: false,
  loading: () => null,
});

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

/**
 * Ambient decorative backdrop for the Projects hero. Absolutely positioned,
 * pointer-events-none.
 *
 * Unlike About's ThreeScene (deep in the page, genuinely off-screen on
 * load), this sits in the hero itself — so a plain IntersectionObserver
 * reports it "in view" immediately on page load, fetching the Three.js
 * chunk right away and contending with the critical hero text for initial
 * load resources. Gating on browser idle time (in addition to intersection)
 * lets the hero content paint first; the backdrop pops in a beat later.
 */
export default function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [idle, setIdle] = useState(false);
  const reducedMotion = useReducedMotion();
  const lowPower = useLowPowerDevice();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 800));
    const cic = window.cancelIdleCallback ?? window.clearTimeout;
    const id = ric(() => setIdle(true));
    return () => cic(id);
  }, []);

  const canRender3D = inView && idle && !reducedMotion && !lowPower;

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {canRender3D && (
        <Suspense fallback={null}>
          <ThreeBackgroundCanvas />
        </Suspense>
      )}
    </div>
  );
}
