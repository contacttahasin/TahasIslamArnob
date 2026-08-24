"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import gsap from "gsap";
import { useTranslations } from "next-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useReducedMotion } from "../shared/hooks/useReducedMotion";
import SpecularButton from "../shared/SpecularButton";
import {
  faFacebook,
  faInstagram,
  faLinkedin,
  faGithub,
  faXTwitter,
  faWhatsapp,
} from "@fortawesome/free-brands-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { about } from "@/data/about";
import EchoText from "@/components/EchoText";
import { useResponsiveFontSize } from "../shared/hooks/useResponsiveFontSize";

const NAME_FONT_SIZE_RULES = [
  { minWidth: 0, vw: 8 },
  { minWidth: 640, px: 36 },
  { minWidth: 1024, px: 48 },
  { minWidth: 1280, px: 60 },
];

const SOCIAL_ICONS: Record<string, IconDefinition> = {
  facebook: faFacebook,
  instagram: faInstagram,
  linkedin: faLinkedin,
  github: faGithub,
  twitter: faXTwitter,
  whatsapp: faWhatsapp,
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 * i },
  }),
};

export default function Hero() {
  const reducedMotion = useReducedMotion();
  const bgImgRef = useRef<HTMLImageElement>(null);
  const t = useTranslations("common");
  const [showNameEffect, setShowNameEffect] = useState(false);
  const nameFontSize = useResponsiveFontSize(NAME_FONT_SIZE_RULES, 48);

  useEffect(() => {
    if (reducedMotion || !bgImgRef.current) return;
    // Barely-there Ken Burns drift — the image should read as a normal
    // full-screen background, not a zoomed-in crop.
    const tween = gsap.fromTo(
      bgImgRef.current,
      { scale: 1, xPercent: 0 },
      { scale: 1.03, xPercent: -1, duration: 24, ease: "sine.inOut", yoyo: true, repeat: -1 }
    );
    return () => {
      tween.kill();
    };
  }, [reducedMotion]);

  return (
    <section className="relative flex min-h-screen w-full items-center overflow-hidden bg-noir-bg px-6 pt-32 pb-20 sm:px-10 lg:px-16 lg:pt-40">
      {/* Full-bleed background portrait — sized to fill the screen, not zoomed in */}
      <Image
        ref={bgImgRef}
        src="/hero/about.png"
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        className="object-cover object-center will-change-transform"
      />
      <div className="absolute inset-0 bg-linear-to-r from-noir-bg via-noir-bg/85 to-noir-bg/35" />
      <div className="absolute inset-0 bg-linear-to-t from-noir-bg via-noir-bg/10 to-transparent" />

      <div className="pointer-events-none absolute -top-40 left-1/4 h-[520px] w-[520px] rounded-full bg-noir-gold/10 blur-[160px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[420px] w-[420px] translate-y-1/3 rounded-full bg-noir-gold-bright/10 blur-[150px]" />

      <div className="relative mx-auto w-full max-w-7xl">
        {/* Editorial intro */}
        <div className="relative max-w-2xl">
          <motion.span
            initial="hidden"
            animate="show"
            custom={0}
            variants={fadeUp}
            className="mb-6 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.4em] text-noir-gold"
          >
            <span className="h-1 w-1 rounded-full bg-noir-gold" />
            {t("aboutMe")}
          </motion.span>

          <motion.h1
            initial="hidden"
            animate="show"
            custom={1}
            variants={fadeUp}
            onAnimationComplete={() => setShowNameEffect(true)}
            className="font-jakarta-sans text-[8vw] font-bold uppercase leading-[0.92] tracking-tight text-noir-ink sm:text-4xl lg:text-5xl xl:text-6xl"
          >
            {showNameEffect ? (
              <EchoText
                text={about.name}
                color="currentColor"
                tint="var(--accent)"
                fontSize={`${nameFontSize}px`}
                fontWeight={700}
              />
            ) : (
              about.name
            )}
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="show"
            custom={2}
            variants={fadeUp}
            className="mt-6 max-w-xl text-lg font-medium text-noir-gold-bright sm:text-xl text-[2vw] lg:text-4xl"
          >
            {about.title}
          </motion.p>

          <motion.p
            initial="hidden"
            animate="show"
            custom={3}
            variants={fadeUp}
            className="mt-5 max-w-lg text-base leading-relaxed text-noir-ink-soft"
          >
            {about.bio}
          </motion.p>

          <motion.div
            initial="hidden"
            animate="show"
            custom={4}
            variants={fadeUp}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <SpecularButton
              href={about.resumeUrl}
              external
              ariaLabel={t("downloadCV")}
              size="md"
              radius={12}
              tintOpacity={0.08}
              textColor="var(--noir-ink)"
            >
              {t("downloadCV")}
            </SpecularButton>

            <SpecularButton href="#contact" ariaLabel={t("getInTouch")} size="md" radius={12}>
              {t("letsTalk")}
            </SpecularButton>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="show"
            custom={5}
            variants={fadeUp}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            {about.socials.map(({ label, href, icon }) => {
              const Wrapper = href ? "a" : "div";
              const linkProps = href
                ? { href, target: "_blank", rel: "noopener noreferrer" }
                : {};

              return (
                <Wrapper
                  key={label}
                  {...linkProps}
                  aria-label={label}
                  className="group flex h-11 w-11 items-center justify-center rounded-full border border-noir-border bg-noir-surface/70 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-noir-gold/70 hover:shadow-[0_10px_26px_-8px_rgba(217,178,111,0.45)]"
                >
                  <FontAwesomeIcon
                    icon={SOCIAL_ICONS[icon]}
                    className="h-4 w-4 text-noir-ink-faint transition-colors duration-300 group-hover:text-noir-gold-bright"
                  />
                </Wrapper>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.8 }}
        className="absolute bottom-10 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-noir-ink-faint sm:flex"
      >
        {t("scroll")}
        <span className="h-10 w-px bg-linear-to-b from-noir-ink-faint to-transparent" />
      </motion.div>
    </section>
  );
}

