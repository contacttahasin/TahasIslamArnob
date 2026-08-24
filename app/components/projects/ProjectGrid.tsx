"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import ProjectFilters, { type ProjectTypeFilter } from "./ProjectFilters";
import ProjectCard from "./ProjectCard";
import ProjectDetailModal from "./ProjectDetailModal";
import type { PublicProject } from "./types";
import { useScrollReveal } from "../shared/hooks/useScrollReveal";

const PAGE_SIZE = 4;

export default function ProjectGrid({ projects }: { projects: PublicProject[] }) {
  const t = useTranslations();
  const [active, setActive] = useState<ProjectTypeFilter>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedProject, setSelectedProject] = useState<PublicProject | null>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  const handleOpen = useCallback((project: PublicProject) => {
    triggerElementRef.current = document.activeElement as HTMLElement | null;
    setSelectedProject(project);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedProject(null);
    triggerElementRef.current?.focus?.();
  }, []);

  const filtered = useMemo(
    () => (active === "all" ? projects : projects.filter((p) => p.type === active)),
    [projects, active]
  );

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleFilterChange = (value: ProjectTypeFilter) => {
    setActive(value);
    setVisibleCount(PAGE_SIZE);
  };

  // GSAP only reveals the filter row — cards are Framer Motion `motion.div`s
  // with their own initial/animate/exit (needed for filter/pagination
  // transitions), so GSAP must not also target them: two engines fighting
  // over the same `opacity` leaves it stuck (bit us once already here).
  const sectionRef = useScrollReveal<HTMLDivElement>((tl) => {
    tl.from(".project-filters", {
      opacity: 0,
      y: 20,
      duration: 0.7,
      ease: "power3.out",
    });
  });

  return (
    <div ref={sectionRef} className="mx-auto w-full max-w-7xl">
      <div className="project-filters mb-14">
        <ProjectFilters active={active} onChange={handleFilterChange} />
      </div>

      <motion.div layout className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {visible.map((project) => (
            <motion.div
              key={project.slug}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <ProjectCard project={project} onOpen={() => handleOpen(project)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {selectedProject && <ProjectDetailModal project={selectedProject} onClose={handleClose} />}
      </AnimatePresence>

      {filtered.length === 0 && (
        <p className="py-20 text-center text-sm text-noir-ink-faint">
          {t("projects.emptyCategory")}
        </p>
      )}

      {hasMore && (
        <div className="mt-16 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="rounded-full border border-noir-border px-8 py-3 text-xs font-semibold uppercase tracking-widest text-noir-ink transition-colors duration-300 hover:border-noir-gold/60 hover:text-noir-gold-bright"
          >
            {t("common.viewMore")}
          </button>
        </div>
      )}
    </div>
  );
}
