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
 * Where the pinned stack is used. The width floor keeps phones and tablets
 * on the flowing layout; the height floor keeps a short desktop window from
 * pinning panels it cannot show; reduced motion opts out of the scrub.
 *
 * Every layout rule that depends on the stack is written against this same
 * string rather than a Tailwind breakpoint, and that is the point: a
 * viewport that laid the panels out on top of each other but never animated
 * them would show all three in one spot. One query drives the CSS and the
 * timeline together, so the two cannot drift apart. `WorkTimeline` imports
 * it for the same reason -- its `compact` mode exists only for this stack.
 */
export const PIN_QUERY =
  "(min-width: 1024px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)";

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
 *
 * The stack is a desktop-only treatment. Each panel is exactly one viewport
 * tall and clips whatever runs past it, which a phone viewport cannot hold:
 * the panels carry real sections (a career timeline, a commit graph, a team
 * grid) that are 1.2-2 viewports tall at 390px wide, so the pinned version
 * on a phone showed every panel sheared off mid-content. Outside PIN_QUERY
 * the panels are plain stacked sections at their natural height and nothing
 * is pinned or clipped.
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

      const mm = gsap.matchMedia();

      // Everything below is desktop-only. Outside PIN_QUERY the panels are
      // static stacked sections, so no transform is ever set on them -- and
      // it matters that none is: matchMedia reverts these `gsap.set` calls
      // when the query stops matching, but a transform written outside it
      // would survive a resize and leave a panel translated off its own
      // section, which is exactly the phone bug this guards against.
      mm.add(PIN_QUERY, () => {
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
      });

      return () => mm.revert();
    },
    { scope: container }
  );

  return (
    <div ref={container} className={cn("stack-root relative w-full", className)}>
      <div
        className={cn("stack-frame relative mx-auto w-full max-w-7xl", containerClassName)}
      >
        {panels.map((panel, i) => (
          <div
            key={i}
            ref={(el) => {
              panelRefs.current[i] = el;
            }}
            className={cn("stack-panel relative w-full bg-bg-primary", panelClassName)}
          >
            {panel}
          </div>
        ))}
      </div>

      {/* Outside PIN_QUERY every rule here is off, which leaves the three
          divs above as plain nested blocks: no viewport height, no clipping,
          no absolute positioning, so each panel is as tall as its section. */}
      <style jsx>{`
        @media ${PIN_QUERY} {
          .stack-root {
            height: 100vh;
            overflow: hidden;
          }
          .stack-frame {
            height: 100%;
            overflow: hidden;
            border-radius: 1.5rem;
          }
          .stack-panel {
            position: absolute;
            inset: 0;
            height: 100%;
            overflow: hidden;
            border-radius: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
