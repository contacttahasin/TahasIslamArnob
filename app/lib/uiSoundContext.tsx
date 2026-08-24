"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "ui-sound-enabled";

type UiSoundContextValue = {
  enabled: boolean;
  toggle: () => void;
};

const UiSoundContext = createContext<UiSoundContextValue | null>(null);

/**
 * Shared on/off flag for the site's short UI sound effects (page-transition
 * whoosh, menu open/close, intro chime/skip click) — separate from the
 * existing background-music toggle (HomeAudio/Skiper25), which is its own
 * concern. Persisted so a visitor's preference survives navigation and
 * repeat visits; defaults to on (browsers block actual playback until the
 * first user gesture regardless, so an "on" default never causes a
 * surprise sound on load).
 */
export function UiSoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(true);

  /* eslint-disable react-hooks/set-state-in-effect --
   * one-time post-hydration reconciliation with a value localStorage can't
   * provide during SSR; see UiSoundProvider's default-true rationale above. */
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setEnabled(stored === "1");
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  function toggle() {
    setEnabled((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return <UiSoundContext.Provider value={{ enabled, toggle }}>{children}</UiSoundContext.Provider>;
}

export function useUiSoundEnabled() {
  const ctx = useContext(UiSoundContext);
  if (!ctx) {
    throw new Error("useUiSoundEnabled must be used within a UiSoundProvider");
  }
  return ctx;
}
