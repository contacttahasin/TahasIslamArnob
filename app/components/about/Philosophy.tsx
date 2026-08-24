"use client";

import { useRef } from "react";
import { about } from "@/data/about";
import SectionHeading from "../shared/SectionHeading";
import TiltCard from "../shared/TiltCard";
import { useScrollReveal } from "../shared/hooks/useScrollReveal";

export default function Philosophy() {
  const statementRef = useRef<HTMLParagraphElement>(null);
  const cardsRef = useRef<Array<HTMLDivElement | null>>([]);

  const sectionRef = useScrollReveal<HTMLDivElement>((tl) => {
    tl.from(statementRef.current, {
      opacity: 0,
      y: 24,
      filter: "blur(10px)",
      duration: 0.9,
      ease: "power3.out",
    }).from(
      cardsRef.current,
      {
        opacity: 0,
        y: 32,
        filter: "blur(8px)",
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.12,
      },
      "-=0.4"
    );
  });

  return (
    <section className="w-full bg-noir-bg px-6 py-24 sm:px-10 lg:px-16">
      <SectionHeading
        eyebrow="Philosophy"
        title={
          <>
            How I{" "}
            <span className="bg-linear-to-r from-noir-gold to-noir-gold-bright bg-clip-text italic text-transparent">
              Think
            </span>
          </>
        }
      />

      <div ref={sectionRef} className="mx-auto max-w-5xl">
        <p
          ref={statementRef}
          className="mx-auto max-w-2xl text-center text-xl font-medium leading-relaxed text-noir-ink sm:text-2xl"
        >
          {about.philosophy.statement}
        </p>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {about.philosophy.principles.map((principle, i) => (
            <div
              key={principle.title}
              ref={(el) => {
                cardsRef.current[i] = el;
              }}
            >
              <TiltCard
                max={6}
                className="h-full rounded-2xl border border-noir-border bg-noir-surface/60 p-7 transition-colors duration-300 hover:border-noir-gold/50"
              >
                <span className="text-3xl font-bold text-noir-gold/40">
                  0{i + 1}
                </span>
                <h3 className="mt-4 text-lg font-bold text-noir-ink">
                  {principle.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-noir-ink-soft">
                  {principle.description}
                </p>
              </TiltCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
