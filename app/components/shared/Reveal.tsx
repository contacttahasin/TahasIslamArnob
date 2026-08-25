"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Animate the direct children in sequence instead of the block itself. */
  stagger?: number;
  /** Travel distance in px; negative comes from above. */
  y?: number;
  x?: number;
  delay?: number;
  duration?: number;
  start?: string;
};

/**
 * The site's standard scroll entrance — fade + travel + a touch of blur —
 * as a wrapper, for the blocks that were still appearing with no transition
 * at all (project cards, vlog cards, page intros).
 *
 * With `stagger`, the direct children are animated one after another; the
 * grid itself never moves, so nothing reflows while the cards arrive.
 */
export default function Reveal({
  children,
  as: Tag = "div",
  className,
  stagger,
  y = 28,
  x = 0,
  delay = 0,
  duration = 0.8,
  start = "top 85%",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const targets = stagger ? Array.from(el.children) : el;
      if (stagger && !(targets as Element[]).length) return;

      gsap.from(targets, {
        y,
        x,
        opacity: 0,
        filter: "blur(8px)",
        duration,
        delay,
        stagger,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start, once: true },
      });
    },
    { scope: ref, dependencies: [stagger, y, x, delay, duration, start] }
  );

  /** ElementType on its own narrows the ref/className props to `never`. */
  const Component = Tag as "div";

  return (
    <Component ref={ref as React.Ref<HTMLDivElement>} className={cn(className)}>
      {children}
    </Component>
  );
}
