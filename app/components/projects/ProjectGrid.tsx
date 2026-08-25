"use client";

import { useCallback, useDeferredValue, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import ProjectCard from "./ProjectCard";
import ProjectDetailModal from "./ProjectDetailModal";
import type { PublicProject } from "./types";

const PAGE_SIZE = 4;

/** Category chips come from the projects' own technologies — there is no
 *  separate category field, and a tag nobody's work uses is a dead button.
 *  Ordered by how many projects carry them, so the useful ones come first. */
function collectTags(projects: PublicProject[]): string[] {
  const counts = new Map<string, number>();
  for (const project of projects) {
    for (const tech of project.tech) counts.set(tech, (counts.get(tech) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tech]) => tech);
}

function matches(project: PublicProject, query: string, tag: string | null): boolean {
  if (tag && !project.tech.includes(tag)) return false;
  if (!query) return true;
  const haystack = [project.title, project.description, ...project.tech].join(" ").toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

export default function ProjectGrid({ projects }: { projects: PublicProject[] }) {
  const t = useTranslations();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);

  /** A narrowed list should start from the top, not from wherever "view
   *  more" had got to on the previous one — so every filter change resets
   *  the page size alongside itself. */
  const applyQuery = useCallback((next: string) => {
    setQuery(next);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const applyTag = useCallback((next: string | null) => {
    setTag(next);
    setVisibleCount(PAGE_SIZE);
  }, []);

  // Typing stays responsive on a long list: the filter runs against a
  // deferred copy of the query rather than blocking each keystroke.
  const deferredQuery = useDeferredValue(query);
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

  const tags = useMemo(() => collectTags(projects), [projects]);

  const filtered = useMemo(
    () => projects.filter((project) => matches(project, deferredQuery.trim(), tag)),
    [projects, deferredQuery, tag]
  );

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const isFiltered = tag !== null || query.trim() !== "";

  // No GSAP reveal here on purpose: the cards are Framer Motion `motion.div`s
  // with their own initial/animate/exit for the pagination transitions, and
  // two engines fighting over the same `opacity` leaves it stuck (that bug
  // bit this component once already). The scroll entrance is therefore done
  // in Framer's own terms — `whileInView` rather than `animate`, so a card
  // below the fold arrives as it is scrolled to instead of having already
  // played its entrance off-screen.
  return (
    <div className="mx-auto w-full max-w-7xl">
      {/* ── Search + category filters ─────────────────────────────── */}
      <div className="mb-10 flex flex-col gap-5 sm:mb-14">
        <div className="relative mx-auto w-full max-w-md">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-noir-ink-faint"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => applyQuery(e.target.value)}
            placeholder={t("projects.searchPlaceholder")}
            aria-label={t("projects.searchPlaceholder")}
            className="h-12 w-full rounded-full border border-noir-border bg-noir-surface/60 pl-11 pr-11 text-sm text-noir-ink outline-none transition-colors placeholder:text-noir-ink-faint focus:border-noir-gold/60 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => applyQuery("")}
              aria-label={t("projects.clearFilters")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-noir-ink-faint transition-colors hover:text-noir-ink"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => applyTag(null)}
              aria-pressed={tag === null}
              className={`rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-widest transition-colors duration-300 ${
                tag === null
                  ? "border-noir-gold bg-noir-gold/10 text-noir-gold-bright"
                  : "border-noir-border text-noir-ink-soft hover:border-noir-gold/50 hover:text-noir-gold-bright"
              }`}
            >
              {t("common.all")}
            </button>

            {tags.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => applyTag(tag === name ? null : name)}
                aria-pressed={tag === name}
                className={`rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-widest transition-colors duration-300 ${
                  tag === name
                    ? "border-noir-gold bg-noir-gold/10 text-noir-gold-bright"
                    : "border-noir-border text-noir-ink-soft hover:border-noir-gold/50 hover:text-noir-gold-bright"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        {isFiltered && (
          <p className="text-center text-xs uppercase tracking-widest text-noir-ink-faint">
            {t("projects.resultCount", { count: filtered.length })}
            <button
              type="button"
              onClick={() => {
                applyQuery("");
                applyTag(null);
              }}
              className="ml-3 text-noir-gold transition-colors hover:text-noir-gold-bright"
            >
              {t("projects.clearFilters")}
            </button>
          </p>
        )}
      </div>

      <motion.div layout className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {visible.map((project) => (
            <motion.div
              key={project.slug}
              layout
              initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.25 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
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
          {projects.length === 0 ? t("projects.emptyCategory") : t("projects.noResults")}
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
