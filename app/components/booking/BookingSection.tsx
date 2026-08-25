"use client";

import { useState, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone, faComment } from "@fortawesome/free-solid-svg-icons";

import { CAL_DURATION_MINUTES, EMBED_SRC } from "./booking";

type Mode = "call" | "message";

/**
 * Two ways to start a conversation, behind one tab row: a Cal.com booking
 * embed, and whatever intake form is passed in as `children` — that form is
 * rendered untouched, so its own markup, validation and submit flow stay
 * exactly as they are.
 *
 * Both panels stay mounted and the inactive one is hidden, so switching tabs
 * never discards half-typed form input.
 *
 * The accent is aliased once on the wrapper and read from there by every
 * rule below, so the nav's theme picker recolours this section for free.
 */
export default function BookingSection({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  // Opens on the message form — most visitors want to write, not book.
  const [mode, setMode] = useState<Mode>("message");

  return (
    <section className={`w-full bg-noir-bg px-6 py-16 sm:px-10 lg:px-16 ${className}`}>
      <div className="mx-auto w-full max-w-7xl [--booking-accent-rgb:var(--accent-rgb)] [--booking-accent:var(--accent)]">
        <div
          role="tablist"
          aria-label="How to get in touch"
          // Always one row — nowrap plus flex-1 on narrow screens, so the
          // actions share the line instead of stacking.
          className="mb-10 flex flex-nowrap items-center justify-center gap-[clamp(8px,1.2vw,14px)]"
        >
          <TabButton
            id="booking-tab-call"
            panelId="booking-panel-call"
            icon={faPhone}
            label="Book a Call"
            isActive={mode === "call"}
            onSelect={() => setMode("call")}
          />
          <TabButton
            id="booking-tab-message"
            panelId="booking-panel-message"
            icon={faComment}
            label="Send SMS"
            isActive={mode === "message"}
            onSelect={() => setMode("message")}
          />
        </div>

        <div
          id="booking-panel-call"
          role="tabpanel"
          aria-labelledby="booking-tab-call"
          hidden={mode !== "call"}
          // 70vh of a phone is too short for Cal.com's month grid, so below
          // md the panel runs to its natural height and the page scrolls.
          className="flex h-[70vh] max-h-[70vh] min-h-[460px] flex-col overflow-y-auto overscroll-contain max-md:h-auto max-md:max-h-none max-md:overflow-visible"
        >
          <div className="relative z-1 mx-auto min-h-0 w-full max-w-[1020px] flex-1 overflow-hidden rounded-[clamp(12px,1.4vw,18px)] border border-noir-border bg-[#101010] p-2.5 max-md:h-[880px] max-md:flex-none max-md:p-1.5">
            <iframe
              className="block h-full w-full border-0 bg-transparent"
              src={EMBED_SRC}
              title={`Book a ${CAL_DURATION_MINUTES}-minute call`}
              loading="lazy"
              allow="camera; microphone; geolocation; clipboard-write"
            />
          </div>
        </div>

        <div
          id="booking-panel-message"
          role="tabpanel"
          aria-labelledby="booking-tab-message"
          hidden={mode !== "message"}
        >
          {children}
        </div>
      </div>
    </section>
  );
}

function TabButton({
  id,
  panelId,
  icon,
  label,
  isActive,
  onSelect,
}: {
  id: string;
  panelId: string;
  icon: typeof faPhone;
  label: string;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={isActive}
      aria-controls={panelId}
      onClick={onSelect}
      // `inline-flex` is explicit: a global `button { display: block }` would
      // otherwise stretch this to the full row regardless of the flex rules.
      className={`inline-flex w-auto shrink flex-none items-center justify-center gap-2.5 whitespace-nowrap rounded-full border-[1.5px] px-[clamp(18px,1.8vw,28px)] py-[13px] text-[clamp(13px,1vw,15px)] font-bold leading-tight tracking-[0.01em] transition-[background-color,border-color,color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-[rgba(var(--booking-accent-rgb),0.5)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--booking-accent)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 max-md:min-w-0 max-md:flex-1 max-md:gap-[7px] max-md:px-2.5 max-md:py-3 max-md:text-[12.5px] md:min-w-[clamp(150px,15vw,196px)] ${
        isActive
          ? "border-transparent bg-[var(--booking-accent)] text-white shadow-[0_8px_26px_rgba(var(--booking-accent-rgb),0.32)]"
          : "border-white/55 bg-black/40 text-white"
      }`}
    >
      <FontAwesomeIcon
        icon={icon}
        aria-hidden="true"
        focusable="false"
        className="h-[clamp(16px,1.3vw,19px)] w-[clamp(16px,1.3vw,19px)] flex-none"
      />
      {label}
    </button>
  );
}
