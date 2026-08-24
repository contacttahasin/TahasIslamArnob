type RingPaginationProps = {
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
};

/**
 * Dot row beneath the ring — one per card slot, the active one widening
 * into a pill (matches the reference). Lives in the section's own bottom
 * padding (see ProjectsRing.tsx's pb-12/pb-16), so it costs no extra
 * vertical space beyond what was already reserved as breathing room.
 */
export default function RingPagination({ count, activeIndex, onSelect }: RingPaginationProps) {
  if (count === 0) return null;

  return (
    <div
      role="tablist"
      aria-label="Jump to project"
      className="pointer-events-auto absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-2 sm:bottom-4"
    >
      {Array.from({ length: count }).map((_, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={`Go to project ${i + 1} of ${count}`}
            onClick={() => onSelect(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ease-out ${
              active ? "w-6 bg-noir-gold-bright" : "w-1.5 bg-noir-ink-faint/50 hover:bg-noir-ink-faint"
            }`}
          />
        );
      })}
    </div>
  );
}
