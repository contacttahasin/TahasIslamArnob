"use client";

import { useId, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "./hooks/useReducedMotion";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type IllustratedSectionProps = {
  /** Small mono label above the headline. Each entry is its own word group. */
  eyebrow: string[];
  /** One entry per rendered line — the headline animates line by line, so
   *  the breaks are content rather than incidental wrapping. */
  headlineLines: string[];
  intro: string;
  /** Optional arrow list under the copy. */
  points?: string[];
  image: { src: string; alt: string; width: number; height: number };
  /** Which side the illustration sits on from `lg` up. Stacked below it on
   *  phone and tablet either way. */
  side?: "left" | "right";
  className?: string;
};

/**
 * Editorial split section: animated type on one side, a sketch on the other.
 *
 * Type scales with clamp() rather than stepping at breakpoints — a vw value
 * per breakpoint reads fine on the widths it was picked for but collapses in
 * between (a `1.7vw` body size is ~11px on a 640px tablet) and can jump
 * backwards at a breakpoint boundary. One continuous curve avoids both.
 */
export default function IllustratedSection({
  eyebrow,
  headlineLines,
  intro,
  points,
  image,
  side = "right",
  className = "",
}: IllustratedSectionProps) {
  const rootRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  // Scopes the styled-jsx-free class names below to this instance, so two
  // sections on one page never animate each other's elements.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const c = (name: string) => `${name}-${uid}`;

  useGSAP(
    () => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: { trigger: rootRef.current, start: "top 72%", once: true },
      });

      tl.from(`.${c("is-eyebrow")}`, { y: -10, opacity: 0, duration: 0.5 })
        // Each line rides up from behind its own overflow-hidden mask, so
        // the type is revealed by an edge rather than fading in.
        .set(`.${c("is-line-inner")}`, { yPercent: 115 })
        .to(`.${c("is-line-inner")}`, { yPercent: 0, duration: 1, stagger: 0.09, ease: "expo.out" }, "-=0.2")
        .from(`.${c("is-intro")}`, { y: 22, opacity: 0, filter: "blur(4px)", duration: 0.8 }, "-=0.55")
        // The sketch resolves out of a blur, so it reads as the drawing
        // being finished rather than an image sliding in.
        .from(
          `.${c("is-art")}`,
          { opacity: 0, scale: 1.05, filter: "blur(16px)", duration: 1.2, ease: "expo.out" },
          "-=1.1"
        );

      if (points?.length) {
        tl.from(`.${c("is-rule")}`, { scaleX: 0, transformOrigin: "left center", duration: 0.8 }, "-=0.6")
          .from(`.${c("is-arrow")}`, { x: -10, opacity: 0, duration: 0.45, stagger: 0.12 }, "-=0.45")
          .from(`.${c("is-point")}`, { y: 14, opacity: 0, duration: 0.55, stagger: 0.12 }, "<0.06");
      }

      if (reducedMotion) return;

      // A slow idle drift, so the sketch keeps a little life once settled.
      gsap.to(`.${c("is-art")}`, { y: -14, duration: 4.5, ease: "sine.inOut", yoyo: true, repeat: -1 });
    },
    { scope: rootRef, dependencies: [reducedMotion] }
  );

  const artFirst = side === "left";

  return (
    <section
      ref={rootRef}
      className={`relative w-full overflow-hidden px-[6%] py-20 sm:py-24 md:px-[8%] lg:px-10 lg:py-32 ${className}`}
    >
      <div className="mx-auto w-full max-w-7xl">

        <p
          className={`${c("is-eyebrow")} flex flex-wrap items-center gap-x-6 gap-y-1 font-[font3] uppercase tracking-[0.28em] text-noir-ink-soft`}
          style={{ fontSize: "clamp(0.6rem, 1.1vw, 0.7rem)" }}
        >
          {eyebrow.map((word) => (
            <span key={word}>{word}</span>
          ))}
        </p>

        <div className="mt-10 grid grid-cols-1 gap-10 lg:mt-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-14">

          <div className={artFirst ? "order-1 lg:order-2" : "order-1"}>
            <h2
              className="font-jakarta-sans font-bold tracking-tight text-noir-ink"
              style={{ fontSize: "clamp(1.75rem, 6.4vw, 4rem)", lineHeight: 1.06 }}
            >
              {headlineLines.map((line) => (
                <span key={line} className="block overflow-hidden">
                  <span
                    className={`${c("is-line-inner")} block`}
                    // The masks are overflow:hidden, which would otherwise
                    // shear descenders off a tight-leading display face. The
                    // pad gives them room; the equal negative margin keeps
                    // the visual line spacing unchanged.
                    style={{ paddingBottom: "0.14em", marginBottom: "-0.14em" }}
                  >
                    {line}
                  </span>
                </span>
              ))}
            </h2>

            <p
              className={`${c("is-intro")} mt-8 max-w-2xl leading-relaxed text-noir-ink-soft lg:mt-10`}
              style={{ fontSize: "clamp(0.95rem, 1.5vw, 1.125rem)" }}
            >
              {intro}
            </p>
          </div>

          <div
            className={`flex justify-center ${
              artFirst ? "order-2 lg:order-1 lg:justify-start" : "order-2 lg:justify-end"
            }`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              sizes="(min-width: 1024px) 44vw, 82vw"
              className={`${c("is-art")} h-auto w-[86%] max-w-[560px] object-contain sm:w-[68%] lg:w-full`}
            />
          </div>
        </div>

        {points?.length ? (
          <div className="mt-14 lg:mt-20">
            <div className={`${c("is-rule")} h-px w-full bg-noir-border`} />

            <ul className="mt-10 space-y-6 lg:space-y-5">
              {points.map((item) => (
                <li key={item} className="flex items-start gap-4 lg:gap-6">
                  <span
                    aria-hidden
                    className={`${c("is-arrow")} mt-[0.3em] shrink-0 font-[font3] text-[var(--accent)]`}
                    style={{ fontSize: "clamp(0.8rem, 1.2vw, 0.95rem)" }}
                  >
                    →
                  </span>
                  <p
                    className={`${c("is-point")} max-w-4xl leading-relaxed text-noir-ink-soft`}
                    style={{ fontSize: "clamp(0.9rem, 1.25vw, 1rem)" }}
                  >
                    {item}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
