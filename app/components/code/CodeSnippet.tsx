"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Check, Copy } from "lucide-react";
import { jetbrainsMono } from "../shared/fonts";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const MONO = { fontFamily: "var(--font-jetbrains-mono), monospace" } as const;

/** A line is a list of coloured pieces, so a snippet can be highlighted
 *  without pulling in a syntax highlighter for a dozen lines of code. */
export type CodeToken = { text: string; tone?: "keyword" | "string" | "prop" | "punct" | "comment" };
export type CodeLine = CodeToken[];

const TONE_CLASS: Record<NonNullable<CodeToken["tone"]>, string> = {
  keyword: "text-[var(--accent)]",
  string: "text-noir-ink-soft",
  prop: "text-noir-gold-bright",
  punct: "text-noir-ink-faint",
  comment: "text-noir-ink-faint/70 italic",
};

/**
 * A small code block that draws itself line by line on scroll, with a copy
 * button that hands over the plain text.
 *
 * Tokens are passed in rather than parsed: the snippets on this site are a
 * handful of lines each, and shipping a highlighter to colour them would
 * cost more than the whole page.
 */
export default function CodeSnippet({
  filename,
  lines,
  className = "",
}: {
  filename: string;
  lines: CodeLine[];
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useGSAP(
    () => {
      const rows = gsap.utils.toArray<HTMLElement>(".cs-line");
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(rows, { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        rows,
        { opacity: 0, y: 10, filter: "blur(4px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.4,
          stagger: 0.07,
          ease: "power2.out",
          scrollTrigger: { trigger: rootRef.current, start: "top 82%", once: true },
        }
      );
    },
    { scope: rootRef }
  );

  async function copy() {
    const text = lines.map((line) => line.map((token) => token.text).join("")).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access can be denied; the code is on screen either way.
    }
  }

  return (
    <div
      ref={rootRef}
      className={`${jetbrainsMono.variable} mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-noir-border bg-noir-surface/60 backdrop-blur-md ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-noir-border px-4 py-2.5">
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-noir-border" />
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-noir-border" />
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-noir-border" />
        <span
          style={MONO}
          className="ml-2 min-w-0 truncate text-[10px] tracking-[0.12em] text-noir-ink-faint sm:text-[11px]"
        >
          {filename}
        </span>

        <button
          type="button"
          onClick={copy}
          aria-label="Copy code"
          className="ml-auto shrink-0 rounded-md p-1.5 text-noir-ink-faint transition-colors hover:text-noir-gold-bright"
        >
          {copied ? <Check className="size-3.5 text-noir-gold-bright" /> : <Copy className="size-3.5" />}
        </button>
      </div>

      {/* Wraps below sm and holds its shape above it: a hidden sideways
          scroll just cut long string values off on a phone. */}
      <div className="sm:overflow-x-auto">
        <div style={MONO} className="px-4 py-4 text-[11px] leading-[1.9] sm:min-w-fit sm:text-[12.5px]">
          {lines.map((line, i) => (
            <div key={i} className="cs-line flex gap-4 whitespace-pre-wrap break-all sm:whitespace-pre sm:break-normal">
              <span className="w-5 shrink-0 select-none text-right tabular-nums text-noir-ink-faint/60">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                {line.map((token, j) => (
                  <span key={j} className={token.tone ? TONE_CLASS[token.tone] : "text-noir-ink"}>
                    {token.text}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
