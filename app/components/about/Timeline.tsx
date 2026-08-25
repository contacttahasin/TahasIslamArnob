"use client";

import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { about } from "@/data/about";
import SectionHeading from "../shared/SectionHeading";
import { jakarta, jetbrainsMono } from "../shared/fonts";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type CodeLine = {
  /** Leading whitespace, kept out of the typed text so indentation is stable. */
  indent: string;
  /** Property name (or bare punctuation when there is no value). */
  key: string;
  /** Quoted value, typed after the key. Empty for punctuation-only lines. */
  value: string;
  kind: "punct" | "keyword" | "prop";
};

/**
 * The code panel types the milestone's own data back out as source, so the
 * "editor" never shows a word that isn't already in data/about.ts.
 */
function buildLines(milestone: (typeof about.journey)[number], index: number): CodeLine[] {
  return [
    { indent: "", key: `const milestone${index + 1} = {`, value: "", kind: "keyword" },
    { indent: "  ", key: "year: ", value: `"${milestone.year}",`, kind: "prop" },
    { indent: "  ", key: "title: ", value: `"${milestone.title}",`, kind: "prop" },
    { indent: "  ", key: "description:", value: "", kind: "prop" },
    { indent: "    ", key: "", value: `"${milestone.description}",`, kind: "prop" },
    { indent: "", key: "};", value: "", kind: "punct" },
  ];
}

type TimelineProps = {
  /**
   * Optional real screen-recording to run in place of the typed code panel.
   * Drop an .mp4/.webm in /public (e.g. "/videos/coding.mp4") and pass the
   * path — the typed panel is the zero-asset fallback until then.
   */
  codeVideoSrc?: string;
};

