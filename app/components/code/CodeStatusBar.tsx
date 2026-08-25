"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GitBranch, Check } from "lucide-react";
import { jetbrainsMono } from "../shared/fonts";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const MONO = { fontFamily: "var(--font-jetbrains-mono), monospace" } as const;

/**
 * An editor status bar as a section divider — branch, language, cursor
 * position, a clock. Reads as the strip along the bottom of a code editor,
 * which makes it a full-width rule that carries the site's tone instead of
 * just being a line.
 *
 * Everything animates in from the left, the way a shell prompt fills.
 */
export default function CodeStatusBar({
  branch = "main",
  file = "portfolio/page.tsx",
  language = "TypeScript",
  className = "",
}: {
  branch?: string;
  file?: string;
  language?: string;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  // Rendered only after mount: a clock in the server output and a clock in
  // the client's first render never agree, and React calls that a hydration
  // mismatch.
  const [clock, setClock] = useState<string | null>(null);

  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
      );
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.from(".csb-item", {
        opacity: 0,
        x: -10,
        duration: 0.45,
        stagger: 0.06,
        ease: "power2.out",
        scrollTrigger: { trigger: rootRef.current, start: "top 92%", once: true },
      });

      gsap.from(".csb-rule", {
        scaleX: 0,
        transformOrigin: "left center",
        duration: 0.7,
        ease: "power3.out",
        scrollTrigger: { trigger: rootRef.current, start: "top 92%", once: true },
      });
    },
    { scope: rootRef }
  );

  return (
    <div ref={rootRef} className={`${jetbrainsMono.variable} w-full ${className}`}>
      <div className="csb-rule h-px w-full bg-line" />

      <div
        style={MONO}
        className="flex w-full flex-wrap items-center gap-x-5 gap-y-2 px-[6%] py-3 text-[10px] uppercase tracking-[0.14em] text-ink-muted sm:text-[11px] md:px-[8%] lg:px-10"
      >
        <span className="csb-item flex items-center gap-1.5 text-[var(--accent)]">
          <GitBranch className="size-3" />
          {branch}
        </span>

        <span className="csb-item hidden min-w-0 truncate sm:inline">{file}</span>

        <span className="csb-item ml-auto hidden items-center gap-1.5 text-noir-gold-bright md:flex">
          <Check className="size-3" />
          no errors
        </span>

        <span className="csb-item order-last md:order-none">{language}</span>
        <span className="csb-item hidden sm:inline">UTF-8</span>
        {/* ml-auto here as well as on the desktop-only "no errors" item, so
            the clock still sits at the right edge once that one is hidden. */}
        <span className="csb-item ml-auto tabular-nums md:ml-0">{clock ?? "--:--"}</span>
      </div>

      <div className="csb-rule h-px w-full bg-line" />
    </div>
  );
}
