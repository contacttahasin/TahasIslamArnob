"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Lenis from "lenis";
import { anton, jetbrainsMono, playfair, spaceGrotesk } from "../shared/fonts";

/* ────────────────────────────────────────────────────────────────────────
   Tuning constants — every knob for the camera lives here.
   ──────────────────────────────────────────────────────────────────────── */

/** World-units of Z between consecutive scenes. Bigger = longer flight
 *  between headlines, and each one passes the lens faster at the end. */
const GAP = 1600;

/** MUST match the CSS `perspective` on the stage. Raise it for a longer
 *  lens (flatter, less dramatic depth); lower it for a wider, punchier one.
 *  Changing this means re-checking the `past` fade and the cull below. */
const PERSP = 1400;

/** Extra push-in on the final scene, in scene-units, so the last headline
 *  keeps advancing instead of stopping dead on the focal plane. */
const END_HOLD = 0.25;

/** Scroll-follower lerp. Lower = heavier, more drone-like camera lag.
 *  Above ~0.2 the weight disappears and it reads as a plain scrub. */
const EASE = 0.075;

/** Depth past which a plane is culled. Apparent scale is PERSP / (PERSP - z),
 *  which runs to infinity as z approaches PERSP — so a plane must be gone
 *  before it gets there. Keep in sync with the `past` fade window. */
const CULL_Z = PERSP - 80;

/** Ambient starfield. STAR_DEPTH is the wrap distance — stars recycle
 *  modulo this, so the field never runs out however far the camera flies. */
const STAR_COUNT = 110;
const STAR_DEPTH = 3200;

/** Camera drift amplitudes (degrees). The sin/cos terms are the idle sway;
 *  the mouse terms are parallax. */
const YAW_SWAY = 2.4;
const YAW_MOUSE = 2.2;
const PITCH_SWAY = 1.6;
const PITCH_MOUSE = 1.6;

const BG = "#0a0705";
const INK = "#f2efec";

/** The live accent the navbar's ThemePicker writes to <html>, so this
 *  section re-tints with the rest of the site the moment the theme
 *  changes. Read as a CSS var rather than a resolved value — including in
 *  the imperatively-built starfield, whose nodes inherit it like any other
 *  descendant. The literal is the spec's original orange, used only if the
 *  var is ever missing. */
const ACCENT_VAR = "var(--accent, #e2542d)";

type Scene = {
  label: string;
  index: string;
  a: string;
  b: string;
  script: string;
  /** Off-axis offsets, so the flight path weaves and banks instead of
   *  running straight down a pipe. */
  x: number;
  y: number;
  ry: number;
};

const SCENES: Scene[] = [
  {
    label: "SCENE 01 — THE APPROACH",
    index: "00.1",
    a: "CREATIVE",
    b: "DEVELOPER",
    script: "Building thoughtful things",
    x: 0,
    y: 0,
    ry: 0,
  },
  {
    label: "SCENE 02 — THE DOLLY",
    index: "00.5",
    a: "BUILDING",
    b: "SCALABLE",
    script: "Systems that hold up",
    x: -120,
    y: 40,
    ry: 7,
  },
  {
    label: "SCENE 03 — THE FOCUS",
    index: "01.2",
    a: "MOTION",
    b: "INTERFACE",
    script: "Pixels with intent",
    x: 140,
    y: -50,
    ry: -8,
  },
  {
    label: "SCENE 04 — THE REVEAL",
    index: "02.0",
    a: "LET'S",
    b: "COLLABORATE",
    script: "Say hello",
    x: -40,
    y: 20,
    ry: 3,
  },
];

/** Total camera travel in scene-units. Derived, so adding a SCENES entry
 *  automatically lengthens the runway, the timeline and the progress rail. */
const SPAN = SCENES.length - 1 + END_HOLD;

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const clamp01 = (v: number) => clamp(v, 0, 1);

