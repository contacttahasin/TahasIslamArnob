"use client";

import { useContext, type ReactNode } from "react";
import { Navecontext } from "@/app/naveContext/NaveContext";

/**
 * Blurs the routed page content while the slide-out menu is open — the
 * menu itself only covers 1/3 of the screen on desktop (see menu.jsx's
 * `lg:w-1/3`), so the remaining page stays visible behind it and needs
 * this to read as "menu is the focused overlay" rather than "menu is a
 * sidebar". Returns to normal the instant the menu closes.
 */
export default function PageBlurWrapper({ children }: { children: ReactNode }) {
  const { open } = useContext(Navecontext);

  return (
    <div
      className="transition-[filter] duration-500 ease-out"
      style={{
        // `filter: blur(0px)` is still a filter — any non-none value
        // creates a new containing block for `position: fixed`
        // descendants (CSS spec), which broke CinematicIntro's
        // full-viewport `fixed inset-0` curtain when this was
        // unconditionally set. Omit the property entirely when not
        // blurring so fixed descendants stay fixed to the real viewport.
        filter: open ? "blur(10px)" : undefined,
        pointerEvents: open ? "none" : undefined,
      }}
    >
      {children}
    </div>
  );
}
