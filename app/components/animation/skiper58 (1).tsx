"use client";

import { motion } from "framer-motion";
import React from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import TransitionLink from "@/app/components/transition/TransitionLink";

const navigationItems = [
  { key: "home", href: "/", description: "[0]" },
  { key: "about", href: "/about", description: "[1]" },
  { key: "contact", href: "/contact", description: "[2]" },
  { key: "projects", href: "/projects", description: "[3]" },
  { key: "blog", href: "/blog", description: "[4]" },
] as const;

export const Skiper58 = () => {
  const t = useTranslations("nav");

  return (
    <ul className="bs flex min-h-full w-full flex-1 flex-col items-center justify-center gap-3 rounded-2xl px-7 py-3 backdrop-blur-sm">
   {navigationItems.map((item, index) => (
  <li
    key={index}
    className="relative flex cursor-pointer flex-col items-center overflow-visible"
  >
    <TransitionLink href={item.href}>
      <div className="relative flex items-start">
        <TextRoll
          center
          className="text-4xl font-extrabold uppercase leading-[0.8] tracking-[-0.03em] transition-colors lg:text-5xl"
        >
          {t(item.key).toUpperCase()}
        </TextRoll>
      </div>
    </TransitionLink>
  </li>
))}
  </ul>
  );
};

const STAGGER = 0.035;

/**
 * Grapheme-cluster split, not a raw code-unit split. Bangla (and many
 * other scripts) form visual characters from multiple Unicode code
 * points — a base consonant plus a vowel sign or virama conjunct.
 * `text.split("")` breaks those apart into separate `inline-block` spans,
 * which breaks the browser's text-shaping run and renders corrupted
 * glyphs instead of the correct conjunct. Intl.Segmenter keeps each
 * visual character intact; falls back to a plain split only on runtimes
 * old enough not to have it (shaping there was already unreliable).
 */
function splitGraphemes(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return Array.from(segmenter.segment(text), (s) => s.segment);
  }
  return text.split("");
}

const TextRoll: React.FC<{
  children: string;
  className?: string;
  center?: boolean;
}> = ({ children, className, center = false }) => {
  const graphemes = splitGraphemes(children);

  return (
    <motion.span
      initial="initial"
      whileHover="hovered"
      className={cn("relative block overflow-hidden", className)}
      style={{
        lineHeight: 0.75,
      }}
    >
      <div>
        {graphemes.map((l, i) => {
          const delay = center
            ? STAGGER * Math.abs(i - (graphemes.length - 1) / 2)
            : STAGGER * i;

          return (
            <motion.span
              variants={{
                initial: {
                  y: 0,
                },
                hovered: {
                  y: "-100%",
                },
              }}
              transition={{
                ease: "easeInOut",
                delay,
              }}
              className="inline-block"
              key={i}
            >
              {l}
            </motion.span>
          );
        })}
      </div>
      <div className="absolute inset-0">
        {graphemes.map((l, i) => {
          const delay = center
            ? STAGGER * Math.abs(i - (graphemes.length - 1) / 2)
            : STAGGER * i;

          return (
            <motion.span
              variants={{
                initial: {
                  y: "100%",
                },
                hovered: {
                  y: 0,
                },
              }}
              transition={{
                ease: "easeInOut",
                delay,
              }}
              className="inline-block"
              key={i}
            >
              {l}
            </motion.span>
          );
        })}
      </div>
    </motion.span>
  );
};

export { TextRoll };
