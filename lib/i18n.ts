/**
 * Core i18n config: supported locales, defaults, storage key, and lazy
 * message loading. No next-intl routing/middleware is used here — the
 * site's URLs stay exactly as they are (no `/en`, `/bn` prefix), and the
 * active locale is purely client-side state (see LocaleProvider.tsx),
 * restored from localStorage on mount. Default is always English so the
 * server-rendered HTML and the first client paint always agree.
 */

export type Locale = "en" | "bn" | "es";

export const LOCALES: Locale[] = ["en", "bn", "es"];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_STORAGE_KEY = "portfolio-locale";

export const LOCALE_META: Record<Locale, { label: string; nativeLabel: string; bcp47: string }> = {
  en: { label: "English", nativeLabel: "English", bcp47: "en" },
  bn: { label: "Bangla", nativeLabel: "বাংলা", bcp47: "bn" },
  es: { label: "Spanish", nativeLabel: "Español", bcp47: "es" },
};

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "bn" || value === "es";
}

/** Dynamic import per locale — only the active locale's JSON is ever
 * fetched/parsed, satisfying the "lazy load translation files"
 * requirement instead of bundling both into the initial payload. */
export async function loadMessages(locale: Locale) {
  switch (locale) {
    case "bn":
      return (await import("@/messages/bn.json")).default;
    case "es":
      return (await import("@/messages/es.json")).default;
    case "en":
    default:
      return (await import("@/messages/en.json")).default;
  }
}
