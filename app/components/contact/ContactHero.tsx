"use client";

import { useEffect, useRef, useState } from "react";
import { getCalApi } from "@calcom/embed-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faPhone, faComment } from "@fortawesome/free-solid-svg-icons";
import {
  faWhatsapp,
  faFacebook,
  faInstagram,
  faLinkedin,
  faGithub,
  faXTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useTranslations } from "next-intl";
import { contact } from "@/data/contact";
import { useScrollReveal } from "../shared/hooks/useScrollReveal";
import SpecularButton from "../shared/SpecularButton";
import GlitchText from "@/components/GlitchText";

const CAL_LINK = "tahasin-islam-arnob-pw0gbn/30min";

const METHOD_ICONS: Record<string, IconDefinition> = {
  email: faEnvelope,
  whatsapp: faWhatsapp,
};

// contact.methods[].label lives in data/contact.ts (its own source of
// truth), translated copy lives in messages/*.json — map the icon key
// (stable) to the matching translation key.
const METHOD_LABEL_KEY: Record<string, string> = {
  email: "email",
  whatsapp: "whatsapp",
};

const SOCIAL_ICONS: Record<string, IconDefinition> = {
  facebook: faFacebook,
  instagram: faInstagram,
  linkedin: faLinkedin,
  github: faGithub,
  twitter: faXTwitter,
  whatsapp: faWhatsapp,
};

export default function ContactHero() {
  const t = useTranslations("contact");
  const itemsRef = useRef<Array<HTMLElement | null>>([]);
  const [showHeadingEffect, setShowHeadingEffect] = useState(false);

  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: "30min" });
      cal("ui", {
        theme: "dark",
        styles: { branding: { brandColor: "var(--accent)" } },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, []);

  const openBookingModal = async () => {
    const cal = await getCalApi({ namespace: "30min" });
    cal("modal", { calLink: CAL_LINK });
  };

  const sectionRef = useScrollReveal<HTMLDivElement>(
    (tl) => {
      tl.from(itemsRef.current, {
        opacity: 0,
        y: 30,
        filter: "blur(10px)",
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.12,
      });
    },
    { idle: () => setShowHeadingEffect(true) }
  );

  return (
    <section className="relative w-full overflow-hidden bg-noir-bg px-6 pt-32 pb-20 sm:px-10 lg:px-16 lg:pt-40">
      <div className="pointer-events-none absolute -top-40 left-1/4 h-[520px] w-[520px] rounded-full bg-noir-gold/10 blur-[160px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[420px] w-[420px] translate-y-1/3 rounded-full bg-noir-gold-bright/10 blur-[150px]" />

      <div ref={sectionRef} className="relative mx-auto max-w-4xl text-center">
        <span
          ref={(el) => {
            itemsRef.current[0] = el;
          }}
          className="mb-6 flex items-center justify-center gap-3 text-xs font-medium uppercase tracking-[0.4em] text-noir-gold"
        >
          <span className="h-1 w-1 rounded-full bg-noir-gold" />
          {t("subheading")}
          <span className="h-1 w-1 rounded-full bg-noir-gold" />
        </span>

        <h1
          ref={(el) => {
            itemsRef.current[1] = el;
          }}
          className="font-jakarta-sans text-3xl font-bold uppercase leading-[0.95] tracking-tight text-noir-ink sm:text-5xl lg:text-7xl"
        >
          {showHeadingEffect ? <GlitchText>{t("heading")}</GlitchText> : t("heading")}
        </h1>

        <p
          ref={(el) => {
            itemsRef.current[2] = el;
          }}
          className="mx-auto mt-8 max-w-xl text-base text-noir-ink-soft sm:text-lg"
        >
          {t("intro")}
        </p>

        {/* Primary CTAs */}
        <div
          ref={(el) => {
            itemsRef.current[3] = el;
          }}
          className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <SpecularButton
            onClick={openBookingModal}
            ariaLabel="Book a call"
            size="md"
            radius={999}
            tintOpacity={0.9}
          >
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faPhone} className="h-3.5 w-3.5" />
              Book a Call
            </span>
          </SpecularButton>

          <SpecularButton
            href="#message-form"
            ariaLabel="Send a message"
            size="md"
            radius={999}
            tintOpacity={0}
            textColor="var(--noir-ink)"
          >
            <span className="flex items-center gap-2">
              <FontAwesomeIcon icon={faComment} className="h-3.5 w-3.5" />
              Send Message
            </span>
          </SpecularButton>
        </div>

        {/* Contact methods */}
        <div
          ref={(el) => {
            itemsRef.current[4] = el;
          }}
          className="mx-auto mt-12 grid max-w-2xl gap-4 sm:grid-cols-2"
        >
          {contact.methods.map((method) => (
            <SpecularButton
              key={method.label}
              href={method.href}
              external={method.icon !== "email"}
              ariaLabel={method.label}
              radius={16}
              tintOpacity={0.05}
              textColor="var(--noir-ink)"
              style={{
                display: "flex",
                width: "100%",
                justifyContent: "flex-start",
                textAlign: "left",
                padding: "20px 24px",
              }}
            >
              <span className="flex w-full items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-noir-gold to-noir-gold-bright text-noir-bg">
                  <FontAwesomeIcon icon={METHOD_ICONS[method.icon]} className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs uppercase tracking-[0.2em] text-noir-ink-faint">
                    {METHOD_LABEL_KEY[method.icon] ? t(METHOD_LABEL_KEY[method.icon]) : method.label}
                  </span>
                  <span className="block truncate text-sm font-medium text-noir-ink">
                    {method.value}
                  </span>
                </span>
              </span>
            </SpecularButton>
          ))}
        </div>

        {/* Socials */}
        <div
          ref={(el) => {
            itemsRef.current[5] = el;
          }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          {contact.socials.map(({ label, href, icon }) => (
            <a
              key={label}
              href={href ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="group flex h-11 w-11 items-center justify-center rounded-full border border-noir-border bg-noir-surface/70 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-noir-gold/70 hover:shadow-[0_10px_26px_-8px_rgba(217,178,111,0.45)]"
            >
              <FontAwesomeIcon
                icon={SOCIAL_ICONS[icon]}
                className="h-4 w-4 text-noir-ink-faint transition-colors duration-300 group-hover:text-noir-gold-bright"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
