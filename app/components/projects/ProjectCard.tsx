"use client";

import { useCallback, useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { useTranslations } from "next-intl";
import type { PublicProject } from "./types";
import ProjectImage from "./ProjectImage";
import ProjectInfo from "./ProjectInfo";
import { useReducedMotion } from "../shared/hooks/useReducedMotion";

// Capped px pull toward the cursor — a magnetic tug, not a follow.
const MAGNETIC_STRENGTH = 10;
const PARTICLE_COUNT = 5;

/**
 * Premium hover/press micro-interactions layered on top of the existing
 * card — magnetic cursor pull, a cursor-follow spotlight, a border-light
 * sweep, a glass sheen, ambient floating lights, tiny drifting particles,
 * and an elastic press bounce. Every visual layer here only animates
 * transform/opacity (see the `.premium-card-*` rules in globals.css) so it
 * stays on the GPU compositor, and none of it changes this card's box
 * size — everything is absolutely positioned over the existing content, so
 * there's no layout shift. The pre-existing hover states (image zoom,
 * title color, arrow nudge, "view more" reveal) are untouched.
 */
export default function ProjectCard({ project, onOpen }: { project: PublicProject; onOpen: () => void }) {
  const t = useTranslations("common");
  const reducedMotion = useReducedMotion();
  const surfaceRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<{ mx: number; my: number; tx: number; ty: number } | null>(null);
  const elasticTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyPending = useCallback(() => {
    rafRef.current = null;
    const el = surfaceRef.current;
    const pending = pendingRef.current;
    if (!el || !pending) return;
    el.style.setProperty("--mx", `${pending.mx}%`);
    el.style.setProperty("--my", `${pending.my}%`);
    el.style.setProperty("--tx", `${pending.tx}px`);
    el.style.setProperty("--ty", `${pending.ty}px`);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Mouse/trackpad only — a touch drag firing this would read as the
      // card fighting the user's scroll, not a magnetic hover effect.
      if (reducedMotion || e.pointerType !== "mouse") return;
      const el = surfaceRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;
      const tx = ((px - 50) / 50) * MAGNETIC_STRENGTH;
      const ty = ((py - 50) / 50) * MAGNETIC_STRENGTH;
      pendingRef.current = { mx: px, my: py, tx, ty };
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(applyPending);
      }
    },
    [applyPending, reducedMotion]
  );

  const resetSurface = useCallback(() => {
    const el = surfaceRef.current;
    if (!el) return;
    el.style.setProperty("--tx", "0px");
    el.style.setProperty("--ty", "0px");
  }, []);

  const handlePointerUp = useCallback(() => {
    const el = surfaceRef.current;
    if (!el || reducedMotion) return;
    if (elasticTimeoutRef.current) clearTimeout(elasticTimeoutRef.current);
    el.classList.remove("premium-card-elastic");
    // Force a reflow so re-adding the class restarts the animation even
    // if a rapid double-tap fires this before the previous run finished.
    void el.offsetWidth;
    el.classList.add("premium-card-elastic");
    elasticTimeoutRef.current = setTimeout(() => el.classList.remove("premium-card-elastic"), 500);
  }, [reducedMotion]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (elasticTimeoutRef.current) clearTimeout(elasticTimeoutRef.current);
    };
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onOpen();
      }
    },
    [onOpen]
  );

  return (
    <div
      className="premium-card group block cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetSurface}
      onPointerUp={handlePointerUp}
      aria-label={`${t("viewProject")} — ${project.title}`}
    >
      <div ref={surfaceRef} className="premium-card-surface relative">
        {/* Ambient floating lights — soft, always-on life behind the card
            (frozen under prefers-reduced-motion via the CSS rule). Allowed
            to bleed past the rounded corners since this wrapper isn't
            clipped — the grid's own gap-x-8/gap-y-14 leaves room. */}
        <div className="premium-card-ambient-a pointer-events-none absolute -inset-6 -z-10 rounded-full bg-[radial-gradient(circle,rgba(var(--accent-rgb),0.16),transparent_70%)] blur-2xl" />
        <div className="premium-card-ambient-b pointer-events-none absolute -inset-8 -z-10 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_70%)] blur-2xl" />

        <div className="premium-card-clip relative overflow-hidden rounded-2xl">
          <ProjectImage project={project} />

          {/* Border light sweep */}
          <div className="premium-card-border-sweep pointer-events-none absolute inset-0 rounded-2xl" />
          {/* Cursor-follow spotlight glow */}
          <div className="premium-card-glow pointer-events-none absolute inset-0" />
          {/* Glass reflection sweep */}
          <div className="premium-card-sheen pointer-events-none absolute inset-0" />
          {/* Top-edge animated highlight */}
          <div className="premium-card-highlight pointer-events-none absolute inset-x-0 top-0" />

          {/* Tiny ambient particles */}
          {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
            <span
              key={i}
              className="premium-card-particle pointer-events-none absolute h-1 w-1 rounded-full bg-white/70"
              style={
                {
                  left: `${14 + i * 18}%`,
                  bottom: "10%",
                  animationDelay: `${i * 0.55}s`,
                  "--particle-x": `${(i % 2 === 0 ? 1 : -1) * (6 + i * 2)}px`,
                } as React.CSSProperties
              }
            />
          ))}

          <div className="absolute inset-x-6 bottom-6 flex translate-y-3 items-center gap-2 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label={`${t("viewCode")} — ${project.title}`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-noir-ink text-noir-bg shadow-[0_10px_30px_-8px_rgba(0,0,0,0.5)] transition-transform duration-300 hover:scale-105"
              >
                <FontAwesomeIcon icon={faGithub} className="h-4 w-4" />
              </a>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpen();
              }}
              aria-label={`${t("viewMore")} — ${project.title}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-noir-ink px-5 py-3 text-sm font-semibold text-noir-bg shadow-[0_10px_30px_-8px_rgba(0,0,0,0.5)] transition-transform duration-300 hover:scale-[1.02]"
            >
              {t("viewMore")}
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>

        <ProjectInfo project={project} />
      </div>
    </div>
  );
}
