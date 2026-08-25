"use client";

import { useRef, useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Home,
  Briefcase,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook, faInstagram, faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import emailjs from "@emailjs/browser";
import { about, type SocialLink } from "@/data/about";
import { contact } from "@/data/contact";
import { EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY } from "@/lib/emailjs";
import StrokeText from "@/components/StrokeText";
import { isValidEmail } from "@/lib/validation";
import TransitionLink from "../../transition/TransitionLink";
import { jetbrainsMono } from "../../shared/fonts";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const SOCIAL_ICONS: Partial<Record<SocialLink["icon"], IconDefinition>> = {
  facebook: faFacebook,
  instagram: faInstagram,
  whatsapp: faWhatsapp,
};

const whatsappMethod = contact.methods.find((m) => m.icon === "whatsapp");

/** The editor face, applied inline so the section carries its own font
 *  variable and works on any page — see Timeline for the same pattern. */
const MONO = { fontFamily: "var(--font-jetbrains-mono), monospace" } as const;

/** Typed out into the terminal bar when the footer scrolls into view. */
const TERMINAL_PATH = "~/tahasin/portfolio $ whoami";

export default function Footer() {
  const t = useTranslations("footer");
  const rootRef = useRef<HTMLElement>(null);
  const pathRef = useRef<HTMLSpanElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  const handleSpotlightMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = spotlightRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState<"idle" | "sending" | "success" | "invalid" | "error">(
    "idle"
  );

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduced) {
        if (pathRef.current) pathRef.current.textContent = TERMINAL_PATH;
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: { trigger: rootRef.current, start: "top 85%", once: true },
      });

      // The console boots first: window chrome, then the prompt types itself.
      tl.from(".fx-card", { y: 44, opacity: 0, filter: "blur(10px)", duration: 0.9 })
        .from(".fx-chrome > *", { opacity: 0, y: -6, stagger: 0.06, duration: 0.4 }, "-=0.5");

      const typed = { chars: 0 };
      tl.to(
        typed,
        {
          chars: TERMINAL_PATH.length,
          duration: 1.1,
          ease: "none",
          onUpdate: () => {
            if (pathRef.current) {
              pathRef.current.textContent = TERMINAL_PATH.slice(0, Math.round(typed.chars));
            }
          },
        },
        "-=0.25"
      );

      // Then the panes fill in, column by column, the way output streams.
      tl.from(
        ".fx-col",
        { y: 26, opacity: 0, filter: "blur(6px)", stagger: 0.12, duration: 0.7 },
        "-=0.8"
      )
        .from(".fx-row", { x: -14, opacity: 0, stagger: 0.07, duration: 0.5 }, "-=0.5")
        .from(".fx-rule", { scaleX: 0, transformOrigin: "left center", duration: 0.7 }, "-=0.4")
        .from(".fx-foot", { y: 14, opacity: 0, stagger: 0.08, duration: 0.5 }, "-=0.35");
    },
    { scope: rootRef }
  );

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = subscribeEmail.trim();

    if (!isValidEmail(email)) {
      setSubscribeStatus("invalid");
      return;
    }

    setSubscribeStatus("sending");
    try {
      // Reuses the same EmailJS service/template as ContactFormNoir — it
      // notifies the site owner's inbox regardless of which field sends
      // it, so a subscription just needs to fill in enough of the
      // template's fields to read clearly as one, not the contact form.
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          name: "Newsletter Subscriber",
          email,
          phone: "",
          country: "",
          title: "New Newsletter Subscription",
          message: `${email} subscribed to the newsletter from the footer.`,
        },
        EMAILJS_PUBLIC_KEY
      );
      setSubscribeStatus("success");
      setSubscribeEmail("");
    } catch {
      setSubscribeStatus("error");
    }
  };

  return (
    <footer
      ref={rootRef}
      className={`${jetbrainsMono.variable} relative overflow-hidden bg-bg-primary px-4 pt-20 pb-10 text-ink sm:px-6`}
    >

      {/* Background Glow */}
      <div className="absolute left-1/2 top-0 h-[600px] w-[700px] -translate-x-1/2 rounded-full bg-linear-to-br from-noir-gold/20 to-noir-gold-bright/20 blur-[180px]" />

      {/* Faint editor grid behind the glass — the only new decoration, and
          it sits under the same blur so the panel still reads as glass. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
      />

      <div
        ref={spotlightRef}
        onMouseMove={handleSpotlightMove}
        className="fx-card group relative mx-auto max-w-7xl overflow-hidden rounded-[32px] border border-line bg-white/[0.03] backdrop-blur-xl shadow-[0_0_60px_rgba(var(--accent-rgb),.08)]"
      >
        {/* Cursor-follow spotlight — same accent CSS vars the navbar theme picker writes to <html>, so the glow always matches the picked theme color. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(var(--accent-rgb), 0.35), transparent 70%)",
          }}
        />

        {/* Terminal chrome */}
        <div className="fx-chrome relative flex items-center gap-2 border-b border-line px-5 py-3 sm:px-6 md:px-8 lg:px-10">
          <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full bg-line" />
          <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full bg-line" />
          <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full bg-line" />

          <span
            aria-hidden
            style={MONO}
            className="ml-2 min-w-0 truncate text-[10px] tracking-[0.12em] text-ink-muted sm:ml-3 sm:text-[11px]"
          >
            <span ref={pathRef} />
            <span className="ml-[2px] inline-block h-[1em] w-[6px] translate-y-[0.15em] animate-pulse bg-noir-gold-bright align-middle" />
          </span>

          <span
            aria-hidden
            style={MONO}
            className="ml-auto hidden shrink-0 items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-noir-gold-bright sm:flex"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-noir-gold-bright" />
            online
          </span>
        </div>

        <div className="grid gap-10 px-5 py-10 sm:gap-12 sm:px-6 md:px-8 lg:grid-cols-[1.2fr_2fr_1fr] lg:px-10">

          {/* LEFT */}
          <div className="fx-col min-w-0">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-noir-gold/30 bg-noir-gold/10 shadow-[0_0_25px_rgba(var(--accent-rgb),.25)]">
                <span aria-hidden style={MONO} className="text-lg font-bold text-noir-gold">
                  &lt;/&gt;
                </span>
              </div>

              <h2 style={MONO} className="text-2xl font-bold tracking-tight sm:text-3xl">
                TAHASIN
                <span aria-hidden className="text-noir-gold-bright">_</span>
              </h2>
            </div>

            <p className="mt-8 max-w-sm leading-8 text-ink-secondary">
              {t("tagline")}
            </p>

            <div className="mt-10 space-y-5" style={MONO}>

              <a
                href={`mailto:${about.contactEmail}`}
                className="fx-row group/row flex items-center gap-3 break-all text-sm transition-colors hover:text-noir-gold-bright"
              >
                <span aria-hidden className="shrink-0 text-noir-gold/70 transition-colors group-hover/row:text-noir-gold-bright">$</span>
                <Mail size={16} className="shrink-0" />
                {about.contactEmail}
              </a>

              {whatsappMethod && (
                <a
                  href={whatsappMethod.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fx-row group/row flex items-center gap-3 text-sm transition-colors hover:text-noir-gold-bright"
                >
                  <span aria-hidden className="shrink-0 text-noir-gold/70 transition-colors group-hover/row:text-noir-gold-bright">$</span>
                  <Phone size={16} className="shrink-0" />
                  {whatsappMethod.value}
                </a>
              )}

              <div className="fx-row flex items-center gap-3 text-sm">
                <span aria-hidden className="shrink-0 text-noir-gold/70">$</span>
                <MapPin size={16} className="shrink-0" />
                Khulna, Bangladesh
              </div>

            </div>
          </div>

          {/* CENTER */}

          <div className="fx-col grid min-w-0 grid-cols-2 gap-6 sm:gap-10 md:grid-cols-4">

            <div className="min-w-0">
              <div className="mb-6 flex items-center gap-2">
                <Home size={16} className="shrink-0 text-noir-gold" />
                <span style={MONO} className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-[0.16em]">
                  {t("company")}
                </span>
              </div>

              <ul style={MONO} className="space-y-4 wrap-break-word text-[13px] text-ink-secondary">
                <li className="group/li flex gap-2">
                  <span aria-hidden style={MONO} className="text-noir-gold/50 transition-colors group-hover/li:text-noir-gold-bright">▸</span>
                  <span className="transition-colors group-hover/li:text-ink">{t("about")}</span>
                </li>
                <li className="group/li flex gap-2">
                  <span aria-hidden style={MONO} className="text-noir-gold/50 transition-colors group-hover/li:text-noir-gold-bright">▸</span>
                  <span className="transition-colors group-hover/li:text-ink">{t("team")}</span>
                </li>
                <li className="group/li flex gap-2">
                  <span aria-hidden style={MONO} className="text-noir-gold/50 transition-colors group-hover/li:text-noir-gold-bright">▸</span>
                  <span className="transition-colors group-hover/li:text-ink">{t("careers")}</span>
                </li>
                <li className="group/li flex gap-2">
                  <span aria-hidden style={MONO} className="text-noir-gold/50 transition-colors group-hover/li:text-noir-gold-bright">▸</span>
                  <span className="transition-colors group-hover/li:text-ink">{t("blog")}</span>
                </li>
              </ul>
            </div>

            <div className="min-w-0">
              <div className="mb-6 flex items-center gap-2">
                <Briefcase size={16} className="shrink-0 text-noir-gold" />
                <span style={MONO} className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-[0.16em]">
                  {t("servicesHeading")}
                </span>
              </div>

              <ul style={MONO} className="space-y-4 wrap-break-word text-[13px] text-ink-secondary">
                <li className="group/li flex gap-2">
                  <span aria-hidden style={MONO} className="text-noir-gold/50 transition-colors group-hover/li:text-noir-gold-bright">▸</span>
                  <span className="transition-colors group-hover/li:text-ink">{t("uiDesign")}</span>
                </li>
                <li className="group/li flex gap-2">
                  <span aria-hidden style={MONO} className="text-noir-gold/50 transition-colors group-hover/li:text-noir-gold-bright">▸</span>
                  <span className="transition-colors group-hover/li:text-ink">{t("development")}</span>
                </li>
                <li className="group/li flex gap-2">
                  <span aria-hidden style={MONO} className="text-noir-gold/50 transition-colors group-hover/li:text-noir-gold-bright">▸</span>
                  <span className="transition-colors group-hover/li:text-ink">{t("branding")}</span>
                </li>
                <li className="group/li flex gap-2">
                  <span aria-hidden style={MONO} className="text-noir-gold/50 transition-colors group-hover/li:text-noir-gold-bright">▸</span>
                  <span className="transition-colors group-hover/li:text-ink">{t("consulting")}</span>
                </li>
              </ul>
            </div>

            <div className="min-w-0">
              <div className="mb-6 flex items-center gap-2">
                <FileText size={16} className="shrink-0 text-noir-gold" />
                <span style={MONO} className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-[0.16em]">
                  {t("resources")}
                </span>
              </div>

              <ul style={MONO} className="space-y-4 wrap-break-word text-[13px] text-ink-secondary">
                <li className="group/li flex gap-2">
                  <span aria-hidden style={MONO} className="text-noir-gold/50 transition-colors group-hover/li:text-noir-gold-bright">▸</span>
                  <span className="transition-colors group-hover/li:text-ink">{t("documentation")}</span>
                </li>
                <li className="group/li flex gap-2">
                  <span aria-hidden style={MONO} className="text-noir-gold/50 transition-colors group-hover/li:text-noir-gold-bright">▸</span>
                  <span className="transition-colors group-hover/li:text-ink">{t("guides")}</span>
                </li>
                <li className="group/li flex gap-2">
                  <span aria-hidden style={MONO} className="text-noir-gold/50 transition-colors group-hover/li:text-noir-gold-bright">▸</span>
                  <span className="transition-colors group-hover/li:text-ink">{t("helpCenter")}</span>
                </li>
                <li className="group/li flex gap-2">
                  <span aria-hidden style={MONO} className="text-noir-gold/50 transition-colors group-hover/li:text-noir-gold-bright">▸</span>
                  <span className="transition-colors group-hover/li:text-ink">{t("community")}</span>
                </li>
              </ul>
            </div>

            <div className="min-w-0">
              <div className="mb-6 flex items-center gap-2">
                <ShieldCheck size={16} className="shrink-0 text-noir-gold" />
                <span style={MONO} className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-[0.16em]">
                  {t("legal")}
                </span>
              </div>

              <ul style={MONO} className="space-y-4 wrap-break-word text-[13px] text-ink-secondary">
                <li className="group/li flex gap-2">
                  <span aria-hidden style={MONO} className="text-noir-gold/50 transition-colors group-hover/li:text-noir-gold-bright">▸</span>
                  <TransitionLink href="/privacy" className="transition-colors hover:text-noir-gold-bright">
                    {t("privacy")}
                  </TransitionLink>
                </li>
                <li className="group/li flex gap-2">
                  <span aria-hidden style={MONO} className="text-noir-gold/50 transition-colors group-hover/li:text-noir-gold-bright">▸</span>
                  <TransitionLink href="/terms" className="transition-colors hover:text-noir-gold-bright">
                    {t("terms")}
                  </TransitionLink>
                </li>
                <li className="group/li flex gap-2">
                  <span aria-hidden style={MONO} className="text-noir-gold/50 transition-colors group-hover/li:text-noir-gold-bright">▸</span>
                  <TransitionLink href="/cookies" className="transition-colors hover:text-noir-gold-bright">
                    {t("cookies")}
                  </TransitionLink>
                </li>
                <li className="group/li flex gap-2">
                  <span aria-hidden style={MONO} className="text-noir-gold/50 transition-colors group-hover/li:text-noir-gold-bright">▸</span>
                  <span className="transition-colors group-hover/li:text-ink">{t("license")}</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Newsletter */}

          <div className="fx-col min-w-0">
            <div className="rounded-[28px] border border-line bg-white/[0.04] p-6 backdrop-blur-xl shadow-[0_0_40px_rgba(var(--accent-rgb),.08)] sm:p-8">

              <span
                aria-hidden
                style={MONO}
                className="mb-3 block text-[10px] uppercase tracking-[0.22em] text-noir-gold/70"
              >
                {"// newsletter"}
              </span>

              <h3 style={MONO} className="text-xl font-semibold sm:text-2xl">
                {t("stayUpdated")}
              </h3>

              <p className="mt-4 text-sm text-ink-secondary">
                {t("subscribeText")}
              </p>

              <form onSubmit={handleSubscribe} noValidate>
                <div className="relative mt-8">
                  <span
                    aria-hidden
                    style={MONO}
                    className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-sm text-noir-gold/70"
                  >
                    &gt;
                  </span>
                  <input
                    type="email"
                    value={subscribeEmail}
                    onChange={(e) => {
                      setSubscribeEmail(e.target.value);
                      if (subscribeStatus !== "idle" && subscribeStatus !== "sending") setSubscribeStatus("idle");
                    }}
                    placeholder={t("emailPlaceholder")}
                    aria-invalid={subscribeStatus === "invalid"}
                    style={MONO}
                    className={`h-14 w-full rounded-full border bg-transparent pl-10 pr-5 text-sm outline-none transition-colors placeholder:text-ink-muted focus:border-noir-gold ${
                      subscribeStatus === "invalid" ? "border-red-400" : "border-line"
                    }`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={subscribeStatus === "sending"}
                  style={MONO}
                  className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-noir-gold text-sm font-semibold text-ink transition duration-300 hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(var(--accent-rgb),.45)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {subscribeStatus === "sending" ? t("subscribing") : t("subscribe")}
                  <span aria-hidden>{subscribeStatus === "sending" ? "…" : "→"}</span>
                </button>

                {subscribeStatus === "success" && (
                  <p style={MONO} className="mt-3 text-center text-xs font-medium text-noir-gold">{t("subscribeSuccess")}</p>
                )}
                {subscribeStatus === "invalid" && (
                  <p style={MONO} className="mt-3 text-center text-xs font-medium text-red-400">{t("subscribeInvalidEmail")}</p>
                )}
                {subscribeStatus === "error" && (
                  <p style={MONO} className="mt-3 text-center text-xs font-medium text-red-400">{t("subscribeError")}</p>
                )}
              </form>

            </div>
          </div>

        </div>

        {/* Bottom */}

        <div className="fx-rule h-px w-full bg-line" />

        <div className="flex flex-col items-center justify-between gap-6 px-5 py-5 sm:px-6 md:flex-row md:px-10">

          <p
            style={MONO}
            className="fx-foot flex items-center gap-1 whitespace-nowrap text-center text-xs text-ink-muted"
          >
            © 2026
            <StrokeText
              text="Tahasin"
              strokeColor="var(--accent)"
              fillColor="currentColor"
              fontSize={14}
              fontWeight={500}
              letterSpacing={0}
              trigger="scroll"
            />
            . {t("allRightsReserved")}
          </p>

          <div style={MONO} className="fx-foot flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-ink-secondary">
            <TransitionLink href="/privacy" className="hover:text-noir-gold-bright">{t("privacy")}</TransitionLink>
            <TransitionLink href="/terms" className="hover:text-noir-gold-bright">{t("terms")}</TransitionLink>
            <TransitionLink href="/cookies" className="hover:text-noir-gold-bright">{t("cookies")}</TransitionLink>
          </div>

          {/* Social Icons */}
          <div className="fx-foot flex gap-3">
            {contact.socials.map(({ label, href, icon }) => {
              const iconDef = SOCIAL_ICONS[icon];
              if (!href || !iconDef) return null;
              return (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white/5 text-ink-secondary transition-all hover:-translate-y-0.5 hover:border-noir-gold-bright/60 hover:text-noir-gold-bright"
                >
                  <FontAwesomeIcon icon={iconDef} className="h-4 w-4" />
                </a>
              );
            })}
          </div>

        </div>

      </div>
    </footer>
  );
}
