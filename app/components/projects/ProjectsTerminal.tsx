"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { jetbrainsMono } from "../shared/fonts";
import type { PublicProject } from "./types";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const MONO = { fontFamily: "var(--font-jetbrains-mono), monospace" } as const;

const PROMPT = "~/portfolio";
const COMMAND = "ls projects --status published";

type Line =
  | { kind: "meta"; text: string }
  | { kind: "head"; text: string }
  | { kind: "row"; index: string; title: string; year: string; tech: string; flag: string }
  | { kind: "done"; text: string };

/**
 * Builds the printed output from the same rows the grid below renders, so
 * the terminal can never drift out of step with the real list.
 */
function buildLines(projects: PublicProject[]): Line[] {
  if (projects.length === 0) {
    return [{ kind: "meta", text: "no published projects yet" }];
  }

  const years = projects.map((p) => p.year).filter(Boolean);
  const featured = projects.filter((p) => p.featured).length;
  const stack = new Set(projects.flatMap((p) => p.tech));

  return [
    { kind: "head", text: "" },
    ...projects.map((project, i) => ({
      kind: "row" as const,
      index: String(i + 1).padStart(2, "0"),
      title: project.title,
      year: String(project.year ?? ""),
      tech: `${project.tech.length}`,
      flag: project.featured ? "featured" : "—",
    })),
    {
      kind: "done",
      text: `${projects.length} project${projects.length === 1 ? "" : "s"} · ${stack.size} technolog${
        stack.size === 1 ? "y" : "ies"
      } · ${featured} featured${years.length ? ` · latest ${Math.max(...years)}` : ""}`,
    },
  ];
}

/**
 * Terminal-styled header for the projects page: the prompt types itself on
 * scroll, then the project list prints out row by row.
 *
 * Deliberately plain DOM and GSAP rather than 3D — the page already runs a
 * WebGL background, and a second context plus a physics loop is a lot to
 * ask of a phone for what is, in the end, a heading.
 */
export default function ProjectsTerminal({ projects }: { projects: PublicProject[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const commandRef = useRef<HTMLSpanElement>(null);
  const [lines] = useState(() => buildLines(projects));

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const rows = gsap.utils.toArray<HTMLElement>(".pt-line");

      if (reduced) {
        if (commandRef.current) commandRef.current.textContent = COMMAND;
        gsap.set(rows, { opacity: 1, y: 0 });
        return;
      }

      gsap.set(rows, { opacity: 0, y: 8 });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: root, start: "top 82%", once: true },
      });

      // The command types itself first — nothing prints until it "runs".
      const typed = { chars: 0 };
      tl.to(typed, {
        chars: COMMAND.length,
        duration: 0.9,
        ease: "none",
        onUpdate: () => {
          if (commandRef.current) {
            commandRef.current.textContent = COMMAND.slice(0, Math.round(typed.chars));
          }
        },
      }).to(rows, { opacity: 1, y: 0, duration: 0.35, stagger: 0.07, ease: "power2.out" }, "+=0.15");
    },
    { scope: rootRef }
  );

  return (
    <div
      ref={rootRef}
      className={`${jetbrainsMono.variable} relative mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-noir-border bg-noir-surface/60 shadow-[0_30px_80px_-45px_rgba(0,0,0,0.9)] backdrop-blur-xl`}
    >
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-noir-border px-4 py-3">
        <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full bg-noir-border" />
        <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full bg-noir-border" />
        <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full bg-noir-border" />
        <span
          style={MONO}
          className="ml-2 min-w-0 truncate text-[10px] tracking-[0.12em] text-noir-ink-faint sm:text-[11px]"
        >
          {PROMPT} — zsh
        </span>
        <span
          aria-hidden
          style={MONO}
          className="ml-auto hidden shrink-0 items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-noir-gold-bright sm:flex"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-noir-gold-bright" />
          live
        </span>
      </div>

      {/* No fixed minimum width and no inner scrollbar: the columns drop
          out as the window narrows instead, so nothing is ever cut off
          behind an edge the reader cannot see. */}
      <div>
        <div style={MONO} className="px-4 py-4 text-[11px] leading-[1.9] sm:px-5 sm:text-[12.5px]">
          <p className="break-all">
            <span className="text-noir-gold">{PROMPT}</span>
            <span className="text-noir-ink-faint"> $ </span>
            <span ref={commandRef} className="text-noir-ink" />
            <span
              aria-hidden
              className="ml-[2px] inline-block h-[1em] w-[7px] translate-y-[0.15em] animate-pulse bg-noir-gold-bright align-middle"
            />
          </p>

          <div className="mt-3 space-y-0.5">
            {lines.map((line, i) => {
              if (line.kind === "row") {
                return (
                  <div
                    key={i}
                    className="pt-line grid grid-cols-[2.2rem_minmax(0,1fr)_3.2rem] items-baseline gap-x-2 sm:grid-cols-[2.2rem_minmax(0,1fr)_3.5rem_3.5rem_5.5rem] sm:gap-x-3"
                  >
                    <span className="text-noir-ink-faint">{line.index}</span>
                    <span className="truncate text-noir-ink">{line.title}</span>
                    <span className="tabular-nums text-noir-ink-soft">{line.year}</span>
                    <span className="hidden tabular-nums text-noir-ink-soft sm:inline">
                      {line.tech}
                    </span>
                    <span
                      className={`hidden sm:inline ${
                        line.flag === "featured" ? "text-noir-gold" : "text-noir-ink-faint"
                      }`}
                    >
                      {line.flag}
                    </span>
                  </div>
                );
              }

              if (line.kind === "head") {
                return (
                  <div
                    key={i}
                    className="pt-line grid grid-cols-[2.2rem_minmax(0,1fr)_3.2rem] items-baseline gap-x-2 text-[10px] uppercase tracking-[0.14em] text-noir-ink-faint sm:grid-cols-[2.2rem_minmax(0,1fr)_3.5rem_3.5rem_5.5rem] sm:gap-x-3"
                  >
                    <span>#</span>
                    <span>project</span>
                    <span>year</span>
                    <span className="hidden sm:inline">stack</span>
                    <span className="hidden sm:inline">flag</span>
                  </div>
                );
              }

              if (line.kind === "done") {
                return (
                  <p key={i} className="pt-line mt-3 text-noir-gold-bright">
                    <span className="text-noir-ink-faint">✓ </span>
                    {line.text}
                  </p>
                );
              }

              return (
                <p key={i} className="pt-line text-noir-ink-faint">
                  {line.text}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
