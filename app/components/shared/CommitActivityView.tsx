"use client";

import { useRef } from "react";
import { Trophy, Flame, Terminal } from "lucide-react";
import { useScrollReveal } from "./hooks/useScrollReveal";
import type { CommitActivity, ContributionDay } from "@/lib/github";

const CHART_W = 760;
const CHART_H = 200;

type Props = {
  activity: CommitActivity;
  /** Size of the trailing window drawn in the line chart. */
  days?: number;
};

function buildPaths(window: ContributionDay[], max: number) {
  const stepX = CHART_W / Math.max(window.length - 1, 1);
  const points = window.map((d, i) => {
    const x = i * stepX;
    const y = CHART_H - (d.count / max) * (CHART_H - 24) - 8;
    return [x, y] as const;
  });
  const line = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${CHART_W},${CHART_H} L0,${CHART_H} Z`;
  return { line, area, points };
}

function formatDate(iso: string | null) {
  if (!iso) return "never";
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * A GitHub-contributions-style "commit activity" dashboard — line chart,
 * streak metrics, and a small terminal readout — styled in the site's
 * noir/gold palette. Shared between the homepage (under Review, wired in
 * skiper30.tsx) and the About page.
 *
 * Presentation only: the numbers come from `getCommitActivity()` on the
 * server (see CommitActivity.tsx), so this stays a client component purely
 * for the GSAP draw-in on the chart.
 */
export default function CommitActivityView({ activity, days = 30 }: Props) {
  const lineRef = useRef<SVGPathElement>(null);
  const areaRef = useRef<SVGPathElement>(null);

  const window = activity.days.slice(-days);
  const max = Math.max(...window.map((d) => d.count), 1);
  const windowTotal = window.reduce((sum, d) => sum + d.count, 0);
  const { line: linePath, area: areaPath, points } = buildPaths(window, max);
  const profileUrl = `https://github.com/${activity.username}`;
  const isLive = activity.source !== "placeholder";

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
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block font-mono text-xs tracking-[0.2em] text-noir-ink-faint transition-colors hover:text-noir-gold-bright"
          >
            github.com/{activity.username}
          </a>
        </div>

        {/* Chart card */}
        <div className="relative border border-noir-border/80 bg-white/[0.02] p-6 backdrop-blur-sm sm:p-8">
          <span className="absolute -left-px -top-px h-6 w-6 border-l-2 border-t-2 border-noir-gold-bright" />
          <span className="absolute -right-px -top-px h-6 w-6 border-r-2 border-t-2 border-noir-gold-bright" />
          <span className="absolute -bottom-px -left-px h-6 w-6 border-b-2 border-l-2 border-noir-gold-bright" />
          <span className="absolute -bottom-px -right-px h-6 w-6 border-b-2 border-r-2 border-noir-gold-bright" />

          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className="w-full"
            preserveAspectRatio="none"
            role="img"
            aria-label={`${windowTotal} GitHub contributions over the last ${days} days`}
          >
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

            <path ref={areaRef} d={areaPath} fill="url(#commitFill)" />
            <path
              ref={lineRef}
              d={linePath}
              fill="none"
              stroke="var(--accent-light)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: "drop-shadow(0 0 6px rgba(var(--accent-rgb),0.6))" }}
            />

            {points
              .map((point, i) => [point, i] as const)
              .filter(([, i]) => i % 3 === 0)
              .map(([[x, y], i]) => (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={3}
                  fill="#0a0c10"
                  stroke="var(--accent-light)"
                  strokeWidth={1.5}
                />
              ))}
          </svg>

          <div className="mt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-noir-ink-faint">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-noir-gold-bright" />
              {isLive ? "Live from GitHub" : "Sample data"}
            </span>
            <span>Last {days} days</span>
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
                <p className="text-3xl font-bold text-white">{activity.totalLastYear}</p>
                <p className="mt-1 text-xs text-noir-ink-faint">Contributions (1y)</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-noir-gold-bright/70">
                  <Flame size={18} className="text-noir-gold-bright" />
                  <span className="absolute -bottom-2 rounded-full bg-[#0a0c10] px-1.5 text-sm font-bold text-white">
                    {activity.currentStreak}
                  </span>
                </div>
                <p className="mt-3 text-xs text-noir-ink-faint">Current Streak</p>
              </div>

              <div>
                <p className="text-3xl font-bold text-white">{activity.longestStreak}</p>
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
                <span className="text-noir-gold-bright">$</span> gh api users/{activity.username}
              </p>
              <p className="text-noir-ink-faint">
                {`{ login: "${activity.username}", contributions: ${activity.totalLastYear} }`}
              </p>
              <p className="text-noir-ink-soft">
                <span className="text-noir-gold-bright">$</span> git log -1 --date=short
              </p>
              <p className="text-emerald-400">✓ last commit {formatDate(activity.lastActive)}</p>
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
