"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import NextImage from "next/image";
import gsap from "gsap";
import SplitType from "split-type";
import useSound from "use-sound";
import { jakarta } from "../shared/fonts";
import { introPhotos } from "@/data/introPhotos";
import { useUiSoundEnabled } from "@/app/lib/uiSoundContext";

const SESSION_KEY = "intro-played-v1";

/** Photo flash runs twice through the array (reversed on the second pass
 * so consecutive frames never repeat the same image) to pack more visible
 * changes into the fixed 1s window without needing more source photos. */
const FLASH_TOTAL_DURATION = 1;
const FLASH_SEQUENCE = [...introPhotos, ...introPhotos.slice().reverse()];
const FLASH_STEP = FLASH_TOTAL_DURATION / FLASH_SEQUENCE.length;

/** Inline film-grain: a tiled SVG feTurbulence noise, no binary asset needed. */
const GRAIN_URL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'>
      <filter id='n'>
        <feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/>
        <feColorMatrix type='saturate' values='0'/>
      </filter>
      <rect width='100%' height='100%' filter='url(#n)'/>
    </svg>`
  );

/**
 * Master orchestrator for the homepage intro: a fast photo flash (1s),
 * straight into the name/role reveal, then a wipe into the Hero. No
 * loading readout and no 3D scene — deliberately quick and direct.
 *
 * Layering: the curtain (fixed, z-100000) sits above the site's global
 * nav (app/layout.tsx, `fixed z-99999`) so it fully blacks out the screen,
 * and is the only piece that mounts/unmounts — the real page underneath
 * is untouched and simply revealed when the curtain wipes away.
 *
 * Plays once per browser session (sessionStorage) and is skipped entirely
 * under prefers-reduced-motion.
 */
export default function CinematicIntro() {
  const [showCurtain, setShowCurtain] = useState(false);
  const [ready, setReady] = useState(false);
  const [photosReady, setPhotosReady] = useState(false);

  const curtainRef = useRef<HTMLDivElement>(null);
  const grainRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const flashImgRefs = useRef<Array<HTMLImageElement | null>>([]);
  const flashCaptionRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const introAudioRef = useRef<HTMLAudioElement | null>(null);

  const { enabled: soundEnabled } = useUiSoundEnabled();
  const [playChime] = useSound("/audio/ui/chime.wav", { volume: 0.5, soundEnabled });
  const [playClick] = useSound("/audio/ui/click.wav", { volume: 0.4, soundEnabled });

  // `playChime`'s identity changes whenever `soundEnabled` is toggled. The
  // timeline-building effect below must call whatever the latest chime is
  // at the moment it fires, but shouldn't rebuild (and replay) the whole
  // intro timeline just because the sound toggle flipped mid-intro — so the
  // latest chime is read through a ref instead of being an effect dependency.
  const playChimeRef = useRef(playChime);
  useEffect(() => {
    playChimeRef.current = playChime;
  }, [playChime]);

  /* eslint-disable react-hooks/set-state-in-effect --
   * one-time mount decision (sessionStorage/matchMedia aren't available
   * during SSR) to skip straight to the Hero instead of playing the intro. */
  // Decide once, synchronously on mount: play, or skip straight to the Hero.
  useEffect(() => {
    const alreadyPlayed = sessionStorage.getItem(SESSION_KEY) === "1";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (alreadyPlayed || reduced) {
      setReady(true);
      return;
    }
    sessionStorage.setItem(SESSION_KEY, "1");
    setShowCurtain(true);
    setReady(true);

    // Preload the flash photos before the timeline starts so the 1s cycle
    // never stalls on a late image fetch — capped so a slow connection
    // can't block the intro indefinitely.
    let cancelled = false;
    const preload = Promise.all(
      introPhotos.map(
        (photo) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = photo.src;
          })
      )
    );
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 1200));
    Promise.race([preload, timeout]).then(() => {
      if (!cancelled) setPhotosReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useLayoutEffect(() => {
    if (!showCurtain || !photosReady) return;
    if (!headingRef.current || !subRef.current) return;

    const ctx = gsap.context(() => {
      const heading = new SplitType(headingRef.current!, { types: "chars" });
      const sub = new SplitType(subRef.current!, { types: "chars" });
      const headingChars = heading.chars ?? [];
      const subChars = sub.chars ?? [];

      gsap.set([headingChars, subChars], {
        opacity: 0,
        y: 26,
        rotateX: -35,
        filter: "blur(10px)",
        transformPerspective: 600,
      });
      gsap.set(glowRef.current, { opacity: 0, scale: 0.85 });
      gsap.set(grainRef.current, { opacity: 0 });
      gsap.set(skipRef.current, { opacity: 0 });
      gsap.set(curtainRef.current, { yPercent: 0 });
      gsap.set(flashImgRefs.current, { opacity: 0, scale: 1.04 });
      if (flashCaptionRef.current) {
        flashCaptionRef.current.textContent = FLASH_SEQUENCE[0]?.caption ?? "";
      }

      const finishIntro = () => {
        introAudioRef.current?.pause();
        setShowCurtain(false);
      };

      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        onComplete: finishIntro,
      });
      timelineRef.current = tl;

      // Skip is available from the very first frame.
      tl.to(skipRef.current, { opacity: 0.6, duration: 0.4 }, 0);

      // Photo Flash: a rapid, hard-cut sequence of portraits with a punch
      // word per frame, capped to exactly 1 second.
      tl.addLabel("flash", 0);
      tl.call(
        () => {
          const audio = introAudioRef.current;
          if (!audio) return;
          audio.currentTime = 0;
          // Autoplay can be blocked by the browser; fail silently so the
          // intro animation is never affected either way.
          audio.play().catch(() => {});
        },
        [],
        "flash"
      );
      FLASH_SEQUENCE.forEach((photo, i) => {
        const at = `flash+=${(i * FLASH_STEP).toFixed(4)}`;
        tl.set(flashImgRefs.current, { opacity: 0 }, at)
          .fromTo(
            flashImgRefs.current[i % introPhotos.length],
            { opacity: 1, scale: 1.04 },
            { opacity: 1, scale: 1, duration: FLASH_STEP, ease: "power1.out" },
            at
          )
          .call(
            () => {
              if (flashCaptionRef.current) flashCaptionRef.current.textContent = photo.caption;
            },
            [],
            at
          );
      });
      tl.addLabel("flashEnd", `flash+=${FLASH_TOTAL_DURATION}`)
        .to(flashRef.current, { opacity: 0, duration: 0.25, ease: "power2.in" }, "flashEnd")
        .to(flashCaptionRef.current, { opacity: 0, duration: 0.2 }, "flashEnd")
        .to(grainRef.current, { opacity: 0.3, duration: 0.4, ease: "sine.out" }, "flashEnd")
        .to(glowRef.current, { opacity: 0.18, scale: 1, duration: 0.5, ease: "sine.out" }, "flashEnd");

      // Typography Reveal: character-level blur/fade/rise, straight after
      // the flash — no loading beat in between. The chime is best-effort:
      // browsers block audio until a user gesture, so on a cold first
      // visit (no prior click) it may not audibly play — that's expected
      // platform behavior, not a bug.
      tl.addLabel("typography", "flashEnd+=0.15")
        .call(() => playChimeRef.current(), [], "typography")
        .to(
          headingChars,
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            filter: "blur(0px)",
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.03,
          },
          "typography"
        )
        .to(
          subChars,
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            filter: "blur(0px)",
            duration: 0.6,
            ease: "power3.out",
            stagger: 0.018,
          },
          "typography+=0.3"
        );

      // Screen Transition: a short hold so the name reads, then the
      // curtain wipes upward, landing directly on the homepage.
      tl.addLabel("wipe", "typography+=1.1")
        .to([headingChars, subChars], { opacity: 0, y: -10, duration: 0.35, ease: "power2.in" }, "wipe")
        .to(grainRef.current, { opacity: 0, duration: 0.4 }, "wipe")
        .to(glowRef.current, { opacity: 0, duration: 0.4 }, "wipe")
        .to(skipRef.current, { opacity: 0, duration: 0.3 }, "wipe")
        .to(curtainRef.current, { yPercent: -100, duration: 0.9, ease: "power4.inOut" }, "wipe+=0.1");
    });

    const audioEl = introAudioRef.current;
    return () => {
      ctx.revert();
      audioEl?.pause();
    };
  }, [showCurtain, photosReady]);

  function handleSkip() {
    playClick();
    timelineRef.current?.progress(1);
  }

  if (!ready || !showCurtain) return null;

  return (
    <div
      ref={curtainRef}
      className={`fixed inset-0 z-100000 flex items-center justify-center overflow-hidden bg-noir-bg ${jakarta.variable}`}
    >
      <audio ref={introAudioRef} src="/hero/intro.mp3" preload="auto" playsInline className="hidden" aria-hidden="true" />

      <div ref={flashRef} aria-hidden="true" className="absolute inset-0 z-0">
        {introPhotos.map((photo, i) => (
          <NextImage
            key={photo.src}
            ref={(el) => {
              flashImgRefs.current[i] = el;
            }}
            src={photo.src}
            alt={photo.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ))}
        <div className="absolute inset-0 bg-noir-bg/50" />
      </div>

      <div
        ref={flashCaptionRef}
        aria-hidden="true"
        className="absolute bottom-10 left-6 right-6 z-10 font-jakarta-sans text-4xl font-semibold uppercase tracking-tight text-noir-gold-bright sm:bottom-14 sm:left-10 sm:right-10 sm:text-6xl"
      />

      <div
        ref={glowRef}
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[38vmax] w-[38vmax] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(217,178,111,0.55) 0%, rgba(151,143,102,0.18) 45%, transparent 72%)",
          filter: "blur(30px)",
        }}
      />

      <div
        ref={grainRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 mix-blend-overlay"
        style={{ backgroundImage: `url("${GRAIN_URL}")`, backgroundSize: "180px 180px" }}
      />

      <div aria-hidden="true" className="relative z-10 flex flex-col items-center text-center px-6">
        <div
          ref={headingRef}
          className="font-jakarta-sans text-[8vw] sm:text-5xl md:text-6xl font-semibold tracking-tight text-noir-ink"
          style={{ perspective: 600 }}
        >
          Tahasin Islam
        </div>
        <div
          ref={subRef}
          className="mt-3 text-sm sm:text-base md:text-lg tracking-[0.25em] uppercase text-noir-gold-bright"
          style={{ perspective: 600 }}
        >
          Creative Frontend Developer
        </div>
      </div>

      <button
        ref={skipRef}
        type="button"
        aria-label="Skip intro"
        onClick={handleSkip}
        data-no-sound
        className="fixed right-6 top-6 z-30 rounded-full border border-noir-border/80 bg-noir-surface/60 px-4 py-2 text-xs uppercase tracking-[0.2em] text-noir-ink-soft backdrop-blur-sm transition-colors hover:border-noir-gold-bright hover:text-noir-gold-bright focus-visible:outline focus-visible:outline-2 focus-visible:outline-noir-gold-bright"
      >
        Skip
      </button>
    </div>
  );
}
