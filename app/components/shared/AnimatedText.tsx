"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

type AnimatedTextProps = {
  children: ReactNode;
  /** Rendered element — headings should stay real headings for a11y/SEO. */
  as?: ElementType;
  className?: string;
  /** "lines" reads as typeset copy; "words" is livelier for short headlines. */
  split?: "lines" | "words" | "chars";
  delay?: number;
  stagger?: number;
  /** ScrollTrigger start position. */
  start?: string;
};

/**
 * Scroll-triggered text reveal built on GSAP SplitText (bundled free since
 * 3.13). Each line/word rides up from behind its own overflow-hidden mask,
 * so the type is revealed by an edge rather than just fading — the same
 * treatment the home hero and WorkTimeline headlines already use, made
 * reusable so every page can have it.
 *
 * SplitText keeps nested inline markup intact, so gradient <span>s inside a
 * headline survive the split. The split is reverted on cleanup, which puts
 * the original DOM (and therefore the original text for screen readers and
 * crawlers) back exactly as it was.
 */
export default function AnimatedText({
  children,
  as: Tag = "div",
  className,
  split = "lines",
  delay = 0,
  stagger = 0.09,
  start = "top 85%",
}: AnimatedTextProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      // Fonts settle late; splitting before they land measures the wrong
      // line boxes and the masks end up cutting through the type.
      const run = () => {
        const instance = SplitText.create(el, {
          type: split === "chars" ? "chars,words,lines" : split === "words" ? "words,lines" : "lines",
          // The mask wrapper is what makes the rise read as a reveal.
          mask: split === "lines" ? "lines" : split === "words" ? "words" : "chars",
          linesClass: "at-line",
          wordsClass: "at-word",
          charsClass: "at-char",
        });

        const targets =
          split === "chars" ? instance.chars : split === "words" ? instance.words : instance.lines;

        gsap.from(targets, {
          yPercent: 118,
          opacity: 0,
          duration: 0.9,
          delay,
          stagger,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start, once: true },
        });

        return instance;
      };

      let instance: SplitText | undefined;
      let cancelled = false;

      document.fonts.ready.then(() => {
        if (!cancelled) instance = run();
      });

      return () => {
        cancelled = true;
        instance?.revert();
      };
    },
    { scope: ref, dependencies: [split, delay, stagger, start] }
  );

  /** ElementType on its own narrows the ref/className props to `never`,
   *  and spelling the full prop union out blows past TS's complexity limit
   *  for a tag that can be any intrinsic element. */
  const Component = Tag as "div";

  return (
    <Component ref={ref as React.Ref<HTMLDivElement>} className={cn(className)}>
      {children}
    </Component>
  );
}
