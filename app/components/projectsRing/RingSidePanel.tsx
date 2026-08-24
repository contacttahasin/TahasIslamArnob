"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { PublicProject } from "@/app/components/projects/types";
import { useReducedMotion } from "../shared/hooks/useReducedMotion";

type RingSidePanelProps = {
  project: PublicProject;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

/**
 * Floating project detail panel — docks to the right of the ring on
 * desktop/tablet, becomes a bottom sheet on mobile. Replaces the old
 * centered RingModal overlay: no dimming backdrop (the ring stays visible
 * behind it, matching the reference), just an invisible click-catcher for
 * "click outside to close" plus Escape/close-button/prev-next, all of
 * which still work identically to before.
 */
export default function RingSidePanel({ project, index, total, onClose, onPrev, onNext }: RingSidePanelProps) {
  const t = useTranslations("projectsRing");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    closeButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, onPrev, onNext]);

  const panelTransition = reducedMotion
    ? { duration: 0.15 }
    : { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <>
      {/* Invisible click-catcher — no visual backdrop (the ring stays
          visible, matching the reference), just closes on an outside
          click same as the old modal's backdrop did. */}
      <motion.button
        type="button"
        aria-label={t("close")}
        onClick={onClose}
        className="fixed inset-0 z-[999998] cursor-default"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ring-panel-title"
        onClick={(e) => e.stopPropagation()}
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 24, y: 0 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 24 }}
        transition={panelTransition}
        className="fixed inset-x-0 bottom-0 z-[999999] flex max-h-[85vh] w-full flex-col overflow-y-auto rounded-t-3xl border border-noir-border bg-noir-surface/95 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.75)] backdrop-blur-xl sm:inset-x-auto sm:inset-y-0 sm:right-4 sm:top-24 sm:bottom-4 sm:h-auto sm:max-h-[calc(100vh-7rem)] sm:w-full sm:max-w-md sm:rounded-3xl md:right-8"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-noir-border bg-noir-surface/80 text-noir-ink backdrop-blur-md transition-all duration-300 hover:rotate-90 hover:border-noir-gold/60 hover:text-noir-gold-bright"
        >
          <X size={18} />
        </button>

        <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-t-3xl bg-noir-surface">
          <Image
            src={project.image}
            alt={project.title}
            fill
            sizes="(max-width: 768px) 100vw, 448px"
            className="object-cover"
            priority
          />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-noir-surface via-transparent to-transparent" />
        </div>

        <div className="flex flex-col gap-5 p-6 sm:p-8">
          <h2
            id="ring-panel-title"
            className="font-jakarta-sans text-2xl font-bold uppercase tracking-tight text-noir-ink sm:text-3xl"
          >
            {project.title}
          </h2>

          <p className="text-sm leading-relaxed text-noir-ink-soft">{project.description}</p>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-noir-ink-faint">
              {t("techStack")}
            </p>
            <div className="flex flex-wrap gap-2">
              {project.tech.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-noir-border bg-noir-surface/70 px-4 py-1.5 text-xs font-medium text-noir-ink-soft backdrop-blur-md"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {(project.github || project.live) && (
            <div className="flex flex-wrap gap-3">
              {project.live && (
                <a
                  href={project.live}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-noir-gold to-noir-gold-bright px-6 py-3 text-sm font-semibold tracking-wide text-noir-bg shadow-[0_10px_30px_-8px_rgba(var(--accent-rgb),0.55)] transition-transform duration-300 hover:scale-[1.03]"
                >
                  {t("viewLive")}
                  <ArrowUpRight size={16} />
                </a>
              )}
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-noir-border px-6 py-3 text-sm font-semibold text-noir-ink transition-colors duration-300 hover:border-noir-gold/60 hover:text-noir-gold-bright"
                >
                  <FontAwesomeIcon icon={faGithub} className="h-4 w-4" />
                  {t("viewCode")}
                </a>
              )}
            </div>
          )}

          <div className="mt-2 flex items-center justify-between border-t border-noir-border pt-5">
            <button
              type="button"
              onClick={onPrev}
              aria-label={t("previous")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-noir-border text-noir-ink transition-colors duration-300 hover:border-noir-gold/60 hover:text-noir-gold-bright"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="text-xs font-medium tracking-wide text-noir-ink-faint">
              {index + 1} / {total}
            </span>

            <button
              type="button"
              onClick={onNext}
              aria-label={t("next")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-noir-border text-noir-ink transition-colors duration-300 hover:border-noir-gold/60 hover:text-noir-gold-bright"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
