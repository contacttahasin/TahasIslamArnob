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

export type Dependency = { name: string; version: string };

/**
 * The stack as a package.json block: dependency names and the versions this
 * site actually runs, each row typing its version in as it arrives.
 *
 * Real versions rather than a badge wall — it says the same thing and it is
 * checkable.
 */
export default function DependencyList({
  dependencies,
  filename = "package.json",
  className = "",
}: {
  dependencies: Dependency[];
  filename?: string;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const rows = gsap.utils.toArray<HTMLElement>(".dep-row");
      const versions = gsap.utils.toArray<HTMLElement>(".dep-version");

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set([rows, versions], { opacity: 1, x: 0 });
        return;
      }

      gsap.set(rows, { opacity: 0, x: -10 });
      gsap.set(versions, { opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: rootRef.current, start: "top 82%", once: true },
      });

      rows.forEach((row, i) => {
        tl.to(row, { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" }, i * 0.08)
          .to(versions[i], { opacity: 1, duration: 0.25 }, i * 0.08 + 0.12);
      });

      tl.from(".dep-brace", { opacity: 0, duration: 0.3 }, 0);
    },
    { scope: rootRef }
  );

  return (
    <div
      ref={rootRef}
      className={`${jetbrainsMono.variable} mx-auto w-full max-w-lg overflow-hidden rounded-2xl border border-noir-border bg-noir-surface/50 backdrop-blur-md ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-noir-border px-4 py-2.5">
        <span aria-hidden className="h-2 w-2 rounded-full bg-noir-gold/70" />
        <span style={MONO} className="text-[10px] uppercase tracking-[0.16em] text-noir-ink-faint">
          {filename}
        </span>
      </div>

      {/* Grid columns rather than one long padded string, so every version
          starts at the same x no matter how long the package name is. */}
      <div>
        <div style={MONO} className="px-4 py-4 text-[11px] leading-[1.95] sm:text-[12.5px]">
          <p className="dep-brace whitespace-pre text-noir-ink-faint">
            <span className="text-noir-gold-bright">&quot;dependencies&quot;</span>: {"{"}
          </p>

          {dependencies.map((dep) => (
            <div
              key={dep.name}
              className="dep-row grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 pl-4"
            >
              <span className="truncate text-noir-gold-bright">
                &quot;{dep.name}&quot;<span className="text-noir-ink-faint">:</span>
              </span>
              <span className="dep-version shrink-0 whitespace-nowrap text-noir-ink-soft">
                &quot;{dep.version}&quot;<span className="text-noir-ink-faint">,</span>
              </span>
            </div>
          ))}

          <p className="dep-brace whitespace-pre text-noir-ink-faint">{"}"}</p>
        </div>
      </div>
    </div>
  );
}
