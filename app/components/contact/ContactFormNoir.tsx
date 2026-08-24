"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import emailjs from "@emailjs/browser";
import { useScrollReveal } from "../shared/hooks/useScrollReveal";
import { isValidEmail } from "@/lib/validation";
import { about } from "@/data/about";
import {
  EMAILJS_SERVICE_ID,
  EMAILJS_TEMPLATE_ID,
  EMAILJS_PUBLIC_KEY,
} from "@/lib/emailjs";

type FieldErrors = Partial<Record<"name" | "email" | "message", string>>;

/** Terminal-intake option groups. Both are optional context — the form is
 *  still valid on name/email/message alone, so a visitor who ignores the
 *  chips can still send. */
const CONVERSATION_TYPES = ["PROJECT", "JOB", "ADVISORY", "SPEAKING", "SOMETHING ELSE"] as const;
const STAKES = ["SCALE", "0-1", "GROWTH", "AUTOMATION", "RESCUE"] as const;

/** Every profile that actually has a URL. Driven off the data rather than a
 *  fixed list, so the rows the reference shows as LINKEDIN/GITHUB appear on
 *  their own the moment those entries in data/about.ts stop being `null`. */
const LINK_ROWS = about.socials.filter((s) => Boolean(s.href));

const inputBase =
  "w-full rounded-lg border bg-noir-bg/60 px-4 py-3 text-sm text-noir-ink outline-none transition-colors duration-300 placeholder:text-noir-ink-faint focus:border-[rgba(var(--accent-rgb),0.7)]";

