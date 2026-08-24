'use client';

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook, faInstagram, faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { about } from "@/data/about";
import StrokeText from "@/components/StrokeText";
import TextType from "@/components/TextType";
import FoldText from "@/components/FoldText";
import { useResponsiveFontSize } from "../shared/hooks/useResponsiveFontSize";
import SpecularButton from "../shared/SpecularButton";

gsap.registerPlugin(useGSAP, ScrollTrigger, MotionPathPlugin);

/** Mirrors the accent headline line's Tailwind size stack, since StrokeText
 *  takes a numeric px size rather than a CSS value. */
const ACCENT_LINE_FONT_SIZE_RULES = [
  { minWidth: 0, vw: 10.5 },
  { minWidth: 768, vw: 8 },
  { minWidth: 1024, vw: 5.5 },
];

const DESC_FONT_SIZE_RULES = [
  { minWidth: 0, px: 14 },
  { minWidth: 1024, px: 18 },
];

const SOCIAL_ICONS = {
  facebook: faFacebook,
  instagram: faInstagram,
  whatsapp: faWhatsapp,
};

const ROLES = [
  "WEB DEVELOPER...",
  "UI/UX DESIGNER...",
  "SEO EXPERT...",
  "FRONTEND DEVELOPER...",
  "BACKEND DEVELOPER...",
];

/** The reference lays the name out as three stacked lines with the last one
 *  in the accent colour — same shape as its Builder./Brewer./Wanderer. */
const NAME_LINES = ["Tahasin.", "Islam.", "Arnob."];

/** Three stats sit under the portrait in the reference. Labels come from
 *  data/about.ts so the copy has one source of truth. */
const HERO_STATS = about.stats.slice(0, 3);

