"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Code2,
  Palette,
  Wind,
  Braces,
  FileType,
  Atom,
  Triangle,
  Zap,
  Sparkles,
  Server,
  PenTool,
  Search,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const skills = [
  { name: "HTML", note: "Semantic markup", icon: Code2, percent: 98 },
  { name: "CSS", note: "Layout & motion", icon: Palette, percent: 95 },
  { name: "Tailwind CSS", note: "Utility-first styling", icon: Wind, percent: 96 },
  { name: "JavaScript", note: "Core language", icon: Braces, percent: 92 },
  { name: "TypeScript", note: "Type-safe code", icon: FileType, percent: 90 },
  { name: "React.js", note: "Component architecture", icon: Atom, percent: 90 },
  { name: "Next.js", note: "Full-stack framework", icon: Triangle, percent: 99 },
  { name: "GSAP", note: "Scroll-driven motion", icon: Zap, percent: 85 },
  { name: "Framer Motion", note: "Micro-interactions", icon: Sparkles, percent: 88 },
  { name: "Node.js", note: "Server-side logic", icon: Server, percent: 84 },
  { name: "UI / UX Design", note: "Interface systems", icon: PenTool, percent: 92 },
  { name: "SEO", note: "Discoverability", icon: Search, percent: 90 },
];

const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function Skill() {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const cardsRef = useRef([]);
  const ringsRef = useRef([]);
  const countersRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(headingRef.current, { opacity: 0, y: 30, filter: "blur(10px)" });
      gsap.set(cardsRef.current, { opacity: 0, y: 40, filter: "blur(8px)" });
      gsap.set(ringsRef.current, { strokeDashoffset: RING_CIRCUMFERENCE });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          toggleActions: "play none none none",
          once: true,
        },
        onComplete: () => {
          // Idle float only starts once entrance has fully settled at y:0 —
          // starting it earlier let it fight the entrance tween over the
          // same `y` property, producing garbage transform values that
          // pushed cards into the row above/below in the grid.
          ctx.add(() => {
            cardsRef.current.forEach((card, i) => {
              if (!card) return;
              gsap.to(card, {
                y: "-=8",
                duration: 2.2 + i * 0.12,
                ease: "sine.inOut",
                yoyo: true,
                repeat: -1,
                delay: 0.12 * i,
              });
            });
          });
        },
      });

      tl.to(headingRef.current, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.9,
        ease: "power3.out",
      })
        .to(
          cardsRef.current,
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.05,
          },
          "-=0.5"
        )
        .to(
          ringsRef.current,
          {
            strokeDashoffset: (i) =>
              RING_CIRCUMFERENCE * (1 - skills[i].percent / 100),
            duration: 1.4,
            ease: "power3.out",
            stagger: 0.05,
          },
          "-=0.5"
        );

      skills.forEach((skill, i) => {
        const counterEl = countersRef.current[i];
        if (!counterEl) return;
        const counterValue = { val: 0 };
        tl.to(
          counterValue,
          {
            val: skill.percent,
            duration: 1.4,
            ease: "power3.out",
            onUpdate: () => {
              counterEl.textContent = `${Math.round(counterValue.val)}%`;
            },
          },
          "<"
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-linear-to-br from-bg-secondary via-bg-elevated to-bg-elevated px-6 py-24 sm:px-10"
    >
      <div className="pointer-events-none absolute bottom-0 right-1/3 h-[420px] w-[420px] translate-y-1/3 rounded-full bg-noir-gold-bright/10 blur-[150px]" />

      <div ref={headingRef} className="relative mb-14 text-center sm:mb-20">
        <span className="mb-4 flex items-center justify-center gap-3 text-xs font-medium uppercase tracking-[0.4em] text-noir-gold">
          <span className="h-1 w-1 rounded-full bg-noir-gold" />
          What I Do
          <span className="h-1 w-1 rounded-full bg-noir-gold" />
        </span>

        <h2 className="font-jakarta-sans text-4xl font-bold uppercase tracking-tight text-ink sm:text-6xl lg:text-7xl">
          Skills That{" "}
          <span className="bg-linear-to-r from-noir-gold to-noir-gold-bright bg-clip-text italic text-transparent drop-shadow-[0_0_30px_rgba(var(--accent-rgb),0.35)]">
            Ship
          </span>
        </h2>

        <div className="mx-auto mt-6 h-px w-24 bg-linear-to-r from-transparent via-noir-gold to-transparent" />
      </div>

      <div className="grid w-full max-w-7xl grid-cols-2 gap-5 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-6">
        {skills.map((skill, i) => (
          <SkillCard
            key={skill.name}
            skill={skill}
            setCardRef={(el) => (cardsRef.current[i] = el)}
            setRingRef={(el) => (ringsRef.current[i] = el)}
            setCounterRef={(el) => (countersRef.current[i] = el)}
          />
        ))}
      </div>
    </section>
  );
}

function SkillCard({ skill, setCardRef, setRingRef, setCounterRef }) {
  const Icon = skill.icon;
  const size = 64;
  const center = size / 2;

  return (
    <div ref={setCardRef} className="w-full">
      <motion.div
        whileHover={{ y: -6, scale: 1.03 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="group relative flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-bg-elevated/80 p-5 text-center shadow-[0_20px_45px_-25px_rgba(0,0,0,0.75)] transform-gpu will-change-transform"
      >
        <span
          ref={setCounterRef}
          className="absolute right-3 top-3 text-[11px] font-medium tabular-nums text-noir-gold-bright"
        >
          0%
        </span>

        <div className="relative flex h-16 w-16 items-center justify-center">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="absolute inset-0 -rotate-90"
          >
            <circle
              cx={center}
              cy={center}
              r={RING_RADIUS}
              fill="none"
              stroke="var(--line)"
              strokeWidth={3}
            />
            <circle
              ref={setRingRef}
              cx={center}
              cy={center}
              r={RING_RADIUS}
              fill="none"
              stroke="var(--accent-light)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={RING_CIRCUMFERENCE}
            />
          </svg>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white/5 text-noir-gold-bright transition-colors duration-300 group-hover:border-noir-gold-bright/60 group-hover:bg-noir-gold-bright/10">
            <Icon size={18} strokeWidth={1.75} />
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-ink">{skill.name}</p>
          <p className="mt-1 text-[11px] text-ink-muted">{skill.note}</p>
        </div>
      </motion.div>
    </div>
  );
}
