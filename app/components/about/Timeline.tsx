"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { about } from "@/data/about";
import SectionHeading from "../shared/SectionHeading";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Timeline() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Progress line draws downward in step with scroll position.
      gsap.fromTo(
        lineRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          transformOrigin: "top",
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 65%",
            end: "bottom 55%",
            scrub: 0.6,
          },
        }
      );

      itemsRef.current.forEach((item) => {
        if (!item) return;
        gsap.fromTo(
          item,
          { opacity: 0, x: -24, filter: "blur(8px)" },
          {
            opacity: 1,
            x: 0,
            filter: "blur(0px)",
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: item,
              start: "top 82%",
              toggleActions: "play none none none",
              once: true,
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full bg-noir-bg px-6 py-24 sm:px-10 lg:px-16">
      <SectionHeading
        eyebrow="My Journey"
        title={
          <>
            The Path{" "}
            <span className="bg-linear-to-r from-noir-gold to-noir-gold-bright bg-clip-text italic text-transparent">
              So Far
            </span>
          </>
        }
      />

      <div className="relative mx-auto max-w-3xl">
        <div className="absolute left-[8px] top-2 bottom-2 w-px bg-noir-border" />
        <div
          ref={lineRef}
          className="absolute left-[8px] top-2 bottom-2 w-px origin-top bg-linear-to-b from-noir-gold to-noir-gold-bright"
        />

        <div className="space-y-12">
          {about.journey.map((milestone, i) => (
            <div
              key={`${milestone.title}-${i}`}
              ref={(el) => {
                itemsRef.current[i] = el;
              }}
              className="relative pl-10 sm:pl-12"
            >
              <span className="absolute left-0 top-1.5 h-4 w-4 rounded-full border-2 border-noir-gold bg-noir-bg" />

              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-noir-gold-bright">
                {milestone.year}
              </span>
              <h3 className="mt-2 text-xl font-bold text-noir-ink sm:text-2xl">
                {milestone.title}
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-noir-ink-soft sm:text-base">
                {milestone.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