function HomeText() {
  const [roleIndex, setRoleIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showNameEffect, setShowNameEffect] = useState(false);
  const [showDescEffect, setShowDescEffect] = useState(false);
  const [showCtaTypeEffect, setShowCtaTypeEffect] = useState(false);
  const accentFontSize = useResponsiveFontSize(ACCENT_LINE_FONT_SIZE_RULES, 60);
  const descFontSize = useResponsiveFontSize(DESC_FONT_SIZE_RULES, 16);

  const rootRef = useRef(null);
  const statRefs = useRef([]);
  const crawlerRef = useRef(null);
  const crawlPathRef = useRef(null);

  // ================= GSAP Animation =================

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

      // Each headline line rides up from behind its own overflow-hidden
      // mask, so the letters are revealed by the edge rather than just
      // fading — the masked rise is what makes it read as typeset rather
      // than animated.
      // Every step is fromTo rather than from. `from` infers the end state
      // from whatever the element happens to look like when the tween is
      // built — and this timeline calls setState partway through, so React
      // re-renders (and, in development, StrictMode's double mount) can
      // leave a tween's inline start values applied with nothing left to
      // animate them away. That stranded the CTA buttons at y=24/opacity 0.
      // Stating both ends explicitly means the elements land correctly even
      // if a tween is interrupted or rebuilt.
      tl.set(".name-line-inner", { yPercent: 115 })
        .fromTo(
          ".back",
          { y: -16, opacity: 0, scale: 0.92 },
          { y: 0, opacity: 1, scale: 1, duration: 0.7, delay: 1.1 }
        )
        .to(".name-line-inner", { yPercent: 0, duration: 1.05, stagger: 0.09, ease: "expo.out" }, "-=0.35")
        .call(() => setShowNameEffect(true))
        .fromTo(
          ".chnageo",
          { x: -40, opacity: 0, filter: "blur(6px)" },
          { x: 0, opacity: 1, filter: "blur(0px)", duration: 0.8 },
          "-=0.55"
        )
        .fromTo(
          ".desc",
          { y: 24, opacity: 0, filter: "blur(4px)" },
          { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.8 },
          "-=0.45"
        )
        .call(() => setShowDescEffect(true))
        .fromTo(
          ".cta a",
          { y: 24, opacity: 0, scale: 0.9 },
          { y: 0, opacity: 1, scale: 1, duration: 0.7, stagger: 0.15, ease: "back.out(1.6)" },
          "-=0.4"
        )
        .call(() => setShowCtaTypeEffect(true))
        .fromTo(
          ".social a",
          { opacity: 0, scale: 0.7 },
          { opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: "back.out(2)" },
          "-=0.35"
        )
        // The portrait resolves out of a blur as it settles, so it reads as
        // the drawing being finished rather than a picture sliding in.
        .fromTo(
          ".portrait",
          { opacity: 0, scale: 1.06, filter: "blur(14px)" },
          { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1.2, ease: "expo.out" },
          "-=1.4"
        )
        .fromTo(".stat", { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 }, "-=0.5")
        .fromTo(
          ".hero-rule",
          { scaleX: 0 },
          { scaleX: 1, transformOrigin: "left center", duration: 0.9 },
          "-=0.5"
        )
        .fromTo(".hero-foot", { opacity: 0 }, { opacity: 1, duration: 0.6 }, "-=0.4");

      // Crawler loop — starts once the name has finished revealing, then
      // runs forever. `align` maps the SVG path into the crawler's own
      // coordinate space, so the squiggle keeps matching the headline as
      // the viewport (and the vw-based type) resizes; `autoRotate` turns
      // the blob to face along the curve.
      // Read the preference straight from the media query instead of a
      // React value — keeping it out of the hook's dependencies is what
      // lets this timeline stay a run-once intro (see the note below).
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (crawlerRef.current && crawlPathRef.current && !reduced) {
        gsap.set(crawlerRef.current, { opacity: 1, xPercent: -50, yPercent: -50 });
        gsap.to(crawlerRef.current, {
          motionPath: {
            path: crawlPathRef.current,
            align: crawlPathRef.current,
            alignOrigin: [0.5, 0.5],
            autoRotate: true,
          },
          duration: 9,
          delay: 2.6,
          ease: "none",
          repeat: -1,
        });
      }

      // Stat values count up once, on the same beat the row appears.
      HERO_STATS.forEach((stat, i) => {
        const el = statRefs.current[i];
        if (!el) return;
        const counter = { val: 0 };
        tl.to(
          counter,
          {
            val: stat.value,
            duration: 1.1,
            ease: "power2.out",
            onUpdate: () => {
              el.textContent = `${Math.round(counter.val)}${stat.suffix ?? ""}`;
            },
          },
          "-=1.4"
        );
      });
    },
    // No dependency array on purpose: this timeline drives the one-time
    // intro and calls setState partway through it. Re-running it would
    // revert GSAP's inline styles mid-flight and strand the CTA buttons
    // at their `.from()` start values.
    { scope: rootRef }
  );

  // ================= Type Writer =================

  useEffect(() => {
    const current = ROLES[roleIndex];

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          setText(current.slice(0, text.length + 1));

          if (text.length + 1 === current.length) {
            setTimeout(() => {
              setIsDeleting(true);
            }, 1000);
          }
        } else {
          setText(current.slice(0, text.length - 1));

          if (text.length === 1) {
            setIsDeleting(false);
            setRoleIndex((prev) => (prev + 1) % ROLES.length);
          }
        }
      },
      isDeleting ? 50 : 100
    );

    return () => clearTimeout(timeout);
  }, [text, isDeleting, roleIndex]);

  return (
    <section
      ref={rootRef}
      className="relative w-full bg-bg-primary text-ink overflow-hidden"
    >
      {/* Accent-tinted ambient lighting — follows whichever theme colour the
          navbar's picker has selected. */}
      <div className="pointer-events-none absolute -top-40 left-1/4 h-130 w-130 rounded-full bg-noir-gold/10 blur-[160px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-105 w-105 translate-y-1/3 rounded-full bg-noir-gold-bright/10 blur-[150px]" />

      {/* Phone gets a hard one-viewport frame: `svh` rather than `vh` so the
          mobile browser's collapsing address bar can't push the bottom of
          the section out of view. The grid below then distributes into it —
          the type column keeps its natural height and the portrait column
          takes whatever is left, so nothing ever overflows. From lg up this
          reverts to a normal, freely-growing section. */}
      <div className="relative mx-auto flex h-svh w-full max-w-7xl flex-col overflow-hidden px-[6%] pt-24 pb-5 md:px-[8%] lg:h-auto lg:min-h-screen lg:justify-center lg:overflow-visible lg:px-10 lg:pt-36 lg:pb-10">

        {/* Flex column on phone so the portrait column's `flex-1` actually
            resolves — a grid item would ignore it. Grid only from lg up,
            where the two columns sit side by side. */}
        <div className="flex min-h-0 flex-1 flex-col gap-5 lg:grid lg:flex-none lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">

          {/* ── LEFT: type ─────────────────────────────────────────── */}
          <div className="order-1 shrink-0">

            <p className="back flex w-fit items-start gap-2.5 font-[font3] text-[2.6vw] uppercase leading-relaxed tracking-[0.16em] text-ink-secondary md:text-[1.1vw] lg:gap-3 lg:text-xs lg:tracking-[0.18em]">
              <span className="mt-[0.4em] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)] lg:h-2 lg:w-2" />
              <span>{about.availability.message}</span>
            </p>

            <div className="relative mt-4 lg:mt-8">
            {/* Crawler — the gsap.com hero's signature move. A small accent
                blob rides a squiggle path threaded through the name, the
                way their worm walks over "anyth!ng". Sits above the type
                but ignores pointer events, and the path itself is never
                painted. */}
            <svg
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10 h-full w-full"
              viewBox="0 0 400 220"
              preserveAspectRatio="none"
            >
              <path
                ref={crawlPathRef}
                d="M 18 42 C 90 8, 150 78, 214 44 S 330 16, 386 58 S 300 132, 214 118 S 90 108, 26 152 S 150 214, 300 186"
                fill="none"
                stroke="none"
              />
            </svg>
            <span
              ref={crawlerRef}
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 z-10 block h-[1.1vw] w-[3.6vw] rounded-full opacity-0 blur-[0.5px] lg:h-2 lg:w-7"
              style={{
                background:
                  "linear-gradient(90deg, rgba(var(--accent-rgb),0.25), var(--accent) 55%, rgba(var(--accent-rgb),0.35))",
                boxShadow: "0 0 18px rgba(var(--accent-rgb),0.55)",
              }}
            />

            <h1 className="relative font-[font1] text-[10.5vw] font-bold leading-[0.95] tracking-tight text-ink md:text-[8vw] lg:text-[5.5vw]">
              {NAME_LINES.map((line, i) => {
                const isAccent = i === NAME_LINES.length - 1;
                return (
                  <span key={line} className="block overflow-hidden">
                    <span className="name-line-inner block">
                      {isAccent && showNameEffect ? (
                        <StrokeText
                          text={line}
                          strokeColor="var(--accent)"
                          fillColor="var(--accent)"
                          fontSize={accentFontSize}
                          fontWeight={700}
                          letterSpacing={0}
                        />
                      ) : (
                        <span className={isAccent ? "text-[var(--accent)]" : undefined}>{line}</span>
                      )}
                    </span>
                  </span>
                );
              })}
            </h1>
            </div>

            <p className="chnageo mt-3 font-[font3] text-[3.2vw] uppercase tracking-[2px] text-noir-gold-bright md:text-[1.5vw] lg:mt-5 lg:text-[1.05vw]">
              {text}
              <span className="animate-pulse">|</span>
            </p>

            <p className="desc mt-3 max-w-md text-[3.2vw] leading-snug text-ink-secondary md:text-[1.4vw] lg:mt-6 lg:text-lg lg:leading-relaxed">
              {showDescEffect ? (
                <FoldText
                  text={about.bio}
                  splitBy="word"
                  hinge="top"
                  trigger="mount"
                  duration={0.55}
                  stagger={0.02}
                  ease="power3.out"
                  perspective={500}
                  creaseShading={0.35}
                  fontSize={descFontSize}
                  fontWeight="inherit"
                  color="currentColor"
                  style={{ lineHeight: "inherit", letterSpacing: "normal" }}
                />
              ) : (
                about.bio
              )}
            </p>

            <div className="cta mt-5 flex flex-wrap items-center gap-2.5 lg:mt-9 lg:gap-3">
              <SpecularButton
                href="/contact"
                ariaLabel="Hire Me"
                size="md"
                radius={12}
                className="font-[font3]"
              >
                {showCtaTypeEffect ? (
                  <TextType as="span" text={["Hire Me"]} loop={false} showCursor={false} typingSpeed={70} />
                ) : (
                  "Hire Me"
                )}
                <span aria-hidden>→</span>
              </SpecularButton>

              <Link
                href="/projects"
                className="inline-flex items-center gap-2 border border-line px-5 py-3 font-[font3] text-[3.1vw] text-ink transition-all hover:scale-[1.03] hover:border-[rgba(var(--accent-rgb),0.6)] md:text-[1.2vw] lg:px-9 lg:py-4 lg:text-base"
              >
                View Projects
                <span aria-hidden>→</span>
              </Link>
            </div>

            <div className="social mt-4 flex items-center gap-2.5 lg:mt-8 lg:gap-3">
              {about.socials.map(({ label, href, icon }) => {
                const iconDef = SOCIAL_ICONS[icon];
                if (!href || !iconDef) return null;

                return (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-secondary transition-colors hover:border-[rgba(var(--accent-rgb),0.6)] hover:text-ink lg:h-9 lg:w-9"
                  >
                    <FontAwesomeIcon icon={iconDef} className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT: portrait + stats ────────────────────────────── */}
          {/* On phone this column is the flexible one: `min-h-0 flex-1` lets
              it absorb whatever the type column left over, and the portrait
              inside scales to that instead of forcing the page taller. */}
          <div className="order-2 flex min-h-0 flex-1 flex-col items-center lg:flex-none lg:items-end">
            <div className="portrait flex min-h-0 w-full flex-1 items-center justify-center lg:block lg:w-full lg:max-w-[520px] lg:flex-none">
              <Image
                src="/hero/portrait-sketch.png"
                alt={about.name}
                width={1220}
                height={1300}
                priority
                sizes="(min-width: 1024px) 520px, 70vw"
                className="h-full max-h-full w-auto max-w-full object-contain lg:h-auto lg:w-full"
              />
            </div>

            <div className="mt-4 grid w-full shrink-0 grid-cols-3 gap-3 lg:mt-12 lg:gap-6">
              {HERO_STATS.map((stat, i) => (
                <div key={stat.label} className="stat">
                  <p className="font-[font1] text-[5.5vw] font-bold leading-none text-ink md:text-[3.6vw] lg:text-[2.5vw]">
                    <span
                      ref={(el) => {
                        statRefs.current[i] = el;
                      }}
                    >
                      0{stat.suffix ?? ""}
                    </span>
                  </p>
                  <p className="mt-1.5 font-[font3] text-[2.1vw] uppercase leading-snug tracking-[0.14em] text-ink-secondary md:text-[0.95vw] lg:mt-2 lg:text-[11px] lg:tracking-[0.16em]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Foot rule + index ──────────────────────────────────────
            Desktop only — on phone the whole section is boxed to one
            viewport, and this is the one piece that carries no content the
            page doesn't say elsewhere. */}
        <div className="hidden lg:mt-16 lg:block">
          <div className="hero-rule h-px w-full bg-line" />
          <p className="hero-foot mt-5 font-[font3] text-[11px] uppercase tracking-[0.28em] text-ink-secondary">
            01 / NOW <span className="ml-4 text-ink-muted">CURRENTLY</span>
          </p>
        </div>
      </div>

    </section>
  );
}

export default HomeText;
