"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * One Lenis instance for the whole public site.
 *
 * It used to live inside DroneScrollHero, which meant smooth scrolling was
 * a home-page-only effect and every other page fell back to native scroll.
 * Mounted here instead, in the site layout, so About / Projects / Vlog /
 * Contact get the same feel — and so there is still only ever ONE instance:
 * two of them fight over the same scroll position and produce stutter.
 *
 * Lenis drives the scroll from a rAF loop, so ScrollTrigger has to be told
 * to update from that loop rather than from the native scroll event, or
 * every pinned section on the site lags a frame behind the content.
 */
export default function SmoothScroll() {
  useEffect(() => {
    // Someone who asked for less motion gets the browser's own scrolling.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      // Trails the real scroll position just enough to read as weight
      // without feeling detached from the wheel.
      lerp: 0.1,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    // GSAP's lag smoothing pauses the ticker after a long frame, which
    // would freeze Lenis mid-scroll.
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.refresh();

    return () => {
      lenis.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
