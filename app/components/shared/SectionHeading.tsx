import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  /** Usually a string, but accepts any ReactNode so pages that need the
   * eyebrow translated (see Legal pages using a small client `<T>`
   * component) can pass one in without this component itself needing to
   * become a Client Component. */
  eyebrow: ReactNode;
  title: ReactNode;
  align?: "left" | "center";
  className?: string;
  /** Defaults to h2 — pass "h1" for a page's primary heading (e.g. a page
   * whose hero is built from SectionHeading rather than its own <h1>). */
  as?: "h1" | "h2";
};

/**
 * Shared eyebrow + big editorial title + underline treatment, used across
 * every About/Projects section for a consistent typographic rhythm.
 */
export default function SectionHeading({
  eyebrow,
  title,
  align = "center",
  className,
  as: Heading = "h2",
}: SectionHeadingProps) {
  const isCenter = align === "center";

  return (
    <div className={cn("mb-14 sm:mb-20", isCenter ? "text-center" : "text-left", className)}>
      <span
        className={cn(
          "mb-4 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.4em] text-noir-gold",
          isCenter && "justify-center"
        )}
      >
        <span className="h-1 w-1 rounded-full bg-noir-gold" />
        {eyebrow}
        <span className="h-1 w-1 rounded-full bg-noir-gold" />
      </span>

      <Heading className="font-jakarta-sans text-4xl font-bold uppercase tracking-tight text-noir-ink sm:text-6xl lg:text-7xl">
        {title}
      </Heading>

      <div
        className={cn(
          "mt-6 h-px w-24 bg-linear-to-r from-transparent via-noir-gold to-transparent",
          !isCenter && "from-noir-gold to-transparent"
        )}
      />
    </div>
  );
}
