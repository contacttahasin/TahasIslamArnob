"use client";

import { Skiper58 } from "../animation/skiper58 (1)";
import Image from "next/image";
import { X } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook, faInstagram, faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { useContext, useEffect, useRef } from "react";
import { Navecontext } from "@/app/naveContext/NaveContext";
import gsap from "gsap";
import useSound from "use-sound";
import { useUiSoundEnabled } from "@/app/lib/uiSoundContext";
import { contact } from "@/data/contact";
import ThemePicker from "@/app/components/theme/ThemePicker";
import LanguageSwitcher from "@/app/components/language/LanguageSwitcher";
import Noise from "@/components/Noise";

const SOCIAL_ICONS = {
  facebook: faFacebook,
  instagram: faInstagram,
  whatsapp: faWhatsapp,
};

export default function Menu() {
  const { open, setOpen } = useContext(Navecontext);
  const { enabled: soundEnabled } = useUiSoundEnabled();
  const [playMenuOpen] = useSound("/audio/ui/menuOpen.wav", { volume: 0.5, soundEnabled });
  const [playMenuClose] = useSound("/audio/ui/menuClose.wav", { volume: 0.5, soundEnabled });

  const menuRef = useRef(null);
  const contentRef = useRef(null);

  // `playMenuOpen`'s identity changes whenever `soundEnabled` is toggled —
  // read through a ref so toggling sound mid-session can't retrigger this
  // effect (and replay the open animation) for a menu that's already open.
  const playMenuOpenRef = useRef(playMenuOpen);
  useEffect(() => {
    playMenuOpenRef.current = playMenuOpen;
  }, [playMenuOpen]);

  useEffect(() => {
    if (!open) return;
    playMenuOpenRef.current();

    gsap.set(menuRef.current, {
      x: "100%",
    });

    const tl = gsap.timeline();

    tl.to(menuRef.current, {
      x: "0%",
      duration: 0.8,
      ease: "power4.out",
    }).fromTo(
      contentRef.current,
      {
        opacity: 0,
        y: 40,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power3.out",
      },
      "-=0.4"
    );
  }, [open]);

  const handleClose = () => {
    playMenuClose();
    const tl = gsap.timeline({
      onComplete: () => {
        setOpen(false);
      },
    });

    tl.to(contentRef.current, {
      opacity: 0,
      y: 30,
      duration: 0.3,
      ease: "power2.in",
    }).to(
      menuRef.current,
      {
        x: "100%",
        duration: 0.8,
        ease: "power4.inOut",
      },
      "-=0.1"
    );
  };

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        onClick={handleClose}
        className="fixed inset-0 z-[999998] cursor-default"
      />

      <div
      ref={menuRef}
      className="fixed top-0 right-0 h-screen lg:w-1/3 w-full overflow-hidden bg-black text-white flex flex-col justify-between z-[999999]"
    >
      {/* Profile */}
      <div className="h-70 flex justify-center items-center relative">
        <Image
          src="/hero/IMG_3374.JPG"
          alt=""
          width={208}
          height={208}
          className="w-52 h-52 rounded-full object-cover border-2 border-white"
        />

        <X
          className="absolute right-5 top-5 cursor-pointer"
          onClick={handleClose}
        />
      </div>

      {/* Menu Items */}
      <div
        ref={contentRef}
        onClick={handleClose}
        className="flex-1 flex flex-col justify-center items-center cursor-pointer"
      >
        <Skiper58 />
      </div>

      {/* Bottom Icons */}
      <div className="h-24 flex justify-center gap-3 sm:gap-6 lg:gap-8 items-center px-4">
        <ThemePicker align="left" direction="up" />
        <LanguageSwitcher align="left" direction="up" />
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
              onClick={(e) => e.stopPropagation()}
              className="cursor-pointer text-white/80 transition-colors hover:text-white"
            >
              <FontAwesomeIcon icon={iconDef} className="h-5 w-5" />
            </a>
          );
        })}
      </div>

      {/* Film-grain overlay — last child so it paints over the panel's
          content; pointer-events:none keeps every control clickable. */}
      <Noise patternAlpha={18} patternRefreshInterval={3} />
      </div>
    </>
  );
}