"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { about } from "@/data/about";
import SectionHeading from "../shared/SectionHeading";
import { useScrollReveal } from "../shared/hooks/useScrollReveal";

// Deterministic organic vertical scatter so the badge cloud reads as
// "floating" rather than a rigid grid — cycles if there are more badges.
const OFFSETS = [0, 14, -10, 8, -16, 6, -6, 12, -12, 4, -8, 10];

function levelToSize(level: number) {
  if (level >= 92) return "text-lg px-6 py-3";
  if (level >= 86) return "text-base px-5 py-2.5";
  return "text-sm px-4 py-2";
}

export default function Skills() {
  const badgesRef = useRef<Array<HTMLDivElement | null>>([]);

  const sectionRef = useScrollReveal<HTMLDivElement>(
    (tl) => {
      tl.from(badgesRef.current, {
        opacity: 0,
        scale: 0.7,
        y: 24,
        duration: 0.6,
        ease: "back.out(1.6)",
        stagger: { each: 0.05, from: "random" },
      });
    },
    {
      idle: () => {
        badgesRef.current.forEach((badge, i) => {
          if (!badge) return;
          gsap.to(badge, {
            y: `+=${10 + (i % 4) * 4}`,
            duration: 2.4 + (i % 5) * 0.2,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: 0.1 * i,
          });
        });
      },
    }
  );

  return (
    <section className="relative w-full overflow-hidden bg-noir-bg px-6 py-24 sm:px-10 lg:px-16">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-noir-gold/10 blur-[180px]" />

      <SectionHeading
        eyebrow="Toolbox"
        title={
          <>
            Skills That{" "}
            <span className="bg-linear-to-r from-noir-gold to-noir-gold-bright bg-clip-text italic text-transparent">
              Float
            </span>
          </>
        }
      />

      <div
        ref={sectionRef}
        className="relative mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-4 sm:gap-5"
      >
        {about.skills.map((skill, i) => (
          <div
            key={skill.name}
            ref={(el) => {
              badgesRef.current[i] = el;
            }}
            style={{ marginTop: `${OFFSETS[i % OFFSETS.length]}px` }}
          >
            <motion.div
              whileHover={{ scale: 1.08, y: -4 }}
              transition={{ type: "spring", stiffness: 320, damping: 20 }}
              className={`transform-gpu rounded-full border border-noir-border bg-noir-surface/70 font-medium text-noir-ink backdrop-blur-md transition-colors duration-300 will-change-transform hover:border-noir-gold/60 hover:text-noir-gold-bright ${levelToSize(
                skill.level
              )}`}
            >
              {skill.name}
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
}
