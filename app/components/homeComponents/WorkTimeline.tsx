"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "../shared/hooks/useReducedMotion";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/* ────────────────────────────────────────────────────────────────────────
   Copy. Kept together at the top so the whole section can be rewritten in
   one place without touching layout or animation.
   ──────────────────────────────────────────────────────────────────────── */

const EYEBROW = ["WORK", "CAREER TIMELINE"];

/** One array entry per rendered line — the headline is animated line by
 *  line, so the breaks are content, not just wrapping. */
const HEADLINE_LINES = ["Nine years of making", "software people", "actually use."];

const INTRO =
  "Most of my work sits at the same intersection - reducing the distance between an idea and a working product. The interesting part is rarely the interface alone. It is the pressure around it: scale, launch risk, revenue dependency, operational complexity, and whether the system still holds when it matters.";

const HIGHLIGHTS = [
  "Tech partner to a UK financial services company that grew from 7th to 2nd largest in their category - built the digital infrastructure that supported that growth.",
  "Delivered 4+ AI-powered campaign pipelines for a national consumer brand via a Tier-1 global agency - reaching tens of millions across multiple activations.",
  "PM and product owner on a large-scale CRM for the UK debt industry - managing a team across a 15-month build, owning design direction and project finances.",
  "Co-founded a digital product studio and led delivery of 50+ products over 5 years.",
];

export default function WorkTimeline() {
  const rootRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top 72%",
          once: true,
        },
      });

      tl.from(".wt-eyebrow", { y: -10, opacity: 0, duration: 0.5 })
        // Each headline line rides up from behind its own overflow-hidden
        // mask, so the type is revealed by an edge rather than fading in —
        // same treatment as the page's opening headline.
        .set(".wt-line-inner", { yPercent: 115 })
        .to(".wt-line-inner", { yPercent: 0, duration: 1, stagger: 0.09, ease: "expo.out" }, "-=0.2")
        .from(".wt-intro", { y: 22, opacity: 0, filter: "blur(4px)", duration: 0.8 }, "-=0.55")
        // The sketch resolves out of a blur, so it reads as the drawing
        // being finished rather than an image sliding in.
        .from(
          ".wt-art",
          { opacity: 0, scale: 1.05, filter: "blur(16px)", duration: 1.2, ease: "expo.out" },
          "-=1.1"
        )
        // The rule draws left-to-right, then each highlight arrives with
        // its arrow leading it in.
        .from(".wt-rule", { scaleX: 0, transformOrigin: "left center", duration: 0.8 }, "-=0.6")
        .from(".wt-arrow", { x: -10, opacity: 0, duration: 0.45, stagger: 0.12 }, "-=0.45")
        .from(".wt-item-text", { y: 14, opacity: 0, duration: 0.55, stagger: 0.12 }, "<0.06");

      if (reducedMotion) return;

      // A slow idle drift, so the sketch keeps a little life once settled.
      gsap.to(".wt-art", {
        y: -14,
        duration: 4.5,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    },
    { scope: rootRef, dependencies: [reducedMotion] }
  );

  return (
    <section
      ref={rootRef}
      className="relative w-full overflow-hidden bg-bg-primary px-[6%] py-20 text-ink sm:py-24 md:px-[8%] lg:px-10 lg:py-32"
    >
      <div className="mx-auto w-full max-w-7xl">

        <p className="wt-eyebrow flex flex-wrap items-center gap-x-6 gap-y-1 font-[font3] uppercase tracking-[0.28em] text-ink-secondary">
          {EYEBROW.map((word) => (
            <span key={word}>{word}</span>
          ))}
        </p>

        {/* Headline + intro on the left, sketch on the right; stacked on
            phone with the sketch between the intro and the highlights,
            exactly as the reference lays it out. */}
        <div className="mt-10 grid grid-cols-1 gap-10 lg:mt-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-14">

          <div className="order-1">
            <h2 className="wt-headline font-[font1] font-bold tracking-tight text-ink">
              {HEADLINE_LINES.map((line) => (
                <span key={line} className="block overflow-hidden">
                  <span className="wt-line-inner block">{line}</span>
                </span>
              ))}
            </h2>

            <p className="wt-intro mt-8 max-w-2xl leading-relaxed text-ink-secondary lg:mt-10">
              {INTRO}
            </p>
          </div>

          <div className="order-2 flex justify-center lg:justify-end">
            <Image
              src="/hero/work-process.webp"
              alt="Sketched workflow: timeline, flowchart, wireframes, code and analytics"
              width={1080}
              height={1080}
              sizes="(min-width: 1024px) 44vw, 80vw"
              className="wt-art h-auto w-[80%] max-w-[560px] object-contain sm:w-[62%] lg:w-full"
            />
          </div>
        </div>

        {/* Highlights */}
        <div className="mt-14 lg:mt-20">
          <div className="wt-rule h-px w-full bg-line" />

          <ul className="mt-10 space-y-6 lg:space-y-5">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-4 lg:gap-6">
                <span
                  aria-hidden
                  className="wt-arrow mt-[0.3em] shrink-0 font-[font3] text-[var(--accent)]"
                >
                  →
                </span>
                <p className="wt-item-text max-w-4xl leading-relaxed text-ink-secondary">
                  {item}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Type scales fluidly rather than stepping at breakpoints. The
          earlier vw-per-breakpoint stack had two real faults: `1.7vw` body
          text resolved to ~11px on a 640px tablet, and every size dropped
          at the `lg` boundary because a vw value there was smaller than the
          vw value just below it. clamp() removes both — one continuous
          curve from a readable floor to a capped ceiling, correct at every
          width in between. */}
      <style jsx>{`
        .wt-eyebrow {
          font-size: clamp(0.6rem, 1.1vw, 0.7rem);
        }
        .wt-headline {
          font-size: clamp(1.75rem, 6.4vw, 4.5rem);
          line-height: 1.04;
        }
        /* The per-line masks are overflow:hidden, which would otherwise
           shear the descenders off a tight-leading display face. The pad
           gives them room; the equal negative margin keeps the visual
           line spacing unchanged. */
        .wt-line-inner {
          padding-bottom: 0.14em;
          margin-bottom: -0.14em;
        }
        .wt-intro {
          font-size: clamp(0.95rem, 1.5vw, 1.125rem);
        }
        .wt-item-text {
          font-size: clamp(0.9rem, 1.25vw, 1rem);
        }
        .wt-arrow {
          font-size: clamp(0.8rem, 1.2vw, 0.95rem);
        }
      `}</style>
    </section>
  );
}
