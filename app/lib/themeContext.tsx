"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { hexToRgbString } from "./color";
import { DEFAULT_THEME, THEME_MAP, THEME_STORAGE_KEY, THEMES, type ThemeId, type ThemeSwatch } from "./themeData";

export type { ThemeId, ThemeSwatch };
export { DEFAULT_THEME, THEMES };

/** Applied both by the no-FOUC inline script (ThemeInitScript.tsx, as raw
 * JS) and here — kept as the single source of truth for what "applying a
 * theme" means so the two can never drift apart. */
export function applyAccent(id: ThemeId) {
  const theme = THEME_MAP[id] ?? THEME_MAP[DEFAULT_THEME];
  const root = document.documentElement.style;
  root.setProperty("--accent", theme.base);
  root.setProperty("--accent-light", theme.light);
  root.setProperty("--accent-dark", theme.dark);
  root.setProperty("--accent-rgb", hexToRgbString(theme.base));
}

type ThemeContextValue = {
  accent: ThemeId;
  theme: ThemeSwatch;
  setAccent: (id: ThemeId) => void;
  themes: ThemeSwatch[];
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // The no-FOUC inline script (see ThemeInitScript.tsx) already applied
  // the correct CSS variables and stamped `data-accent` on <html> before
  // hydration, but React state must still start at DEFAULT_THEME here to
  // match the server-rendered markup exactly — reading `document` back in
  // this initializer would make the client's first render diverge from
  // the server's and break hydration for anything reading `theme.*`
  // directly (e.g. inline styles). The effect below reconciles state to
  // the real saved theme immediately after mount instead.
  const [accent, setAccentState] = useState<ThemeId>(DEFAULT_THEME);

  /* eslint-disable react-hooks/set-state-in-effect --
   * one-time post-hydration reconciliation with localStorage, mirrors the
   * no-FOUC inline script's own already-applied value; see comment above. */
  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
    if (stored && stored in THEME_MAP && stored !== accent) {
      setAccentState(stored);
    }
    // Only ever needs to reconcile once, right after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const setAccent = useCallback((id: ThemeId) => {
    if (!(id in THEME_MAP)) return;
    setAccentState(id);
    window.localStorage.setItem(THEME_STORAGE_KEY, id);
    document.documentElement.setAttribute("data-accent", id);
    applyAccent(id);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ accent, theme: THEME_MAP[accent], setAccent, themes: THEMES }),
    [accent, setAccent]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
