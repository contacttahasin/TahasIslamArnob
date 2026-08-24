"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { about } from "@/data/about";
import { useScrollReveal } from "../shared/hooks/useScrollReveal";

// Stats labels live in data/about.ts (its own source-of-truth doc comment),
// but translated copy has to live in messages/*.json — this maps the
// English data label to the matching translation key so both can coexist.
// Falls back to the raw data label for any stat not in this map, so
// adding a new stat to the data file never crashes the page.
const STAT_LABEL_KEY: Record<string, string> = {
  "Years of experience": "yearsOfExperience",
  "Projects completed": "projectsCompleted",
  "Happy clients": "happyClients",
  "Cups of coffee": "cupsOfCoffee",
};

export default function Stats() {
  const t = useTranslations("stats");
  const cardsRef = useRef<Array<HTMLDivElement | null>>([]);
  const countersRef = useRef<Array<HTMLSpanElement | null>>([]);

  const sectionRef = useScrollReveal<HTMLDivElement>((tl) => {
    tl.from(cardsRef.current, {
      opacity: 0,
      y: 32,
      filter: "blur(8px)",
      duration: 0.8,
      ease: "power3.out",
      stagger: 0.12,
    });

    about.stats.forEach((stat, i) => {
      const el = countersRef.current[i];
      if (!el) return;
      const counter = { val: 0 };
      tl.to(
        counter,
        {
          val: stat.value,
          duration: 1.4,
          ease: "power3.out",
          onUpdate: () => {
            el.textContent = `${Math.round(counter.val)}${stat.suffix ?? ""}`;
          },
        },
        i === 0 ? "-=0.4" : "<0.1"
      );
    });
  });

  return (
    <section className="w-full bg-noir-bg px-6 py-20 sm:px-10 lg:px-16">
      <div
        ref={sectionRef}
        className="mx-auto grid max-w-6xl grid-cols-2 gap-5 sm:gap-6 lg:grid-cols-4"
      >
        {about.stats.map((stat, i) => (
          <div
            key={stat.label}
            ref={(el) => {
              cardsRef.current[i] = el;
            }}
            className="rounded-2xl border border-noir-border bg-noir-surface/60 p-6 text-center transition-colors duration-300 hover:border-noir-gold/50 sm:p-8"
          >
            <span
              ref={(el) => {
                countersRef.current[i] = el;
              }}
              className="block font-jakarta-sans text-4xl font-bold text-noir-ink sm:text-5xl"
            >
              0{stat.suffix ?? ""}
            </span>
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-noir-ink-faint sm:text-sm">
              {STAT_LABEL_KEY[stat.label] ? t(STAT_LABEL_KEY[stat.label]) : stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
