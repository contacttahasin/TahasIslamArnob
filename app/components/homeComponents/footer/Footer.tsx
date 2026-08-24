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

const SOCIAL_ICONS: Partial<Record<SocialLink["icon"], IconDefinition>> = {
  facebook: faFacebook,
  instagram: faInstagram,
  whatsapp: faWhatsapp,
};

const whatsappMethod = contact.methods.find((m) => m.icon === "whatsapp");

export default function Footer() {
  const t = useTranslations("footer");
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
    <footer className="relative overflow-hidden bg-bg-primary px-6 pt-20 pb-10 text-ink">

      {/* Background Glow */}
      <div className="absolute left-1/2 top-0 h-[600px] w-[700px] -translate-x-1/2 rounded-full bg-linear-to-br from-noir-gold/20 to-noir-gold-bright/20 blur-[180px]" />

      <div
        ref={spotlightRef}
        onMouseMove={handleSpotlightMove}
        className="group relative mx-auto max-w-7xl overflow-hidden rounded-[32px] border border-line bg-white/[0.03] backdrop-blur-xl shadow-[0_0_60px_rgba(var(--accent-rgb),.08)]"
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

        <div className="grid gap-12 px-5 py-10 sm:px-6 md:px-8 lg:grid-cols-[1.2fr_2fr_1fr] lg:px-10">

          {/* LEFT */}
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-noir-gold/30 bg-noir-gold/10 shadow-[0_0_25px_rgba(var(--accent-rgb),.25)]">
                <div className="h-6 w-6 rotate-45 rounded-sm border-2 border-noir-gold" />
              </div>

              <h2 className="text-3xl font-bold">TAHASIN</h2>
            </div>

            <p className="mt-8 max-w-sm leading-8 text-ink-secondary">
              {t("tagline")}
            </p>

            <div className="mt-10 space-y-5">

              <a
                href={`mailto:${about.contactEmail}`}
                className="flex items-center gap-3 break-all transition-colors hover:text-noir-gold-bright"
              >
                <Mail size={18} />
                {about.contactEmail}
              </a>

              {whatsappMethod && (
                <a
                  href={whatsappMethod.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 transition-colors hover:text-noir-gold-bright"
                >
                  <Phone size={18} />
                  {whatsappMethod.value}
                </a>
              )}

              <div className="flex items-center gap-3">
                <MapPin size={18} />
                Khulna, Bangladesh
              </div>

            </div>
          </div>

          {/* CENTER */}

          <div className="grid grid-cols-2 gap-6 sm:gap-10 md:grid-cols-4">

            <div>
              <div className="mb-6 flex items-center gap-2 font-semibold">
                <Home size={18} />
                {t("company")}
              </div>

              <ul className="space-y-4 wrap-break-word text-ink-secondary">
                <li>{t("about")}</li>
                <li>{t("team")}</li>
                <li>{t("careers")}</li>
                <li>{t("blog")}</li>
              </ul>
            </div>

            <div>
              <div className="mb-6 flex items-center gap-2 font-semibold">
                <Briefcase size={18} />
                {t("servicesHeading")}
              </div>

              <ul className="space-y-4 wrap-break-word text-ink-secondary">
                <li>{t("uiDesign")}</li>
                <li>{t("development")}</li>
                <li>{t("branding")}</li>
                <li>{t("consulting")}</li>
              </ul>
            </div>

            <div>
              <div className="mb-6 flex items-center gap-2 font-semibold">
                <FileText size={18} />
                {t("resources")}
              </div>

              <ul className="space-y-4 wrap-break-word text-ink-secondary">
                <li>{t("documentation")}</li>
                <li>{t("guides")}</li>
                <li>{t("helpCenter")}</li>
                <li>{t("community")}</li>
              </ul>
            </div>

            <div>
              <div className="mb-6 flex items-center gap-2 font-semibold">
                <ShieldCheck size={18} />
                {t("legal")}
              </div>

              <ul className="space-y-4 wrap-break-word text-ink-secondary">
                <li>
                  <TransitionLink href="/privacy" className="hover:text-noir-gold-bright">
                    {t("privacy")}
                  </TransitionLink>
                </li>
                <li>
                  <TransitionLink href="/terms" className="hover:text-noir-gold-bright">
                    {t("terms")}
                  </TransitionLink>
                </li>
                <li>
                  <TransitionLink href="/cookies" className="hover:text-noir-gold-bright">
                    {t("cookies")}
                  </TransitionLink>
                </li>
                <li>{t("license")}</li>
              </ul>
            </div>

          </div>

          {/* Newsletter */}

          <div>
            <div className="rounded-[28px] border border-line bg-white/[0.04] p-8 backdrop-blur-xl shadow-[0_0_40px_rgba(var(--accent-rgb),.08)]">

              <h3 className="text-2xl font-semibold">
                {t("stayUpdated")}
              </h3>

              <p className="mt-4 text-ink-secondary">
                {t("subscribeText")}
              </p>

              <form onSubmit={handleSubscribe} noValidate>
                <input
                  type="email"
                  value={subscribeEmail}
                  onChange={(e) => {
                    setSubscribeEmail(e.target.value);
                    if (subscribeStatus !== "idle" && subscribeStatus !== "sending") setSubscribeStatus("idle");
                  }}
                  placeholder={t("emailPlaceholder")}
                  aria-invalid={subscribeStatus === "invalid"}
                  className={`mt-8 h-14 w-full rounded-full border bg-transparent px-6 outline-none placeholder:text-ink-muted focus:border-noir-gold ${
                    subscribeStatus === "invalid" ? "border-red-400" : "border-line"
                  }`}
                />

                <button
                  type="submit"
                  disabled={subscribeStatus === "sending"}
                  className="mt-5 h-14 w-full rounded-full bg-noir-gold font-semibold text-ink transition duration-300 hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(var(--accent-rgb),.45)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {subscribeStatus === "sending" ? t("subscribing") : t("subscribe")}
                </button>

                {subscribeStatus === "success" && (
                  <p className="mt-3 text-center text-sm font-medium text-noir-gold">{t("subscribeSuccess")}</p>
                )}
                {subscribeStatus === "invalid" && (
                  <p className="mt-3 text-center text-sm font-medium text-red-400">{t("subscribeInvalidEmail")}</p>
                )}
                {subscribeStatus === "error" && (
                  <p className="mt-3 text-center text-sm font-medium text-red-400">{t("subscribeError")}</p>
                )}
              </form>

            </div>
          </div>

        </div>

        {/* Bottom */}

        <div className="flex flex-col items-center justify-between gap-6 border-t border-line px-10 py-5 md:flex-row">

          <p className="flex items-center gap-1 text-center text-sm text-ink-muted">
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

          <div className="flex gap-6 text-sm text-ink-secondary">
            <TransitionLink href="/privacy" className="hover:text-noir-gold-bright">{t("privacy")}</TransitionLink>
            <TransitionLink href="/terms" className="hover:text-noir-gold-bright">{t("terms")}</TransitionLink>
            <TransitionLink href="/cookies" className="hover:text-noir-gold-bright">{t("cookies")}</TransitionLink>
          </div>

          {/* Social Icons */}
          <div className="flex gap-3">
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
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white/5 text-ink-secondary transition-colors hover:border-noir-gold-bright/60 hover:text-noir-gold-bright"
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