"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

type SectionHeadingProps = {
  /** Usually a string, but accepts any ReactNode so pages that need the
   * eyebrow translated (see Legal pages using a small client `<T>`
   * component) can pass one in without this component itself needing to
   * become a Client Component. */
  eyebrow: ReactNode;
  title: ReactNode;
  align?: "left" | "center";
  className?: string;
  /** Defaults to h2 — pass "h1" for a page's primary heading (e.g. a page
   * whose hero is built from SectionHeading rather than its own <h1>). */
  as?: "h1" | "h2";
};

/**
 * Shared eyebrow + big editorial title + underline treatment, used across
 * every About/Projects section for a consistent typographic rhythm.
 *
 * The title reveals line by line on scroll (GSAP SplitText, bundled free
 * since 3.13): each line rides up from behind its own mask, so the type is
 * revealed by an edge rather than fading in. Because every section on the
 * site routes its heading through here, that one treatment gives About,
 * Projects, Vlog, Contact and the home page the same entrance without any
 * of them having to wire up an animation of their own.
 *
 * SplitText preserves nested inline markup, so the gradient <span> inside a
 * headline survives the split, and the split is reverted on cleanup — the
 * DOM (and the text crawlers and screen readers see) goes back untouched.
 */
export default function SectionHeading({
  eyebrow,
  title,
  align = "center",
  className,
  as: Heading = "h2",
}: SectionHeadingProps) {
  const isCenter = align === "center";
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const headingEl = root.querySelector<HTMLElement>(".sh-title");
      if (!headingEl) return;

      let split: SplitText | undefined;
      let cancelled = false;

      // Fonts settle late; splitting before they land measures the wrong
      // line boxes and the masks cut through the type.
      document.fonts.ready.then(() => {
        if (cancelled || !rootRef.current) return;

        split = SplitText.create(headingEl, {
          type: "lines",
          mask: "lines",
          linesClass: "sh-line",
        });

        const tl = gsap.timeline({
          scrollTrigger: { trigger: root, start: "top 85%", once: true },
        });

        tl.from(".sh-eyebrow", { y: -12, opacity: 0, duration: 0.5, ease: "power3.out" })
          .from(
            split.lines,
            { yPercent: 118, opacity: 0, duration: 0.95, stagger: 0.09, ease: "expo.out" },
            "-=0.25"
          )
          .from(
            ".sh-rule",
            { scaleX: 0, duration: 0.7, ease: "power3.out" },
            "-=0.55"
          );
      });

      return () => {
        cancelled = true;
        split?.revert();
      };
    },
    { scope: rootRef }
  );

  return (
    <div
      ref={rootRef}
      className={cn("mb-14 sm:mb-20", isCenter ? "text-center" : "text-left", className)}
    >
      <span
        className={cn(
          "sh-eyebrow mb-4 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.4em] text-noir-gold",
          isCenter && "justify-center"
        )}
      >
        <span className="h-1 w-1 rounded-full bg-noir-gold" />
        {eyebrow}
        <span className="h-1 w-1 rounded-full bg-noir-gold" />
      </span>

      <Heading className="sh-title font-jakarta-sans text-4xl font-bold uppercase tracking-tight text-noir-ink sm:text-6xl lg:text-7xl">
        {title}
      </Heading>

      <div
        className={cn(
          "sh-rule mt-6 h-px w-24 origin-left bg-linear-to-r from-transparent via-noir-gold to-transparent",
          isCenter && "mx-auto origin-center",
          !isCenter && "from-noir-gold to-transparent"
        )}
      />
    </div>
  );
}
