"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { about } from "@/data/about";
import SectionHeading from "../shared/SectionHeading";
import TiltCard from "../shared/TiltCard";
import { useScrollReveal } from "../shared/hooks/useScrollReveal";

export default function Experience() {
  const t = useTranslations("nav");
  const cardsRef = useRef<Array<HTMLDivElement | null>>([]);

  const sectionRef = useScrollReveal<HTMLDivElement>((tl) => {
    tl.from(cardsRef.current, {
      opacity: 0,
      y: 40,
      filter: "blur(8px)",
      duration: 0.8,
      ease: "power3.out",
      stagger: 0.12,
    });
  });

  return (
    <section className="w-full bg-noir-bg px-6 py-24 sm:px-10 lg:px-16">
      <SectionHeading
        eyebrow={t("experience")}
        title={
          <>
            Where I&apos;ve{" "}
            <span className="bg-linear-to-r from-noir-gold to-noir-gold-bright bg-clip-text italic text-transparent">
              Worked
            </span>
          </>
        }
      />

      <div ref={sectionRef} className="mx-auto flex max-w-4xl flex-col gap-6">
        {about.experience.map((entry, i) => (
          <div
            key={`${entry.role}-${i}`}
            ref={(el) => {
              cardsRef.current[i] = el;
            }}
          >
            <TiltCard
              max={4}
              scaleOnHover={1.01}
              className="rounded-3xl border border-noir-border bg-noir-surface/60 p-8 backdrop-blur-xl transition-colors duration-300 hover:border-noir-gold/50"
            >
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                <div>
                  <h3 className="text-xl font-bold text-noir-ink sm:text-2xl">{entry.role}</h3>
                  <p className="mt-1 text-sm font-medium text-noir-gold-bright">
                    {entry.organization}
                  </p>
                </div>
                <span className="shrink-0 text-xs uppercase tracking-[0.2em] text-noir-ink-faint">
                  {entry.period}
                </span>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-noir-ink-soft sm:text-base">
                {entry.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {entry.tech.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-noir-border bg-white/5 px-3 py-1 text-xs text-noir-ink-soft"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </TiltCard>
          </div>
        ))}
      </div>
    </section>
  );
}
