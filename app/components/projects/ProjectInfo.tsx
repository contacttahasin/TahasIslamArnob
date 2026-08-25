import { ArrowUpRight } from "lucide-react";
import type { PublicProject } from "./types";

export default function ProjectInfo({ project }: { project: PublicProject }) {
  return (
    <div className="pt-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 wrap-break-word text-lg font-bold text-noir-ink transition-colors duration-300 group-hover:text-noir-gold-bright">
          {project.title}
        </h3>
        <ArrowUpRight
          size={18}
          className="mt-1 shrink-0 text-noir-ink-faint transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-noir-gold-bright"
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-wide text-noir-ink-faint">
        <span>{project.year}</span>
        {project.featured && (
          <>
            <span className="h-1 w-1 rounded-full bg-noir-border" />
            <span className="text-noir-gold">Featured</span>
          </>
        )}
      </div>
    </div>
  );
}
