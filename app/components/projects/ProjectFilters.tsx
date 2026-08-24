import { useTranslations } from "next-intl";

export type ProjectTypeFilter = "all" | "latest" | "portfolio";

const FILTERS: { label: string; value: ProjectTypeFilter }[] = [
  { label: "All", value: "all" },
  { label: "Latest", value: "latest" },
  { label: "Portfolio", value: "portfolio" },
];

type ProjectFiltersProps = {
  active: ProjectTypeFilter;
  onChange: (value: ProjectTypeFilter) => void;
};

export default function ProjectFilters({ active, onChange }: ProjectFiltersProps) {
  const t = useTranslations("common");

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 border-b border-noir-border pb-8">
      {FILTERS.map((filter) => {
        const isActive = filter.value === active;
        return (
          <button
            key={filter.value}
            type="button"
            onClick={() => onChange(filter.value)}
            aria-pressed={isActive}
            className={`relative pb-1 text-sm font-medium uppercase tracking-widest transition-colors duration-300 ${
              isActive ? "text-noir-gold-bright" : "text-noir-ink-faint hover:text-noir-ink"
            }`}
          >
            {filter.value === "all" ? t("all") : filter.label}
            {isActive && (
              <span className="absolute -bottom-px left-0 h-px w-full bg-noir-gold-bright" />
            )}
          </button>
        );
      })}
    </div>
  );
}
