"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import gsap from "gsap";
import { useLocaleSwitcher } from "@/app/lib/LocaleProvider";
import { LOCALES, LOCALE_META, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type LanguageSwitcherProps = {
  align?: "left" | "right";
  /** Panel opens below the trigger by default — pass "up" for triggers
   * near the bottom of the viewport (e.g. the mobile menu's bottom icon
   * row), where a downward panel would overflow off-screen. */
  direction?: "down" | "up";
  className?: string;
};

/**
 * 🌐 English ▾ trigger + glassmorphism dropdown for picking the site
 * language. Mirrors ThemePicker's interaction model (GSAP open/close,
 * click-outside, ESC, focus management) so the two premium controls in
 * the navbar feel like one consistent system.
 */
export default function LanguageSwitcher({ align = "right", direction = "down", className }: LanguageSwitcherProps) {
  const { locale, setLocale, isTransitioning } = useLocaleSwitcher();
  const [open, setOpen] = useState(false);
  const [rendered, setRendered] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const firstOptionRef = useRef<HTMLButtonElement>(null);

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
    firstOptionRef.current?.focus();
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

  function handleSelect(next: Locale) {
    setLocale(next);
    setOpen(false);
    buttonRef.current?.focus();
  }

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isTransitioning}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Choose language"
        className="theme-picker-trigger flex h-9 items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 shadow-[0_2px_12px_rgba(0,0,0,0.35)] backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-noir-bg disabled:opacity-60"
      >
        <Globe size={16} className="text-white/80" aria-hidden="true" />
        <span className="hidden sm:inline text-xs font-medium text-white/90">{LOCALE_META[locale].nativeLabel}</span>
        <ChevronDown
          size={14}
          className={cn("text-white/60 transition-transform duration-300", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {rendered && (
        <div
          ref={panelRef}
          role="listbox"
          aria-label="Language options"
          className={cn(
            "absolute z-999999 w-44 max-w-[calc(100vw-1.5rem)] sm:w-48 rounded-2xl border border-white/10 bg-[#12151c]/95 p-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85)] backdrop-blur-xl",
            direction === "down" ? "top-full mt-3" : "bottom-full mb-3",
            align === "right" ? "right-0" : "left-0",
            direction === "down"
              ? align === "right"
                ? "origin-top-right"
                : "origin-top-left"
              : align === "right"
                ? "origin-bottom-right"
                : "origin-bottom-left"
          )}
        >
          {LOCALES.map((id, i) => {
            const isActive = id === locale;
            return (
              <button
                key={id}
                ref={i === 0 ? firstOptionRef : undefined}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => handleSelect(id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                  isActive ? "bg-white/[0.06] text-noir-gold-bright" : "text-white/85 hover:bg-white/[0.05]"
                )}
              >
                <span className="flex flex-col">
                  <span className="font-medium">{LOCALE_META[id].nativeLabel}</span>
                  {LOCALE_META[id].nativeLabel !== LOCALE_META[id].label && (
                    <span className="text-[11px] text-white/45">{LOCALE_META[id].label}</span>
                  )}
                </span>
                {isActive && <Check size={15} strokeWidth={3} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