export default function DroneScrollHero() {
  const runwayRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const starLayerRef = useRef<HTMLDivElement>(null);
  const sceneRefs = useRef<Array<HTMLDivElement | null>>([]);
  const labelRef = useRef<HTMLSpanElement>(null);
  const indexRef = useRef<HTMLSpanElement>(null);
  const depthRef = useRef<HTMLSpanElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const tickRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    const runway = runwayRef.current;
    const stage = stageRef.current;
    const world = worldRef.current;
    const starLayer = starLayerRef.current;
    if (!runway || !stage || !world || !starLayer) return;

    const ctx = gsap.context(() => {}, runway);

    // Lenis smooths the native scroll; the EASE lerp below then trails
    // behind that smoothed value. Never hijack scroll — the lag between
    // the real position and the camera is what reads as physical weight.
    const lenis = new Lenis();
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    /* ── Starfield ──────────────────────────────────────────────────────
       Built imperatively rather than as React nodes: the positions are
       random, so rendering them during SSR would hydrate mismatched, and
       all 110 are mutated every frame anyway. */
    type Star = { el: HTMLDivElement; x: number; y: number; z: number };
    const stars: Star[] = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      const el = document.createElement("div");
      const accent = i % 9 === 0;
      el.style.cssText = `position:absolute;left:50%;top:50%;width:${
        accent ? 3 : 2
      }px;height:${accent ? 3 : 2}px;border-radius:50%;background:${
        accent ? ACCENT_VAR : INK
      };will-change:transform,opacity;`;
      starLayer.appendChild(el);
      stars.push({
        el,
        x: (Math.random() - 0.5) * 2600,
        y: (Math.random() - 0.5) * 1600,
        z: -Math.random() * STAR_DEPTH,
      });
    }

    /* ── Scroll → camera ────────────────────────────────────────────── */
    let smooth = window.scrollY;
    let runwayTop = 0;
    // Phone dampeners. The scene offsets and camera sway are authored in
    // absolute px/deg, which reads as a gentle weave on a 1440px stage but
    // throws a headline half off a 390px one — ±140px is a third of the
    // viewport there. Scaled down below `sm` so the flight path stays
    // inside the frame; desktop and tablet keep the full values.
    let offsetScale = 1;
    let swayScale = 1;
    let travel = 1;

    const measure = () => {
      runwayTop = runway.getBoundingClientRect().top + window.scrollY;
      // The sticky stage is one viewport tall, so the distance it actually
      // travels is the runway minus that viewport.
      travel = Math.max(runway.offsetHeight - window.innerHeight, 1);

      const isPhone = window.innerWidth < 640;
      offsetScale = isPhone ? 0.22 : 1;
      swayScale = isPhone ? 0.45 : 1;
    };
    measure();
    window.addEventListener("resize", measure);

    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    let cueHidden = false;
    let lastLabel = -1;

    const render = () => {
      smooth += (window.scrollY - smooth) * EASE;

      const progress = clamp01((smooth - runwayTop) / travel);
      const p = progress * SPAN;
      const camZ = p * GAP;

      // Camera drift — idle sway plus mouse parallax.
      const yaw = (Math.sin(p * 0.9) * YAW_SWAY + mouseX * YAW_MOUSE) * swayScale;
      const pitch = (Math.cos(p * 0.7) * PITCH_SWAY - mouseY * PITCH_MOUSE) * swayScale;
      world.style.transform = `rotateX(${pitch}deg) rotateY(${yaw}deg)`;
      stage.style.perspectiveOrigin = `${50 + mouseX * 4}% ${50 + mouseY * 4}%`;

      for (let i = 0; i < SCENES.length; i++) {
        const el = sceneRefs.current[i];
        if (!el) continue;
        const s = SCENES[i];

        const d = p - i; // scene-units in front of (−) / behind (+) the camera
        const z = d * GAP; // 0 = exactly on the focal plane

        if (z >= CULL_Z) {
          el.style.opacity = "0";
          el.style.visibility = "hidden";
          continue;
        }
        el.style.visibility = "visible";

        // Let the browser's perspective divide do the scaling — never
        // compute scale here, or distant text stops being genuinely
        // further away and becomes a fake zoom.
        el.style.transform = `translate3d(${s.x * offsetScale}px, ${s.y * offsetScale}px, ${z}px) rotateY(${
          s.ry * swayScale
        }deg)`;

        const emerge = clamp01((d + 2.6) / 1.0);
        const near = clamp01((d + 1.2) / 1.2);
        // Squared on purpose: a linear falloff leaves the distant plane
        // legible enough to compete with the headline in focus, and the
        // pair reads as a mushy double exposure instead of depth.
        const depthLit = 0.06 + 0.94 * near * near;
        // Must reach 0 before the plane hits CULL_Z, or it pops out of
        // existence mid-flight.
        const past = i === SCENES.length - 1 ? 1 : 1 - clamp01((d - 0.22) / 0.42);
        el.style.opacity = String(emerge * depthLit * past);

        const blur = d < 0 ? clamp(-d - 0.12, 0, 2.0) * 11 : clamp(d - 0.15, 0, 0.7) * 26;
        el.style.filter = blur > 0.01 ? `blur(${blur}px)` : "none";
      }

      for (const star of stars) {
        let z = (star.z + camZ) % STAR_DEPTH;
        if (z > 0) z -= STAR_DEPTH; // keep every star in front of the lens
        star.el.style.transform = `translate3d(${star.x}px, ${star.y}px, ${z}px)`;
        star.el.style.opacity = String(clamp01(1 + z / STAR_DEPTH) * 0.55);
      }

      // HUD is written straight to the DOM — this runs every frame, and
      // React state here would re-render the whole section 60x a second.
      const active = clamp(Math.round(p), 0, SCENES.length - 1);
      if (active !== lastLabel) {
        lastLabel = active;
        if (labelRef.current) labelRef.current.textContent = SCENES[active].label;
        if (indexRef.current) {
          indexRef.current.textContent = `${SCENES[active].index} / ${SCENES[active].label.split("— ")[1]}`;
        }
        tickRefs.current.forEach((tick, i) => {
          if (tick) tick.style.transform = `scaleY(${i <= active ? 1 : 0})`;
        });
      }
      if (depthRef.current) depthRef.current.textContent = `Z ${Math.round(camZ)}`;

      if (!cueHidden && progress > 0.01 && cueRef.current) {
        cueHidden = true;
        gsap.to(cueRef.current, { opacity: 0, duration: 0.4, overwrite: true });
      }
    };

    gsap.ticker.add(render);

    return () => {
      gsap.ticker.remove(render);
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      window.removeEventListener("resize", measure);
      window.removeEventListener("mousemove", onMouseMove);
      stars.forEach((s) => s.el.remove());
      ctx.revert();
    };
  }, []);

  const fontVars = `${anton.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${playfair.variable}`;
  const mono = "var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, Menlo, monospace";
  const display = "var(--font-anton), Impact, 'Arial Narrow Bold', sans-serif";
  const ui = "var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif";
  const script = "var(--font-playfair), Georgia, 'Times New Roman', serif";

  return (
    <div
      ref={runwayRef}
      className={fontVars}
      // The runway is what gives the page real height for the camera to
      // travel through. Without it the sticky stage never moves and
      // scrolling does nothing at all.
      style={{ height: `${(SCENES.length + 0.3) * 100}vh`, background: BG }}
    >
      {/* CSS sticky, deliberately not GSAP's pin: true — pin manufactures
          scroll distance but competes with other pinned sections and
          re-measures wrong once web fonts swap in. */}
      <div
        ref={stageRef}
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          perspective: `${PERSP}px`,
          background: BG,
          color: INK,
        }}
      >
        <div
          ref={worldRef}
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            willChange: "transform",
          }}
        >
          <div ref={starLayerRef} style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }} />

          {SCENES.map((s, i) => (
            <div
              key={s.label}
              ref={(el) => {
                sceneRefs.current[i] = el;
              }}
              className="drone-scene"
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                willChange: "transform, opacity, filter",
              }}
            >
              {/* Wireframe geometry behind the type */}
              <svg
                viewBox="0 0 200 200"
                aria-hidden
                style={{
                  position: "absolute",
                  width: "min(46vw, 460px)",
                  opacity: 0.16,
                  stroke: ACCENT_VAR,
                  strokeWidth: 0.7,
                  fill: "none",
                }}
              >
                {i % 2 === 0 ? (
                  <>
                    <path d="M100 18 L168 78 L100 182 L32 78 Z" />
                    <path d="M32 78 L168 78" />
                    <path d="M100 18 L100 182" />
                    <path d="M66 48 L134 48 L168 78 M66 48 L32 78" />
                  </>
                ) : (
                  <>
                    <ellipse cx="100" cy="52" rx="62" ry="20" />
                    <ellipse cx="100" cy="148" rx="62" ry="20" />
                    <path d="M38 52 L38 148 M162 52 L162 148 M100 32 L100 168" />
                    <ellipse cx="100" cy="100" rx="62" ry="20" />
                  </>
                )}
              </svg>

              <span
                style={{
                  fontFamily: mono,
                  fontSize: "0.65rem",
                  letterSpacing: "0.4em",
                  color: ACCENT_VAR,
                  marginBottom: "1.2rem",
                }}
              >
                {s.index}
              </span>

              <h2
                className="drone-headline"
                style={{
                  fontFamily: display,
                  lineHeight: 0.86,
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase",
                  margin: 0,
                  color: INK,
                }}
              >
                {s.a}
              </h2>

              <span
                style={{
                  fontFamily: script,
                  fontStyle: "italic",
                  fontSize: "clamp(0.9rem, 2vw, 1.35rem)",
                  color: `${INK}99`,
                  margin: "0.35em 0",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {s.script}
              </span>

              <h2
                className="drone-headline"
                style={{
                  fontFamily: display,
                  lineHeight: 0.86,
                  letterSpacing: "-0.02em",
                  textTransform: "uppercase",
                  // Overlaps the line above, per the spec's stacked pair.
                  marginTop: "-0.30em",
                  marginBottom: 0,
                  color: ACCENT_VAR,
                }}
              >
                {s.b}
              </h2>
            </div>
          ))}
        </div>

        {/* Vignette + grain, above the world but below the HUD */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: "radial-gradient(circle at 50% 50%, transparent 32%, rgba(10,7,5,0.92) 100%)",
          }}
        />
        <svg aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.05, pointerEvents: "none", mixBlendMode: "overlay" }}>
          <filter id="drone-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" />
          </filter>
          <rect width="100%" height="100%" filter="url(#drone-grain)" />
        </svg>

        {/* ── HUD ──────────────────────────────────────────────────────
            Absolute inside the stage rather than fixed to the viewport,
            so it appears only while this section is on screen instead of
            floating over the rest of the site. */}
        <div style={{ position: "absolute", top: "5.5rem", left: "1.75rem", display: "flex", alignItems: "center", gap: "0.75rem", pointerEvents: "none" }}>
          <span style={{ width: "2.2rem", height: 1, background: ACCENT_VAR }} />
          <span ref={labelRef} style={{ fontFamily: mono, fontSize: "0.6rem", letterSpacing: "0.32em", color: `${INK}b3` }}>
            {SCENES[0].label}
          </span>
        </div>

        <div style={{ position: "absolute", bottom: "1.75rem", left: "1.75rem", pointerEvents: "none" }}>
          <span ref={indexRef} style={{ fontFamily: mono, fontSize: "0.6rem", letterSpacing: "0.28em", color: `${INK}80` }}>
            {SCENES[0].index} / THE APPROACH
          </span>
        </div>

        <div className="hidden sm:block" style={{ position: "absolute", bottom: "1.75rem", left: "50%", transform: "translateX(-50%)", pointerEvents: "none" }}>
          <span ref={depthRef} style={{ fontFamily: mono, fontSize: "0.6rem", letterSpacing: "0.28em", color: `${INK}66` }}>
            Z 0
          </span>
        </div>

        {/* Progress rail */}
        <div
          className="hidden sm:flex"
          style={{ position: "absolute", right: "1.4rem", top: "50%", transform: "translateY(-50%)", flexDirection: "column", gap: "0.5rem", pointerEvents: "none" }}
        >
          {SCENES.map((s, i) => (
            <span key={s.label} style={{ position: "relative", width: 2, height: 26, background: `${INK}1f` }}>
              <span
                ref={(el) => {
                  tickRefs.current[i] = el;
                }}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: ACCENT_VAR,
                  transform: `scaleY(${i === 0 ? 1 : 0})`,
                  transformOrigin: "top",
                  transition: "transform 0.45s ease",
                }}
              />
            </span>
          ))}
        </div>

        {/* Scroll cue */}
        <div
          ref={cueRef}
          className="drone-cue"
          style={{
            position: "absolute",
            bottom: "4.5rem",
            left: "50%",
            transform: "translateX(-50%)",
            width: 34,
            height: 52,
            borderRadius: 999,
            border: `1px solid ${INK}33`,
            display: "flex",
            justifyContent: "center",
            paddingTop: 9,
            pointerEvents: "none",
          }}
        >
          <span className="drone-cue-dot" style={{ width: 4, height: 4, borderRadius: 999, background: ACCENT_VAR }} />
        </div>

        {/* Border pill */}
        <div
          className="hidden sm:flex"
          style={{
            position: "absolute",
            bottom: "1.6rem",
            right: "1.75rem",
            alignItems: "center",
            gap: "0.55rem",
            padding: "0.5rem 0.95rem",
            borderRadius: 999,
            border: `1px solid ${INK}1f`,
            background: "rgba(242,239,236,0.04)",
            backdropFilter: "blur(10px)",
            pointerEvents: "none",
          }}
        >
          <span className="drone-pulse" style={{ width: 6, height: 6, borderRadius: 999, background: ACCENT_VAR }} />
          <span style={{ fontFamily: ui, fontSize: "0.6rem", letterSpacing: "0.24em", color: `${INK}b3` }}>
            CROSS THE BORDER
          </span>
        </div>

        <style jsx>{`
          .drone-headline {
            font-size: clamp(3rem, 11vw, 10rem);
          }
          /* A plane's apparent size is PERSP / (PERSP - z), so a headline is
             already ~1.8x its own width by the time it fades out on the way
             past the lens. On desktop that overshoot still lands inside the
             frame; on a phone the same ratio pushes the widest word off both
             edges, so the base size comes down and the scene gets side
             padding to blow past within. */
          @media (max-width: 639px) {
            .drone-headline {
              font-size: clamp(1.9rem, 8vw, 3rem);
            }
            .drone-scene {
              padding-left: 7vw;
              padding-right: 7vw;
            }
          }
          .drone-cue-dot {
            animation: drone-bob 1.6s ease-in-out infinite;
          }
          .drone-pulse {
            animation: drone-pulse 1.8s ease-in-out infinite;
          }
          @keyframes drone-bob {
            0%,
            100% {
              transform: translateY(0);
              opacity: 1;
            }
            50% {
              transform: translateY(16px);
              opacity: 0.3;
            }
          }
          @keyframes drone-pulse {
            0%,
            100% {
              opacity: 1;
            }
            50% {
              opacity: 0.25;
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .drone-cue-dot,
            .drone-pulse {
              animation: none;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