export default function ContactFormNoir() {
  const t = useTranslations("contact");
  const cardRef = useRef<HTMLDivElement>(null);
  const sectionRef = useScrollReveal<HTMLElement>((tl) => {
    tl.from(cardRef.current, {
      opacity: 0,
      y: 30,
      filter: "blur(10px)",
      duration: 0.9,
      ease: "power3.out",
    });
  });

  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [conversation, setConversation] = useState<string | null>(null);
  const [stake, setStake] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => (prev[name as keyof FieldErrors] ? { ...prev, [name]: undefined } : prev));
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    if (!formData.name.trim()) errors.name = t("nameRequired");
    if (!formData.email.trim()) errors.email = t("emailRequired");
    else if (!isValidEmail(formData.email)) errors.email = t("emailInvalid");
    if (!formData.message.trim()) errors.message = t("messageRequired");
    else if (formData.message.trim().length < 10) errors.message = t("messageTooShort");
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setStatus("sending");

    try {
      // The chip answers are folded into the existing template's `title`
      // and `message` fields rather than added as new template variables —
      // the same EmailJS template also serves the footer's newsletter and
      // the homepage form, so its field list has to stay as it is.
      const context = [
        conversation ? `Type: ${conversation}` : null,
        stake ? `Stakes: ${stake}` : null,
      ].filter(Boolean);

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          name: formData.name,
          email: formData.email,
          phone: "",
          country: "",
          title: conversation
            ? `New Contact Form Submission — ${conversation}`
            : "New Contact Form Submission",
          message: context.length
            ? `${formData.message}\n\n---\n${context.join("\n")}`
            : formData.message,
        },
        EMAILJS_PUBLIC_KEY
      );
      setStatus("success");
      setFormData({ name: "", email: "", message: "" });
      setConversation(null);
      setStake(null);
    } catch {
      setStatus("error");
    }
  };

  const renderChips = (
    options: readonly string[],
    selected: string | null,
    onSelect: (v: string | null) => void,
    groupLabel: string
  ) => (
    <div role="group" aria-label={groupLabel} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            // Selecting the active chip clears it, so an answer given by
            // mistake can be taken back without reloading.
            onClick={() => onSelect(active ? null : option)}
            className={`rounded-md border px-3 py-2 font-mono text-[11px] tracking-[0.12em] transition-colors duration-200 sm:px-4 ${
              active
                ? "border-[rgba(var(--accent-rgb),0.85)] text-[var(--accent)]"
                : "border-noir-border text-noir-ink-soft hover:border-noir-ink-faint hover:text-noir-ink"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );

  return (
    <section id="message-form" ref={sectionRef} className="relative w-full bg-noir-bg px-6 pb-28 sm:px-10 lg:px-16">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-16">

        {/* ── LEFT: pitch + profile rows ─────────────────────────── */}
        <div className="lg:sticky lg:top-32">
          <h2 className="font-jakarta-sans text-4xl font-bold leading-[1.05] tracking-tight text-noir-ink sm:text-5xl lg:text-6xl">
            Got an{" "}
            <span className="text-[var(--accent)]">interesting problem?</span>{" "}
            Let&apos;s talk about it.
          </h2>

          <p className="mt-8 max-w-md text-base leading-relaxed text-noir-ink-soft">
            {t("intro")} {t("letsDiscuss")}
          </p>

          <div className="mt-12">
            {LINK_ROWS.map((social) => {
              if (!social.href) return null;
              const display = social.href.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

              return (
                <a
                  key={social.icon}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col gap-1 border-t border-noir-border py-5 transition-colors hover:border-[rgba(var(--accent-rgb),0.5)] sm:flex-row sm:items-center sm:gap-8"
                >
                  <span className="w-28 shrink-0 font-mono text-[11px] uppercase tracking-[0.2em] text-noir-ink-faint">
                    {social.icon}
                  </span>
                  <span className="min-w-0 break-all text-sm text-noir-ink transition-colors group-hover:text-[var(--accent)] sm:text-base">
                    {display} <span aria-hidden>→</span>
                  </span>
                </a>
              );
            })}
            <div className="border-t border-noir-border" />
          </div>

          <p className="mt-8 max-w-md text-sm leading-relaxed text-noir-ink-soft">
            Looking for older profiles, writing archives, design links, or social handles?{" "}
            <a
              href={`mailto:${about.contactEmail}`}
              className="text-noir-ink underline decoration-noir-border underline-offset-4 transition-colors hover:text-[var(--accent)]"
            >
              Email me directly
            </a>
            .
          </p>
        </div>

        {/* ── RIGHT: terminal intake ─────────────────────────────── */}
        <div
          ref={cardRef}
          className="overflow-hidden rounded-xl border border-noir-border bg-noir-surface/70 backdrop-blur-md"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-noir-border bg-noir-bg/50 px-4 py-3 font-mono text-[10px] tracking-[0.16em] text-noir-ink-faint sm:px-6 sm:text-[11px]">
            <span>{about.name.toUpperCase()} TERMINAL [V1.0]</span>
            <span>STRUCTURED INTAKE</span>
          </div>

          <form className="space-y-7 p-5 sm:p-7" onSubmit={handleSubmit} noValidate>
            <p className="font-mono text-[11px] tracking-[0.14em] text-noir-ink-soft sm:text-xs">
              GUEST@{about.name.split(" ")[0].toUpperCase()}:~$ INIT-COLLAB
            </p>

            <div className="space-y-3">
              <p className="font-mono text-[11px] tracking-[0.14em] text-noir-ink-soft sm:text-xs">
                [?] WHAT KIND OF CONVERSATION IS THIS?
              </p>
              {renderChips(CONVERSATION_TYPES, conversation, setConversation, "Conversation type")}
            </div>

            <div className="space-y-3">
              <label
                htmlFor="contact-name"
                className="block font-mono text-[11px] tracking-[0.14em] text-noir-ink-soft sm:text-xs"
              >
                [?] WHAT IS YOUR NAME?
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.name)}
                placeholder={t("yourNamePlaceholder")}
                className={`${inputBase} ${fieldErrors.name ? "border-red-400" : "border-noir-border"}`}
              />
              {fieldErrors.name && (
                <p className="text-xs font-medium text-red-400">{fieldErrors.name}</p>
              )}
            </div>

            <div className="space-y-3">
              <p className="font-mono text-[11px] tracking-[0.14em] text-noir-ink-soft sm:text-xs">
                [?] WHAT ARE THE STAKES?
              </p>
              {renderChips(STAKES, stake, setStake, "Stakes")}
            </div>

            <div className="space-y-3">
              <label
                htmlFor="contact-message"
                className="block font-mono text-[11px] tracking-[0.14em] text-noir-ink-soft sm:text-xs"
              >
                [?] BRIEF MISSION DESCRIPTION:
              </label>
              <textarea
                id="contact-message"
                name="message"
                rows={6}
                value={formData.message}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.message)}
                placeholder={t("yourMessagePlaceholder")}
                className={`${inputBase} resize-none ${
                  fieldErrors.message ? "border-red-400" : "border-noir-border"
                }`}
              />
              {fieldErrors.message && (
                <p className="text-xs font-medium text-red-400">{fieldErrors.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <label
                htmlFor="contact-email"
                className="block font-mono text-[11px] tracking-[0.14em] text-noir-ink-soft sm:text-xs"
              >
                [?] WHAT IS YOUR EMAIL?
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.email)}
                placeholder={t("yourEmailPlaceholder")}
                className={`${inputBase} ${fieldErrors.email ? "border-red-400" : "border-noir-border"}`}
              />
              {fieldErrors.email && (
                <p className="text-xs font-medium text-red-400">{fieldErrors.email}</p>
              )}
            </div>

            <div className="border-t border-noir-border pt-6">
              <p className="font-mono text-[10px] tracking-[0.14em] text-noir-ink-faint sm:text-[11px]">
                SPAM CHECKS ACTIVE. REAL INBOX, REAL FOLLOW-UP.
              </p>

              <button
                type="submit"
                disabled={status === "sending"}
                className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-md border border-noir-border px-6 py-4 font-mono text-xs tracking-[0.18em] text-noir-ink transition-all duration-300 hover:border-[rgba(var(--accent-rgb),0.8)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {status === "sending" ? t("sendingMessage").toUpperCase() : "SEND MISSION"}
                <span aria-hidden>→</span>
              </button>

              {status === "success" && (
                <p className="mt-4 font-mono text-xs text-[var(--accent)]">{t("sendMessageSuccess")}</p>
              )}
              {status === "error" && (
                <p className="mt-4 font-mono text-xs text-red-400">{t("sendMessageError")}</p>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
