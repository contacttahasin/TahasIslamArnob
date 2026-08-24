"use client";

import { useTranslations } from "next-intl";

/**
 * Minimal inline translation helper for the rare case where a single
 * translated string needs to be passed as a prop into a Server Component
 * (e.g. SectionHeading's `eyebrow` on a page that exports `metadata`, so
 * the page itself can't become a Client Component). Prefer `useTranslations`
 * directly in any component that's already a Client Component.
 */
export function T({ ns, k }: { ns?: string; k: string }) {
  const t = useTranslations(ns);
  return <>{t(k)}</>;
}
