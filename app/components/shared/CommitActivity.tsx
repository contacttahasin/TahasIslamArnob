"use client";

import { useRef } from "react";
import { Trophy, Flame, Terminal } from "lucide-react";
import { useScrollReveal } from "./hooks/useScrollReveal";

const DAYS = 30;

/**
 * PLACEHOLDER activity data — a deterministic pseudo-random pattern
 * standing in for real commit history. Swap this function for a real
 * GitHub contributions API call when available; the chart and streak
 * stats below all derive from this one array, so nothing else needs to
 * change when it's wired to real data.
 */
function generatePlaceholderActivity(days: number) {
  const today = new Date();
  let seed = 42;
  const next = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  const data: { date: Date; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const spike = next() < 0.15 ? next() * 18 : 0;
    const count = Math.max(0, Math.round(next() * 7 - 2 + spike));
    data.push({ date, count });
  }
  return data;
}

function computeStreaks(data: { count: number }[]) {
  let current = 0;
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].count > 0) current++;
    else break;
  }
  let longest = 0;
  let run = 0;
  for (const d of data) {
    if (d.count > 0) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }
  return { current, longest };
}

const ACTIVITY = generatePlaceholderActivity(DAYS);
const MAX_COUNT = Math.max(...ACTIVITY.map((d) => d.count), 1);
const TOTAL = ACTIVITY.reduce((sum, d) => sum + d.count, 0);
const { current: CURRENT_STREAK, longest: LONGEST_STREAK } = computeStreaks(ACTIVITY);

const CHART_W = 760;
const CHART_H = 200;

function buildPaths() {
  const stepX = CHART_W / (ACTIVITY.length - 1);
  const points = ACTIVITY.map((d, i) => {
    const x = i * stepX;
    const y = CHART_H - (d.count / MAX_COUNT) * (CHART_H - 24) - 8;
    return [x, y] as const;
  });
  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${CHART_W},${CHART_H} L0,${CHART_H} Z`;
  return { line, area, points };
}

const { line: LINE_PATH, area: AREA_PATH, points: POINTS } = buildPaths();

/**
 * A GitHub-contributions-style "commit activity" dashboard — line chart,
 * streak metrics, and a small terminal readout — styled in the site's
 * noir/gold palette. Shared between the homepage (under Review, wired in
 * skiper30.tsx) and the About page.
 */
export default function CommitActivity() {
  const lineRef = useRef<SVGPathElement>(null);
  const areaRef = useRef<SVGPathElement>(null);

  const sectionRef = useScrollReveal<HTMLDivElement>((tl) => {
    if (!lineRef.current) return;
    const length = lineRef.current.getTotalLength();
    tl.set(lineRef.current, { strokeDasharray: length, strokeDashoffset: length })
      .set(areaRef.current, { opacity: 0 })
      .to(lineRef.current, { strokeDashoffset: 0, duration: 1.6, ease: "power2.out" })
      .to(areaRef.current, { opacity: 1, duration: 1 }, "-=0.9");
  });

  return (
    <section className="relative w-full overflow-hidden bg-[#0a0c10] px-6 py-24 sm:px-10 lg:px-16">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-noir-gold/10 blur-[160px]" />

      <div ref={sectionRef} className="relative mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <span className="mb-4 flex items-center justify-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.4em] text-noir-gold">
            <span className="h-1 w-1 rounded-full bg-noir-gold" />
            Dev Activity
            <span className="h-1 w-1 rounded-full bg-noir-gold" />
          </span>
          <h2 className="font-jakarta-sans text-4xl font-bold uppercase tracking-tight text-white sm:text-5xl">
            Commit{" "}
            <span className="bg-linear-to-r from-noir-gold to-noir-gold-bright bg-clip-text text-transparent">
              Activity
            </span>
          </h2>
        </div>

        {/* Chart card */}
        <div className="relative border border-noir-border/80 bg-white/[0.02] p-6 backdrop-blur-sm sm:p-8">
          <span className="absolute -left-px -top-px h-6 w-6 border-l-2 border-t-2 border-noir-gold-bright" />
          <span className="absolute -right-px -top-px h-6 w-6 border-r-2 border-t-2 border-noir-gold-bright" />
          <span className="absolute -bottom-px -left-px h-6 w-6 border-b-2 border-l-2 border-noir-gold-bright" />
          <span className="absolute -bottom-px -right-px h-6 w-6 border-b-2 border-r-2 border-noir-gold-bright" />

          <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="commitFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-light)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="var(--accent-light)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {Array.from({ length: 5 }).map((_, i) => (
              <line
                key={i}
                x1={0}
                x2={CHART_W}
                y1={(i * CHART_H) / 4}
                y2={(i * CHART_H) / 4}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="2 4"
              />
            ))}

            <path ref={areaRef} d={AREA_PATH} fill="url(#commitFill)" />
            <path
              ref={lineRef}
              d={LINE_PATH}
              fill="none"
              stroke="var(--accent-light)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: "drop-shadow(0 0 6px rgba(var(--accent-rgb),0.6))" }}
            />

            {POINTS.filter((_, i) => i % 3 === 0).map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={3} fill="#0a0c10" stroke="var(--accent-light)" strokeWidth={1.5} />
            ))}
          </svg>

          <div className="mt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-noir-ink-faint">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-noir-gold-bright" />
              Live activity feed
            </span>
            <span>Last {DAYS} days</span>
          </div>
        </div>

        {/* Streak metrics + terminal */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="relative border border-noir-border/80 bg-white/[0.02] p-8 backdrop-blur-sm">
            <div className="mb-8 flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-noir-gold to-noir-gold-bright text-noir-bg">
                <Trophy size={18} />
              </span>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-noir-ink-faint">
                  Real-Time Streak Metrics
                </p>
                <p className="text-lg font-bold uppercase tracking-tight text-white">Commit Streak</p>
              </div>
            </div>

            <div className="grid grid-cols-3 items-start gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-white">{TOTAL}</p>
                <p className="mt-1 text-xs text-noir-ink-faint">Total Contributions</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-noir-gold-bright/70">
                  <Flame size={18} className="text-noir-gold-bright" />
                  <span className="absolute -bottom-2 rounded-full bg-[#0a0c10] px-1.5 text-sm font-bold text-white">
                    {CURRENT_STREAK}
                  </span>
                </div>
                <p className="mt-3 text-xs text-noir-ink-faint">Current Streak</p>
              </div>

              <div>
                <p className="text-3xl font-bold text-white">{LONGEST_STREAK}</p>
                <p className="mt-1 text-xs text-noir-ink-faint">Longest Streak</p>
              </div>
            </div>
          </div>

          {/* Terminal console */}
          <div className="relative border border-noir-border/80 bg-black/40 p-6 font-mono text-xs backdrop-blur-sm">
            <div className="mb-4 flex items-center gap-2 text-noir-ink-faint">
              <Terminal size={13} />
              <span className="uppercase tracking-[0.2em]">Sys.Diagnostic.Console</span>
            </div>
            <div className="space-y-3">
              <p className="text-noir-ink-soft">
                <span className="text-noir-gold-bright">$</span> git status --short
              </p>
              <p className="text-noir-ink-faint">## main...origin/main [ahead 1]</p>
              <p className="text-noir-ink-soft">
                <span className="text-noir-gold-bright">$</span> npm run build
              </p>
              <p className="text-emerald-400">✓ Compiled successfully</p>
              <p className="text-noir-ink-soft">
                <span className="text-noir-gold-bright">$</span> curl -s status.check
              </p>
              <p className="text-noir-ink-faint">{`{ status: "online", role: "developer" }`}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
