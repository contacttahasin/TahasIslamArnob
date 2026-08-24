"use client";

import Link from "next/link";
import CrowdCanvas from "@/app/components/animation/CrowdCanvas";
import FuzzyText from "@/components/FuzzyText";
import TextType from "@/components/TextType";
import { useResponsiveFontSize } from "@/app/components/shared/hooks/useResponsiveFontSize";

/**
 * Global 404. Rendered by the ROOT layout, not app/(site)/layout.tsx — so
 * nothing here may use the site's Theme/Locale/UiSound providers (no
 * SpecularButton, no useTranslations). The accent CSS variables are safe
 * to read: ThemeInitScript stamps them on <html> from the root layout.
 */
const CODE_FONT_SIZE_RULES = [
  { minWidth: 0, px: 96 },
  { minWidth: 640, px: 150 },
  { minWidth: 1024, px: 200 },
];

export default function NotFound() {
  const codeFontSize = useResponsiveFontSize(CODE_FONT_SIZE_RULES, 96);

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center overflow-hidden bg-noir-bg text-noir-ink">
      <div className="pointer-events-none absolute -top-40 left-1/4 h-[520px] w-[520px] rounded-full bg-noir-gold/10 blur-[160px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[420px] w-[420px] translate-y-1/3 rounded-full bg-noir-gold-bright/10 blur-[150px]" />

      {/* Crowd walks along the bottom, behind the copy */}
      <CrowdCanvas
        src="/images/peeps/all-peeps.png"
        rows={15}
        cols={7}
        className="pointer-events-none absolute bottom-0 left-0 z-0 h-[70vh] w-full opacity-70"
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-[40vh] pt-24 text-center sm:pb-[38vh]">
        <span className="mb-6 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.4em] text-noir-gold">
          <span className="h-1 w-1 rounded-full bg-noir-gold" />
          Page not found
          <span className="h-1 w-1 rounded-full bg-noir-gold" />
        </span>

        <div className="font-jakarta-sans font-bold text-noir-gold-bright">
          <FuzzyText
            fontSize={codeFontSize}
            fontWeight={900}
            color="currentColor"
            baseIntensity={0.18}
            hoverIntensity={0.5}
            enableHover
          >
            404
          </FuzzyText>
        </div>

        <p className="mt-8 max-w-md text-base text-noir-ink-soft sm:text-lg">
          <TextType
            as="span"
            text={[
              "This page took a walk and never came back.",
              "Nothing lives at this address.",
              "Let's get you back on track.",
            ]}
            typingSpeed={45}
            deletingSpeed={25}
            pauseDuration={2200}
            showCursor
            cursorCharacter="_"
          />
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-noir-ink px-7 py-3 text-sm font-medium text-noir-bg transition-all hover:scale-105 hover:shadow-[0_0_30px_-6px_rgba(var(--accent-rgb),0.6)]"
          >
            Back Home
            <span aria-hidden>↗</span>
          </Link>

          <Link
            href="/projects"
            className="inline-flex items-center gap-2 rounded-full border border-noir-border px-7 py-3 text-sm font-medium text-noir-ink transition-all hover:scale-105 hover:border-[rgba(var(--accent-rgb),0.6)]"
          >
            View Projects
            <span aria-hidden>↗</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
