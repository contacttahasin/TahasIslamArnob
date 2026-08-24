"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
} from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";

gsap.registerPlugin(ScrollTrigger);

/**
 * NOTE: placeholder roster — swap in real names/roles/photos when available.
 * Images reuse the existing /public/hero assets so the component renders
 * fully wired-up without needing new uploads.
 */
type TeamMember = {
  name: string;
  role: string;
  image: string;
};

const teamMembers: TeamMember[] = [
  { name: "Tahasin Islam", role: "FULL STACK DEVELOPER", image: "/hero/about.png" },
  { name: "Masfiqul", role: "Web developer & Digital marketer", image: "/hero/Web developer & Digital marketer.png" },
  { name: "Abdulliah", role: "Digital Marketing", image: "/hero/Digital Marketing.png" },
 
];

export default function Team() {
  const t = useTranslations("team");
  const DEFAULT_NAME = t("defaultTitle").toUpperCase();
  const DEFAULT_ROLE = t("defaultRole");
  const sectionRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<Array<HTMLDivElement | null>>([]);
  const trackRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const springX = useSpring(cursorX, { stiffness: 320, damping: 28, mass: 0.4 });
  const springY = useSpring(cursorY, { stiffness: 320, damping: 28, mass: 0.4 });

  // Click-and-drag scrolling for mouse/trackpad; touch devices already get
  // native momentum scrolling for free via overflow-x-auto.
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, scrollLeft: 0 });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track || e.pointerType !== "mouse") return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, scrollLeft: track.scrollLeft };
    track.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !trackRef.current) return;
    const dx = e.clientX - dragStart.current.x;
    trackRef.current.scrollLeft = dragStart.current.scrollLeft - dx;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    trackRef.current?.releasePointerCapture(e.pointerId);
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(headingRef.current, { opacity: 0, y: 30, filter: "blur(10px)" });
      gsap.set(cardsRef.current, { opacity: 0, y: 40, filter: "blur(8px)" });

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
          // pushed cards past the track's bottom edge and clipped them.
          ctx.add(() => {
            cardsRef.current.forEach((card, i) => {
              if (!card) return;
              gsap.to(card, {
                y: "-=10",
                duration: 2.4 + i * 0.15,
                ease: "sine.inOut",
                yoyo: true,
                repeat: -1,
                delay: 0.15 * i,
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
      }).to(
        cardsRef.current,
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.09,
        },
        "-=0.5"
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleMove = (e: React.MouseEvent) => {
    cursorX.set(e.clientX);
    cursorY.set(e.clientY);
  };

  const activeMember = hovered !== null ? teamMembers[hovered] : null;

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMove}
      className="relative w-full overflow-hidden bg-[#0C0F14] px-6 py-24 sm:px-10 sm:py-32 lg:px-16"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-noir-gold/10 blur-[150px]" />

      {/* Custom cursor follower */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-50 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-difference"
        style={{
          x: springX,
          y: springY,
          opacity: hovered !== null ? 1 : 0,
          scale: hovered !== null ? 1 : 0.5,
          backgroundColor: "var(--accent-light)",
        }}
        transition={{ opacity: { duration: 0.25 }, scale: { duration: 0.25 } }}
      />

      <div className="relative mx-auto max-w-6xl">
        {/* Heading */}
        <div ref={headingRef} className="mb-14 text-center sm:mb-20">
          <span className="mb-4 block text-xs font-medium uppercase tracking-[0.4em] text-noir-gold">
            {t("eyebrow")}
          </span>

          <div className="relative flex min-h-[3.5em] items-center justify-center overflow-hidden sm:min-h-[2.5em]">
            <AnimatePresence mode="wait">
              <motion.h2
                key={activeMember?.name ?? DEFAULT_NAME}
                initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -24, filter: "blur(10px)" }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="text-4xl font-bold uppercase leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl"
              >
                {activeMember ? (
                  <span className="bg-linear-to-r from-noir-gold to-noir-gold-bright bg-clip-text text-transparent">
                    {activeMember.name}
                  </span>
                ) : (
                  DEFAULT_NAME
                )}
              </motion.h2>
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={activeMember?.role ?? DEFAULT_ROLE}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="mt-3 text-sm tracking-wide text-white/70 sm:text-base"
            >
              {activeMember?.role ?? DEFAULT_ROLE}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Team strip — draggable / swipeable on every device */}
        <div
          ref={trackRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto perspective-distant scroll-px-6 pt-3 pb-6 scrollbar-none cursor-grab select-none active:cursor-grabbing sm:gap-8 sm:scroll-px-10 lg:scroll-px-16"
        >
          {teamMembers.map((member, i) => (
            <TeamCard
              key={member.name}
              member={member}
              index={i}
              isHovered={hovered === i}
              isDimmed={hovered !== null && hovered !== i}
              onEnter={() => setHovered(i)}
              onLeave={() => setHovered(null)}
              setRef={(el) => (cardsRef.current[i] = el)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

type TeamCardProps = {
  member: TeamMember;
  index: number;
  isHovered: boolean;
  isDimmed: boolean;
  onEnter: () => void;
  onLeave: () => void;
  setRef: (el: HTMLDivElement | null) => void;
};

function TeamCard({
  member,
  index,
  isHovered,
  isDimmed,
  onEnter,
  onLeave,
  setRef,
}: TeamCardProps) {
  const localRef = useRef<HTMLDivElement>(null);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springRotateX = useSpring(rotateX, { stiffness: 260, damping: 20 });
  const springRotateY = useSpring(rotateY, { stiffness: 260, damping: 20 });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = localRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(relX * 16);
    rotateX.set(relY * -16);
  };

  const handleLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    onLeave();
  };

  return (
    <div
      ref={(el) => {
        localRef.current = el;
        setRef(el);
      }}
      onMouseEnter={onEnter}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="group relative w-[78vw] shrink-0 snap-center sm:w-[52vw] md:w-[38vw] lg:w-[30vw] xl:w-[24vw]"
    >
      <motion.div
        style={{
          rotateX: springRotateX,
          rotateY: springRotateY,
          transformPerspective: 800,
        }}
        animate={{
          scale: isHovered ? 1.05 : 1,
          opacity: isDimmed ? 0.45 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="relative aspect-4/5 w-full overflow-hidden rounded-2xl border border-[#262C38] bg-[#171B24] shadow-[0_20px_45px_-25px_rgba(0,0,0,0.75)] transform-gpu will-change-transform"
      >
        <Image
          src={member.image}
          alt={member.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 38vw, 78vw"
          className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-110"
        />

        <div className="absolute inset-0 bg-linear-to-t from-[#0C0F14] via-transparent to-transparent opacity-70" />

        <span className="absolute right-4 top-4 text-xs font-medium tracking-widest text-white/70">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4 sm:p-5 lg:p-6">
          <span className="text-sm font-semibold text-white sm:text-base lg:text-lg">
            {member.name}
          </span>
          <span className="text-xs text-noir-gold-bright sm:text-sm">
            {member.role}
          </span>
        </div>

        <div
          className={`absolute inset-0 rounded-2xl border transition-colors duration-300 ${
            isHovered ? "border-noir-gold-bright/60" : "border-transparent"
          }`}
        />
      </motion.div>
    </div>
  );
}
