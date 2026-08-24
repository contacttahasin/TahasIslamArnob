/**
 * Plain data/types only — deliberately not a "use client" module, so both
 * the Server Component that renders the no-FOUC init script
 * (ThemeInitScript.tsx) and the client ThemeProvider (themeContext.tsx)
 * can import it as the single source of truth without any ambiguity
 * about crossing the client/server boundary.
 */
import { darken, hexToRgbString, lighten } from "./color";

export type ThemeId =
  | "royal-gold"
  | "ocean-blue"
  | "royal-purple"
  | "crimson-red"
  | "emerald"
  | "sunset-orange"
  | "sakura-pink"
  | "ice-cyan"
  | "pearl-white";

export type ThemeSwatch = {
  id: ThemeId;
  name: string;
  base: string;
  light: string;
  dark: string;
  /** "r, g, b" channel string, for rgba()-based glow shadows. */
  rgb: string;
};

const RAW_THEMES: Array<{ id: ThemeId; name: string; base: string; light?: string }> = [
  // Royal Gold keeps the site's existing gold pair exactly, so the
  // default (no localStorage entry yet) look is pixel-identical to
  // before this system existed.
  { id: "royal-gold", name: "Royal Gold", base: "#978F66", light: "#D9B26F" },
  { id: "ocean-blue", name: "Ocean Blue", base: "#3B82F6" },
  { id: "royal-purple", name: "Royal Purple", base: "#8B5CF6" },
  { id: "crimson-red", name: "Crimson Red", base: "#EF4444" },
  { id: "emerald", name: "Emerald", base: "#22C55E" },
  { id: "sunset-orange", name: "Sunset Orange", base: "#F97316" },
  { id: "sakura-pink", name: "Sakura Pink", base: "#EC4899" },
  { id: "ice-cyan", name: "Ice Cyan", base: "#06B6D4" },
  { id: "pearl-white", name: "Pearl White", base: "#F3F4F6" },
];

/** Module-level constant — computed once, never re-created per render. */
export const THEMES: ThemeSwatch[] = RAW_THEMES.map((t) => ({
  id: t.id,
  name: t.name,
  base: t.base,
  light: t.light ?? lighten(t.base, 0.22),
  dark: darken(t.base, 0.2),
  rgb: hexToRgbString(t.base),
}));

export const THEME_MAP: Record<ThemeId, ThemeSwatch> = Object.fromEntries(THEMES.map((t) => [t.id, t])) as Record<
  ThemeId,
  ThemeSwatch
>;

export const DEFAULT_THEME: ThemeId = "royal-gold";
export const THEME_STORAGE_KEY = "theme-accent";
