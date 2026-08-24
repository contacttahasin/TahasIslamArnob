"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "../shared/hooks/useReducedMotion";

const MoonCanvas = dynamic(() => import("./MoonCanvas"), {
  ssr: false,
  loading: () => null,
});

/** Coarse heuristic: low core count + narrow viewport renders a lighter globe. */
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

export default function Moon() {
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
    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 400));
    const cic = window.cancelIdleCallback ?? window.clearTimeout;
    const id = ric(() => setIdle(true));
    return () => cic(id);
  }, []);

  const canRender3D = inView && idle && !reducedMotion;

  return (
    <div
      ref={containerRef}
      className="relative mx-auto aspect-square w-full max-w-xl overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 rounded-full bg-noir-ink/5 blur-[100px]" />
      {canRender3D ? (
        <Suspense fallback={<MoonFallback />}>
          <MoonCanvas lowPower={lowPower} />
        </Suspense>
      ) : (
        <MoonFallback />
      )}
    </div>
  );
}

function MoonFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-2/3 w-2/3 animate-pulse rounded-full bg-linear-to-br from-noir-ink/20 via-noir-gold/10 to-transparent blur-2xl" />
    </div>
  );
}
