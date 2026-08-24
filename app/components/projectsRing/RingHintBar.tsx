import { Move, Mouse, MousePointerClick } from "lucide-react";

const HINTS = [
  { Icon: Move, label: "Drag to rotate" },
  { Icon: Mouse, label: "Scroll to rotate" },
  { Icon: MousePointerClick, label: "Click to view" },
] as const;

/**
 * Glassy pill hints above the ring (drag/scroll/click), matching the
 * reference layout. Desktop/tablet only — hidden below `sm` so the
 * already-tight mobile ring section (see ProjectsRing.tsx) keeps its
 * exact current vertical budget; touch users discover drag-to-rotate by
 * touching the ring directly rather than reading a mouse-oriented hint.
 */
export default function RingHintBar() {
  return (
    <div className="relative z-10 mb-4 hidden shrink-0 items-center justify-center gap-3 sm:flex">
      {HINTS.map(({ Icon, label }) => (
        <span
          key={label}
          className="flex items-center gap-2 rounded-full border border-noir-border/70 bg-noir-surface/50 px-4 py-2 text-xs font-medium text-noir-ink-soft backdrop-blur-md"
        >
          <Icon size={14} className="text-noir-gold-bright" />
          {label}
        </span>
      ))}
    </div>
  );
}
