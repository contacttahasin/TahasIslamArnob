import { DEFAULT_THEME, THEME_STORAGE_KEY, THEMES } from "./themeData";

/**
 * Blocking inline script rendered in <head> so the saved accent color is
 * applied before first paint (see: preventing-flash-before-hydration.md).
 * The theme data is generated from the same THEMES/DEFAULT_THEME source
 * ThemeProvider uses at runtime, so the two can never drift apart.
 */
export function ThemeInitScript() {
  const themeMap = Object.fromEntries(
    THEMES.map((t) => [t.id, { base: t.base, light: t.light, dark: t.dark, rgb: t.rgb }])
  );

  const script = `(function(){try{var id=localStorage.getItem("${THEME_STORAGE_KEY}");var THEMES=${JSON.stringify(
    themeMap
  )};var theme=THEMES[id]||THEMES["${DEFAULT_THEME}"];var root=document.documentElement;root.style.setProperty("--accent",theme.base);root.style.setProperty("--accent-light",theme.light);root.style.setProperty("--accent-dark",theme.dark);root.style.setProperty("--accent-rgb",theme.rgb);root.setAttribute("data-accent",THEMES[id]?id:"${DEFAULT_THEME}")}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
