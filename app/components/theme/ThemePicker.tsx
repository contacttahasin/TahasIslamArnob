"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Palette } from "lucide-react";
import gsap from "gsap";
import { useTheme } from "@/app/lib/themeContext";
import { cn } from "@/lib/utils";

type ThemePickerProps = {
  /** Panel opens from the right edge of the trigger by default — pass
   * "left" for contexts where the trigger sits near the right edge of the
   * viewport and a right-anchored panel would overflow. */
  align?: "left" | "right";
  /** Panel opens below the trigger by default — pass "up" for triggers
   * that sit near the bottom of the viewport (e.g. the mobile menu's
   * bottom icon row), where a downward panel would overflow off-screen. */
  direction?: "down" | "up";
  /** Below the `sm` breakpoint, position the panel fixed and centered on
   * the viewport instead of anchored to the trigger's left/right edge.
   * `align`/`direction`'s left-or-right, up-or-down anchoring only works
   * out when the trigger itself sits at the edge of the viewport it's
   * anchored toward — the navbar's trigger sits mid-row, with more icons
   * to its right, so a right-anchored panel extends left from a
   * mid-screen point and can run off the left edge on narrow viewports.
   * Viewport-centering sidesteps that regardless of trigger position.
   * Opt-in (default false) so the mobile menu's already-correct
   * trigger-relative positioning (a centered row, opening upward) is
   * untouched. */
  mobileCenter?: boolean;
  className?: string;
};

/**
 * Palette trigger + floating glass panel for picking the site's accent
 * color. Same component is used in both the desktop navbar and the
 * mobile slide-out menu — panel positioning is relative to its own
 * wrapper, so it works wherever it's mounted.
 */
export default function ThemePicker({
  align = "right",
  direction = "down",
  mobileCenter = false,
  className,
}: ThemePickerProps) {
  const { accent, setAccent, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const [rendered, setRendered] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const firstSwatchRef = useRef<HTMLButtonElement>(null);

  /* eslint-disable react-hooks/set-state-in-effect --
   * mounts the panel before the open-tween runs; the close-tween below
   * already clears it from its own onComplete, not this effect re-running. */
  useEffect(() => {
    if (open) {
      setRendered(true);
      return;
    }
    if (!rendered || !panelRef.current) return;

    const tween = gsap.to(panelRef.current, {
      opacity: 0,
      y: 10,
      scale: 0.96,
      duration: 0.22,
      ease: "power2.in",
      onComplete: () => setRendered(false),
    });
    return () => {
      tween.kill();
    };
  }, [open, rendered]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!open || !rendered || !panelRef.current) return;
    gsap.fromTo(
      panelRef.current,
      { opacity: 0, y: 10, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "power3.out" }
    );
    firstSwatchRef.current?.focus();
  }, [open, rendered]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Choose accent color"
        className="theme-picker-trigger flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.35)] backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-noir-bg"
      >
        <Palette size={20} className="text-white/80" aria-hidden="true" />
      </button>

      {rendered && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Theme color picker"
          className={cn(
            "z-999999 w-64 max-w-[calc(100vw-1.5rem)] sm:w-72 rounded-2xl border border-white/10 bg-[#12151c]/95 p-4 sm:p-5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85)] backdrop-blur-xl",
            mobileCenter
              ? cn(
                  "fixed left-1/2 -translate-x-1/2",
                  direction === "down" ? "top-20" : "bottom-20",
                  "sm:absolute sm:left-auto sm:top-auto sm:bottom-auto sm:translate-x-0",
                  direction === "down" ? "sm:top-full sm:mt-3" : "sm:bottom-full sm:mb-3",
                  align === "right" ? "sm:right-0" : "sm:left-0"
                )
              : cn(
                  "absolute",
                  direction === "down" ? "top-full mt-3" : "bottom-full mb-3",
                  align === "right" ? "right-0" : "left-0"
                ),
            direction === "down"
              ? align === "right"
                ? "origin-top-right"
                : "origin-top-left"
              : align === "right"
                ? "origin-bottom-right"
                : "origin-bottom-left"
          )}
        >
          <h3 className="text-sm font-semibold text-white">Theme Color</h3>
          <p className="mt-1 text-xs text-white/50">Personalize your experience</p>

          <div className="mt-5 grid grid-cols-5 gap-2 sm:gap-3" role="group" aria-label="Accent color options">
            {themes.map((t, i) => {
              const isActive = t.id === accent;
              return (
                <button
                  key={t.id}
                  ref={i === 0 ? firstSwatchRef : undefined}
                  type="button"
                  onClick={() => setAccent(t.id)}
                  aria-label={t.name}
                  aria-pressed={isActive}
                  title={t.name}
                  className="theme-picker-swatch relative flex h-9 w-9 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#12151c]"
                >
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{
                      backgroundColor: t.base,
                      boxShadow: `${isActive ? "0 0 0 2px #fff," : ""} 0 4px 14px -2px rgba(${t.rgb}, 0.55)`,
                    }}
                  />
                  {isActive && (
                    <Check size={14} strokeWidth={3} className="relative z-10 text-white drop-shadow" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
