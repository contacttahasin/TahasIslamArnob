"use client";

import { Children, useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { cn } from "@/lib/utils";

type StickyCardsProps = {
  /** One panel per child. Each is stacked in place and revealed in order. */
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  panelClassName?: string;
};

/**
 * Pinned card stack: the section pins to the viewport and each panel slides
 * up over the previous one, which shrinks and tilts back as it goes.
 *
 * Adapted from the Skiper "StickyCard002" pattern in two ways that matter:
 *
 * - It stacks arbitrary children rather than `<img>` elements, so whole
 *   sections can be the cards.
 * - The original wrapped itself in `<ReactLenis root>` and, on cleanup, ran
 *   `ScrollTrigger.getAll().forEach(t => t.kill())`. Both are unsafe here:
 *   this page already runs a single Lenis instance (DroneScrollHero), and a
 *   second root instance fights it over the same scroll; and killing *every*
 *   ScrollTrigger would take out the scroll reveals belonging to unrelated
 *   sections. Only this timeline's own trigger is killed below.
 */
export default function StickyCards({
  children,
  className,
  containerClassName,
  panelClassName,
}: StickyCardsProps) {
  const container = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const panels = Children.toArray(children);

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);

      const els = panelRefs.current.filter(Boolean) as HTMLDivElement[];
      const total = els.length;
      if (total < 2) return;

      // First panel already in place; the rest wait just below the frame.
      gsap.set(els[0], { yPercent: 0, scale: 1, rotation: 0 });
      for (let i = 1; i < total; i++) {
        gsap.set(els[i], { yPercent: 100, scale: 1, rotation: 0 });
      }

      const scrollTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: container.current,
          start: "top top",
          // One viewport of scroll per hand-off.
          end: () => `+=${window.innerHeight * (total - 1)}`,
          pin: true,
          scrub: 0.5,
          pinSpacing: true,
          invalidateOnRefresh: true,
        },
      });

      for (let i = 0; i < total - 1; i++) {
        scrollTimeline.to(els[i], { scale: 0.7, rotation: 5, duration: 1, ease: "none" }, i);
        scrollTimeline.to(els[i + 1], { yPercent: 0, duration: 1, ease: "none" }, i);
      }

      // The panels hold real sections whose height can settle late (fonts,
      // images), which would leave the pin measured against a stale height.
      const resizeObserver = new ResizeObserver(() => ScrollTrigger.refresh());
      if (container.current) resizeObserver.observe(container.current);

      return () => {
        resizeObserver.disconnect();
        scrollTimeline.scrollTrigger?.kill();
        scrollTimeline.kill();
      };
    },
    { scope: container }
  );

  return (
    <div ref={container} className={cn("relative h-screen w-full overflow-hidden", className)}>
      <div
        className={cn(
          "relative mx-auto h-full w-full max-w-7xl overflow-hidden rounded-3xl",
          containerClassName
        )}
      >
        {panels.map((panel, i) => (
          <div
            key={i}
            ref={(el) => {
              panelRefs.current[i] = el;
            }}
            className={cn(
              "absolute inset-0 h-full w-full overflow-hidden rounded-3xl bg-bg-primary",
              panelClassName
            )}
          >
            {panel}
          </div>
        ))}
      </div>
    </div>
  );
}
