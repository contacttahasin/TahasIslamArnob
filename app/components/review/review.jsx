"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { Quote } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollVelocityRow } from "../homeComponents/ScrollVelocityContainer";
import { reviews } from "@/data/reviews";

gsap.registerPlugin(ScrollTrigger);

const rowOne = reviews.slice(0, 4);
const rowTwo = reviews.slice(4);

// Soft fade at the left/right edges so cards ease in/out of the marquee
// instead of cutting off hard.
const EDGE_MASK =
  "linear-gradient(to right, transparent, black 8%, black 92%, transparent)";

export default function Review() {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const rowOneRef = useRef(null);
  const rowTwoRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(headingRef.current, { opacity: 0, y: 30, filter: "blur(10px)" });
      gsap.set([rowOneRef.current, rowTwoRef.current], {
        opacity: 0,
        filter: "blur(12px)",
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          toggleActions: "play none none none",
          once: true,
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
          rowOneRef.current,
          { opacity: 1, filter: "blur(0px)", duration: 0.9, ease: "power3.out" },
          "-=0.5"
        )
        .to(
          rowTwoRef.current,
          { opacity: 1, filter: "blur(0px)", duration: 0.9, ease: "power3.out" },
          "-=0.7"
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-linear-to-br from-bg-secondary via-bg-elevated to-bg-elevated px-6 py-24 sm:px-10"
    >
      <div className="pointer-events-none absolute top-0 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-noir-gold/10 blur-[150px]" />

      <div ref={headingRef} className="relative mb-14 text-center sm:mb-20">
        <span className="mb-4 flex items-center justify-center gap-3 text-xs font-medium uppercase tracking-[0.4em] text-noir-gold">
          <span className="h-1 w-1 rounded-full bg-noir-gold" />
          What Others Say
          <span className="h-1 w-1 rounded-full bg-noir-gold" />
        </span>

        <h2 className="font-jakarta-sans text-4xl font-bold uppercase tracking-tight text-ink sm:text-6xl lg:text-7xl">
          The Voice{" "}
          <span className="bg-linear-to-r from-noir-gold to-noir-gold-bright bg-clip-text italic text-transparent drop-shadow-[0_0_30px_rgba(var(--accent-rgb),0.35)]">
            Behind
          </span>
        </h2>

        <div className="mx-auto mt-6 h-px w-24 bg-linear-to-r from-transparent via-noir-gold to-transparent" />
      </div>

      <div className="relative flex w-full max-w-[1600px] flex-col gap-5 sm:gap-6">
        <div ref={rowOneRef}>
          <MarqueeRow items={rowOne} baseVelocity={2.4} direction={1} />
        </div>
        <div ref={rowTwoRef}>
          <MarqueeRow items={rowTwo} baseVelocity={2.4} direction={-1} />
        </div>
      </div>
    </section>
  );
}

/**
 * Wraps the site's existing auto-scrolling ScrollVelocityRow (already used
 * for the homepage marquee — it accelerates/reverses with page-scroll
 * velocity) and layers a blur filter driven by that same scroll speed, so
 * the row blurs when you scroll fast and sharpens back up at rest.
 */
function MarqueeRow({ items, baseVelocity, direction }) {
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const blur = useTransform(smoothVelocity, (v) => Math.min(6, Math.abs(v) / 260));
  const blurFilter = useTransform(blur, (b) => `blur(${b.toFixed(2)}px)`);

  return (
    <motion.div
      style={{
        filter: blurFilter,
        WebkitMaskImage: EDGE_MASK,
        maskImage: EDGE_MASK,
      }}
      className="w-full overflow-hidden"
    >
      <ScrollVelocityRow baseVelocity={baseVelocity} direction={direction} className="py-2">
        <div className="flex">
          {items.map((t) => (
            <ReviewCard key={t.name} testimonial={t} />
          ))}
        </div>
      </ScrollVelocityRow>
    </motion.div>
  );
}

function ReviewCard({ testimonial }) {
  const localRef = useRef(null);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springRotateX = useSpring(rotateX, { stiffness: 260, damping: 20 });
  const springRotateY = useSpring(rotateY, { stiffness: 260, damping: 20 });

  const handleMove = (e) => {
    const el = localRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(relX * 10);
    rotateX.set(relY * -10);
  };

  const handleLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  const CardTag = testimonial.link ? motion.a : motion.div;
  const linkProps = testimonial.link
    ? { href: testimonial.link, target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <div
      ref={localRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="perspective-distant mr-4 w-64 shrink-0 sm:mr-5 sm:w-72"
    >
      <CardTag
        {...linkProps}
        style={{
          rotateX: springRotateX,
          rotateY: springRotateY,
          transformPerspective: 800,
        }}
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="group relative flex min-h-48 flex-col justify-between overflow-hidden whitespace-normal rounded-2xl border border-line bg-bg-elevated/80 p-5 shadow-[0_20px_45px_-25px_rgba(0,0,0,0.75)] transform-gpu will-change-transform"
      >
        <span className="absolute left-6 top-0 h-[3px] w-8 rounded-full bg-linear-to-r from-noir-gold to-noir-gold-bright" />

        <div>
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-white/5 text-sm font-semibold text-noir-gold-bright">
              {testimonial.picture ? (
                <Image
                  src={testimonial.picture}
                  alt={testimonial.name}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              ) : (
                testimonial.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-ink">
                {testimonial.name}
              </p>
              {/* Left at 11px while the quote and name went up: these are
                  uppercase and letterspaced, so on the narrower card a 12px
                  size pushed most job titles into an ellipsis. */}
              <p className="truncate text-[11px] uppercase tracking-wide text-ink-muted">
                {testimonial.title}
              </p>
              <p className="truncate text-[11px] uppercase tracking-wide text-noir-gold">
                {testimonial.company}
              </p>
            </div>
          </div>

          {/* Capped + scrollable on the y-axis so a longer real testimonial
              can't stretch the card and break the marquee row's alignment
              with its neighbors — short text (like today's placeholders)
              never shows a scrollbar since it fits well under the cap. */}
          {/* Card got smaller and the type got bigger, so the cap comes down
              with it — the quote scrolls inside instead of stretching the
              card and knocking the row out of alignment with its neighbour. */}
          <p className="mt-3 max-h-28 overflow-y-auto pr-1 text-base leading-relaxed text-ink-secondary sm:max-h-32">
            &ldquo;{testimonial.text}&rdquo;
          </p>
        </div>

        <Quote
          size={40}
          className="absolute bottom-3 right-3 rotate-180 text-noir-gold/10 transition-colors duration-300 group-hover:text-noir-gold/20"
        />
      </CardTag>
    </div>
  );
}
