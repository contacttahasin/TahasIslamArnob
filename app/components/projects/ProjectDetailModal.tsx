"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { ArrowUpRight, X } from "lucide-react";
import type { PublicProject } from "./types";
import { useReducedMotion } from "../shared/hooks/useReducedMotion";

type ProjectDetailModalProps = {
  project: PublicProject;
  onClose: () => void;
};

export default function ProjectDetailModal({ project, onClose }: ProjectDetailModalProps) {
  const t = useTranslations("projectsRing");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();
  const liveHref = project.live;

  useEffect(() => {
    closeButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const panelTransition = reducedMotion
    ? { duration: 0.15 }
    : { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <>
      <motion.button
        type="button"
        aria-label={t("close")}
        onClick={onClose}
        className="fixed inset-0 z-9999998 bg-noir-bg/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        onClick={(e) => e.stopPropagation()}
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 12 }}
        transition={panelTransition}
        className="fixed inset-x-0 bottom-0 z-9999999 flex max-h-[90vh] w-full flex-col overflow-y-auto rounded-t-3xl border border-noir-border bg-noir-surface/95 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.75)] backdrop-blur-xl sm:inset-0 sm:m-auto sm:h-fit sm:max-h-[85vh] sm:w-full sm:max-w-lg sm:rounded-3xl"
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
            sizes="(max-width: 768px) 100vw, 512px"
            className="object-cover"
            priority
          />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-noir-surface via-transparent to-transparent" />
        </div>

        <div className="flex flex-col gap-5 p-6 sm:p-8">
          <h2
            id="project-modal-title"
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

          {(project.github || liveHref) && (
            <div className="flex flex-wrap gap-3">
              {liveHref && (
                <a
                  href={liveHref}
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
        </div>
      </motion.div>
    </>
  );
}