export default function Timeline({ codeVideoSrc }: TimelineProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<Array<HTMLDivElement | null>>([]);
  const railFillRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<Array<HTMLSpanElement | null>>([]);
  const stepLabelRef = useRef<HTMLSpanElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  /** [lineIndex] -> { key span, value span } for the code panel. */
  const keySpansRef = useRef<Array<HTMLSpanElement | null>>([]);
  const valueSpansRef = useRef<Array<HTMLSpanElement | null>>([]);
  const activeRef = useRef(-1);
  const lastProgressRef = useRef(0);
  /** Only the pinned layout dims the non-active milestones — when the list
   *  scrolls normally the reader is looking at whichever card is in front of
   *  them, which is rarely the one the scrub is typing. */
  const dimInactiveRef = useRef(true);

  const milestones = about.journey;
  const total = milestones.length;

  /** Every step's lines, plus the longest line count so the panel can be
   *  sized once and never jump between steps. */
  const { lineSets, maxLines } = useMemo(() => {
    const sets = milestones.map((m, i) => buildLines(m, i));
    return { lineSets: sets, maxLines: Math.max(...sets.map((s) => s.length)) };
  }, [milestones]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
      const dots = dotsRef.current.filter(Boolean) as HTMLSpanElement[];

      const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

      /**
       * Paints the whole stage from one fractional position along the steps
       * (0 → total). Everything — typing, card emphasis, dots, rail — is a
       * pure function of that number, so the card hand-off cannot drift out
       * of step with the scroll: it *is* the scroll. Called from the scrub,
       * so it writes straight to the DOM; routing this through React state
       * would re-render the whole section on every scroll frame.
       */
      const render = (position: number) => {
        const index = Math.min(total - 1, Math.floor(position));
        const frac = position - index;
        const lines = lineSets[index];

        // Type over the first 72%, hold while it is readable, then erase over
        // the last 12% so the next step writes into an empty panel instead of
        // the text jump-cutting at the boundary. The final step never erases —
        // there is nothing to hand over to, and a blank board is what the
        // reader would be left looking at on the way out of the section.
        const isLastStep = index === total - 1;
        const typedFraction =
          frac < 0.72
            ? clamp(0.06 + frac / 0.72)
            : isLastStep || frac < 0.88
              ? 1
              : clamp(1 - (frac - 0.88) / 0.12);

        // Card emphasis crossfades continuously: a card is fully lit at the
        // middle of its own step and hands over to its neighbour across the
        // boundary, rather than snapping on a step change.
        cards.forEach((card, i) => {
          const weight = dimInactiveRef.current
            ? clamp(1 - Math.abs(position - (i + 0.5)))
            : 1;
          gsap.set(card, {
            opacity: 0.26 + 0.74 * weight,
            scale: 0.972 + 0.028 * weight,
            x: -7 * (1 - weight),
          });
        });

        // Dots fill across their own step instead of flipping at its start.
        dots.forEach((dot, i) => {
          const fill = clamp(position - i);
          const focus = clamp(1 - Math.abs(position - (i + 0.5)));
          gsap.set(dot, {
            backgroundColor: `rgba(var(--accent-rgb), ${fill.toFixed(3)})`,
            borderColor:
              fill > 0 ? `rgba(var(--accent-rgb), ${(0.35 + 0.65 * fill).toFixed(3)})` : "var(--noir-border)",
            scale: 1 + 0.3 * focus,
          });
        });

        if (activeRef.current !== index) {
          activeRef.current = index;
          if (stepLabelRef.current) {
            stepLabelRef.current.textContent = `${String(index + 1).padStart(2, "0")} / ${String(
              total
            ).padStart(2, "0")}`;
          }
        }

        // Characters are revealed line by line, so the panel reads as
        // something being written rather than swapped in.
        const totalChars = lines.reduce((sum, l) => sum + l.key.length + l.value.length, 0);
        let budget = Math.round(totalChars * typedFraction);
        let caretLine = 0;

        for (let i = 0; i < maxLines; i++) {
          const keyEl = keySpansRef.current[i];
          const valueEl = valueSpansRef.current[i];
          if (!keyEl || !valueEl) continue;

          const line = lines[i];
          if (!line) {
            keyEl.textContent = "";
            valueEl.textContent = "";
            keyEl.dataset.kind = "punct";
            continue;
          }

          keyEl.dataset.kind = line.kind;
          keyEl.parentElement?.style.setProperty("padding-left", `${line.indent.length * 0.55}em`);

          const keyChars = Math.max(0, Math.min(line.key.length, budget));
          budget -= keyChars;
          const valueChars = Math.max(0, Math.min(line.value.length, budget));
          budget -= valueChars;

          keyEl.textContent = line.key.slice(0, keyChars);
          valueEl.textContent = line.value.slice(0, valueChars);

          if (keyChars + valueChars > 0) caretLine = i;
        }

        if (caretRef.current) {
          const host = caretRef.current.parentElement;
          const target = valueSpansRef.current[caretLine]?.parentElement;
          if (target && host !== target) target.appendChild(caretRef.current);
        }
      };

      const update = (progress: number) => {
        lastProgressRef.current = progress;
        render(Math.min(progress, 0.9999) * total);
        if (railFillRef.current) {
          gsap.set(railFillRef.current, { scaleX: progress });
        }
      };

      const mm = gsap.matchMedia();

      // Desktop, tall enough to hold the stage: it pins and the scroll
      // drives the step + typing. The height floor matters — the stage is
      // ~760px, so on a short desktop window pinning it would tuck the
      // editor's title bar under the 60px fixed navbar.
      mm.add(
        "(min-width: 1024px) and (min-height: 820px) and (prefers-reduced-motion: no-preference)",
        () => {
        dimInactiveRef.current = true;
        const trigger = ScrollTrigger.create({
          trigger: stageRef.current,
          start: "center center",
          end: () => `+=${window.innerHeight * total}`,
          pin: true,
          pinSpacing: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => update(self.progress),
          onRefresh: (self) => update(self.progress),
        });

        // Entrance moves y/blur only: opacity, scale and x belong to
        // render(), and a tween writing them here would fight the scrub.
        gsap.fromTo(
          cards,
          { y: 26, filter: "blur(8px)" },
          {
            y: 0,
            filter: "blur(0px)",
            duration: 0.7,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: { trigger: stageRef.current, start: "top 80%", once: true },
          }
        );

        return () => trigger.kill();
      });

      // Phone/tablet: the milestone cards are not rendered at all (see the
      // markup below), so the stage is just the board — short enough to pin
      // like the desktop one. The whole milestone text arrives through the
      // typing instead of through cards.
      mm.add("(max-width: 1023px) and (prefers-reduced-motion: no-preference)", () => {
        dimInactiveRef.current = false;
        const trigger = ScrollTrigger.create({
          trigger: stageRef.current,
          start: "center center",
          end: () => `+=${window.innerHeight * total}`,
          pin: true,
          pinSpacing: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => update(self.progress),
          onRefresh: (self) => update(self.progress),
        });

        return () => trigger.kill();
      });

      // Short desktop windows keep the un-pinned flow: the cards are visible
      // there, and the full stage is taller than the viewport, so pinning it
      // would tuck the board's title bar under the 60px fixed navbar.
      mm.add(
        "(min-width: 1024px) and (max-height: 819px) and (prefers-reduced-motion: no-preference)",
        () => {
        dimInactiveRef.current = false;
        const trigger = ScrollTrigger.create({
          trigger: stageRef.current,
          start: "top 85%",
          end: "bottom 20%",
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => update(self.progress),
          onRefresh: (self) => update(self.progress),
        });

        cards.forEach((card) => {
          gsap.fromTo(
            card,
            { y: 20, filter: "blur(8px)" },
            {
              y: 0,
              filter: "blur(0px)",
              duration: 0.7,
              ease: "power3.out",
              scrollTrigger: { trigger: card, start: "top 85%", once: true },
            }
          );
        });

        return () => trigger.kill();
      });

      // Reduced motion: last step fully typed, every card lit, no scrubbing.
      mm.add("(prefers-reduced-motion: reduce)", () => {
        render(total - 0.5);
        gsap.set(cards, { opacity: 1, scale: 1, x: 0, filter: "none" });
        gsap.set(railFillRef.current, { scaleX: 1 });
      });

      return () => mm.revert();
    }, sectionRef);

    return () => ctx.revert();
  }, [lineSets, maxLines, total]);

  return (
    <section
      ref={sectionRef}
      // Carries its own display + mono variables so the section can be dropped
      // on any page — the About page scopes `jakarta` at its root, the home
      // page does not, and an undefined font var invalidates the whole
      // font-family declaration rather than falling back.
      className={`${jakarta.variable} ${jetbrainsMono.variable} relative w-full overflow-hidden bg-noir-bg px-6 py-24 sm:px-10 lg:px-16`}
    >
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-noir-gold/5 blur-[160px]" />

      <SectionHeading
        eyebrow="My Journey"
        title={
          <>
            The Path{" "}
            <span className="bg-linear-to-r from-noir-gold to-noir-gold-bright bg-clip-text italic text-transparent">
              So Far
            </span>
          </>
        }
      />

      <div
        ref={stageRef}
        className="relative mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-stretch lg:gap-14"
      >
        {/* ── LEFT: the editor ─────────────────────────────────────── */}
        <div className="order-2 flex w-full flex-col lg:order-1 lg:h-full">
          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-noir-border bg-noir-surface/70 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]">
            <div className="flex items-center gap-2 border-b border-noir-border px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-noir-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-noir-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-noir-border" />
              <span
                className="ml-3 truncate text-[11px] uppercase tracking-[0.16em] text-noir-ink-faint"
                style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
              >
                journey.ts
              </span>
              <span
                ref={stepLabelRef}
                className="ml-auto shrink-0 text-[11px] tabular-nums tracking-[0.16em] text-noir-gold-bright"
                style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
              >
                01 / {String(total).padStart(2, "0")}
              </span>
            </div>

            {codeVideoSrc ? (
              <video
                className="aspect-video w-full object-cover"
                src={codeVideoSrc}
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <div
                // Fixed box below lg: the board is the pinned element there,
                // so it must not grow as the longer descriptions wrap in —
                // that would shift the pinned layout mid-scroll.
                className="h-[400px] flex-none overflow-hidden px-4 py-5 text-[12px] leading-[1.75] sm:h-[420px] sm:text-[13px] lg:h-auto lg:min-h-[340px] lg:flex-1"
                style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
              >
                {/* Gutter number lives inside each row rather than in its own
                    column, so a wrapped line keeps its number aligned to the
                    row it belongs to instead of drifting out of step. */}
                {Array.from({ length: maxLines }, (_, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="w-5 shrink-0 select-none text-right tabular-nums text-noir-ink-faint/60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1 whitespace-pre-wrap break-words">
                      <span
                        ref={(el) => {
                          keySpansRef.current[i] = el;
                        }}
                        data-kind="prop"
                        className="text-noir-gold-bright data-[kind=keyword]:text-[var(--accent)] data-[kind=punct]:text-noir-ink-faint"
                      />
                      <span
                        ref={(el) => {
                          valueSpansRef.current[i] = el;
                        }}
                        className="text-noir-ink-soft"
                      />
                      {i === 0 && (
                        <span
                          ref={caretRef}
                          aria-hidden
                          className="ml-[1px] inline-block h-[1.05em] w-[2px] translate-y-[0.18em] animate-pulse bg-noir-gold-bright"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Scrub progress rail — fills across the whole section. */}
          <div className="mt-5 h-px w-full bg-noir-border">
            <div
              ref={railFillRef}
              className="h-px w-full origin-left scale-x-0 bg-linear-to-r from-noir-gold to-noir-gold-bright"
            />
          </div>
        </div>

        {/* ── RIGHT: the milestones ────────────────────────────────── */}
        {/* Desktop only. On phone/tablet the board alone is pinned and the
            milestone text arrives by being typed into it. */}
        <ol className="relative order-1 hidden space-y-6 lg:order-2 lg:block lg:space-y-4">
          {milestones.map((milestone, i) => (
            <li key={`${milestone.title}-${i}`} className="flex gap-4 sm:gap-5">
              <span
                ref={(el) => {
                  dotsRef.current[i] = el;
                }}
                className="mt-2 h-3 w-3 shrink-0 rounded-full border-2 border-noir-border bg-transparent"
              />

              <div
                ref={(el) => {
                  cardsRef.current[i] = el;
                }}
                className="min-w-0 flex-1 rounded-xl border border-noir-border bg-noir-surface/40 p-5 sm:p-6 lg:p-5"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-noir-gold-bright">
                  {milestone.year}
                </span>
                <h3 className="mt-2 text-lg font-bold text-noir-ink sm:text-xl lg:text-xl">
                  {milestone.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-noir-ink-soft">
                  {milestone.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
