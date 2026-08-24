"use client";

import { useTranslations } from "next-intl";
import { about } from "@/data/about";
import { useScrollReveal } from "../shared/hooks/useScrollReveal";
import SpecularButton from "../shared/SpecularButton";

// Dot color is structural (per status), the label comes from translations
// keyed by the same status so it can't drift out of sync with the data.
const STATUS_DOT: Record<typeof about.availability.status, string> = {
  available: "bg-emerald-400",
  limited: "bg-noir-gold-bright",
  unavailable: "bg-noir-ink-faint",
};

const STATUS_LABEL_KEY: Record<typeof about.availability.status, "available" | "limitedAvailability" | "unavailable"> = {
  available: "available",
  limited: "limitedAvailability",
  unavailable: "unavailable",
};

export default function Availability() {
  const t = useTranslations();
  const sectionRef = useScrollReveal<HTMLDivElement>((tl) => {
    tl.from(".availability-card", {
      opacity: 0,
      y: 32,
      filter: "blur(10px)",
      duration: 0.9,
      ease: "power3.out",
    });
  });

  const statusDot = STATUS_DOT[about.availability.status];
  const statusLabel = t(`availability.${STATUS_LABEL_KEY[about.availability.status]}`);

  return (
    <section className="w-full bg-noir-bg px-6 py-16 sm:px-10 lg:px-16">
      <div ref={sectionRef} className="mx-auto max-w-5xl">
        <div className="availability-card flex flex-col items-center justify-between gap-6 rounded-3xl border border-noir-border bg-noir-surface/70 p-8 text-center backdrop-blur-xl sm:flex-row sm:text-left sm:p-10">
          <div className="flex items-center gap-4">
            <span className="relative flex h-3 w-3 shrink-0">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full ${statusDot} opacity-60`}
              />
              <span className={`relative inline-flex h-3 w-3 rounded-full ${statusDot}`} />
            </span>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-noir-ink">
                {statusLabel}
              </p>
              <p className="mt-1 text-sm text-noir-ink-soft">{t("availability.message")}</p>
              <p className="mt-0.5 text-xs text-noir-ink-faint">
                {t("availability.responseTime")}
              </p>
            </div>
          </div>

          <SpecularButton href="#contact" ariaLabel={t("common.getInTouch")} size="md" radius={12}>
            {t("common.startAProject")}
          </SpecularButton>
        </div>
      </div>
    </section>
  );
}
