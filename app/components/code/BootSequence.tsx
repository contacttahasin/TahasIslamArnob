"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { jetbrainsMono } from "../shared/fonts";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const MONO = { fontFamily: "var(--font-jetbrains-mono), monospace" } as const;

export type BootStep = {
  label: string;
  /** Printed in the right column once the step "completes". */
  value?: string;
};

/**
 * A build log that runs as you scroll to it: each step ticks green in turn,
 * then a progress bar fills and the run reports done.
 *
 * The steps are passed in rather than invented here, so whatever page mounts
 * it describes its own content truthfully.
 */
export default function BootSequence({
  title = "build",
  steps,
  doneLabel = "ready",
  className = "",
}: {
  title?: string;
  steps: BootStep[];
  doneLabel?: string;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const rows = gsap.utils.toArray<HTMLElement>(".bs-row");
      const marks = gsap.utils.toArray<HTMLElement>(".bs-mark");
      const values = gsap.utils.toArray<HTMLElement>(".bs-value");

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set([rows, marks, values, ".bs-done"], { opacity: 1, y: 0 });
        gsap.set(".bs-bar-fill", { scaleX: 1 });
        return;
      }

      gsap.set(rows, { opacity: 0, x: -12 });
      gsap.set(marks, { opacity: 0, scale: 0.6 });
      gsap.set(values, { opacity: 0 });
      gsap.set(".bs-done", { opacity: 0, y: 6 });
      gsap.set(".bs-bar-fill", { scaleX: 0, transformOrigin: "left center" });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: root, start: "top 80%", once: true },
      });

      rows.forEach((row, i) => {
        tl.to(row, { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" }, i * 0.22)
          // The tick lands a beat after its line, so each step reads as
          // having taken a moment to finish rather than arriving done.
          .to(marks[i], { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2.5)" }, i * 0.22 + 0.16)
          .to(values[i], { opacity: 1, duration: 0.25 }, i * 0.22 + 0.16);
      });

      tl.to(".bs-bar-fill", { scaleX: 1, duration: 0.7, ease: "power2.inOut" }, "-=0.35").to(
        ".bs-done",
        { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
        "-=0.2"
      );
    },
    { scope: rootRef }
  );

  return (
    <div
      ref={rootRef}
      className={`${jetbrainsMono.variable} mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-noir-border bg-noir-surface/50 backdrop-blur-md ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-noir-border px-4 py-2.5">
        <span aria-hidden className="h-2 w-2 rounded-full bg-noir-gold-bright" />
        <span style={MONO} className="text-[10px] uppercase tracking-[0.18em] text-noir-ink-faint">
          {title}
        </span>
      </div>

      <div style={MONO} className="space-y-2 px-4 py-4 text-[11px] sm:text-xs">
        {steps.map((step) => (
          <div
            key={step.label}
            className="bs-row grid grid-cols-[1rem_minmax(0,1fr)_auto] items-baseline gap-x-3"
          >
            <span className="bs-mark text-noir-gold-bright">✓</span>
            <span className="truncate text-noir-ink-soft">{step.label}</span>
            <span className="bs-value shrink-0 whitespace-nowrap tabular-nums text-noir-ink-faint">
              {step.value ?? ""}
            </span>
          </div>
        ))}

        <div className="pt-2">
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-noir-border">
            <div className="bs-bar-fill h-full w-full rounded-full bg-linear-to-r from-noir-gold to-noir-gold-bright" />
          </div>

          <p className="bs-done mt-3 flex items-center gap-2 text-[11px] text-noir-gold-bright">
            <span aria-hidden>▸</span>
            {doneLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
