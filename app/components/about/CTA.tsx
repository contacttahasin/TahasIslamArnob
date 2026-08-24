"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { about } from "@/data/about";
import DepthText from "@/components/DepthText";
import TextType from "@/components/TextType";
import { useScrollReveal } from "../shared/hooks/useScrollReveal";
import SpecularButton from "../shared/SpecularButton";

export default function CTA() {
  const itemsRef = useRef<Array<HTMLElement | null>>([]);
  const t = useTranslations("common");
  const [showNameEffect, setShowNameEffect] = useState(false);

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
    { idle: () => setShowNameEffect(true) }
  );

  return (
    <section
      id="contact"
      className="relative w-full overflow-hidden bg-noir-bg px-6 py-28 sm:px-10 lg:px-16"
    >
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-noir-gold/10 blur-[180px]" />

      <div ref={sectionRef} className="relative mx-auto max-w-4xl text-center">
        <span
          ref={(el) => {
            itemsRef.current[0] = el;
          }}
          className="mb-6 flex items-center justify-center gap-3 text-xs font-medium uppercase tracking-[0.4em] text-noir-gold"
        >
          <span className="h-1 w-1 rounded-full bg-noir-gold" />
          {t("getInTouch")}
          <span className="h-1 w-1 rounded-full bg-noir-gold" />
        </span>

        <h2
          ref={(el) => {
            itemsRef.current[1] = el;
          }}
          className="font-jakarta-sans text-5xl font-bold uppercase leading-[0.95] tracking-tight text-noir-ink sm:text-7xl lg:text-8xl"
        >
          {showNameEffect ? (
            <TextType
              as="span"
              text={["Let's Build Something Remarkable"]}
              loop={false}
              showCursor
              cursorCharacter="_"
              typingSpeed={45}
            />
          ) : (
            "Let's Build Something Remarkable"
          )}
        </h2>

        <p
          ref={(el) => {
            itemsRef.current[2] = el;
          }}
          className="mx-auto mt-8 max-w-xl text-base text-noir-ink-soft sm:text-lg"
        >
          {about.availability.message} Have a project in mind? I&apos;d love to hear about it.
        </p>

        <div
          ref={(el) => {
            itemsRef.current[3] = el;
          }}
          className="mt-10 flex flex-wrap items-center justify-center gap-5"
        >
          <SpecularButton
            href={`mailto:${about.contactEmail}`}
            ariaLabel={t("emailMe")}
            size="lg"
            radius={12}
            className="max-w-full wrap-break-word"
          >
            {about.contactEmail}
          </SpecularButton>
        </div>

        <p
          ref={(el) => {
            itemsRef.current[4] = el;
          }}
          className="mt-16 text-xs uppercase tracking-[0.3em] text-noir-ink-faint"
        >
          {showNameEffect ? (
            <DepthText text={about.name} faceColor="currentColor" depthColor="var(--accent)" fontSize="12px" fontWeight={500} tilt={3} orbitSpeed={0.15} />
          ) : (
            about.name
          )}{" "}
          — {about.location}
        </p>
      </div>
    </section>
  );
}
