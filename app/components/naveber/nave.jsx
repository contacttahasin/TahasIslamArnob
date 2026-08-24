"use client";

import { useContext } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Navecontext } from "@/app/naveContext/NaveContext";
import TransitionLink from "@/app/components/transition/TransitionLink";
import SoundToggle from "@/app/components/shared/SoundToggle";
import ThemePicker from "@/app/components/theme/ThemePicker";
import LanguageSwitcher from "@/app/components/language/LanguageSwitcher";

function Nave() {
  const { setOpen } = useContext(Navecontext);
  const t = useTranslations("nav");

  return (
    <div className="w-full h-15 pl-4 sm:pl-8 pt-2 flex justify-between items-center gap-2">
      <TransitionLink href="/" className="shrink-0">
        <Image src="/logo/logo.png" alt="" width={40} height={40} className="w-10 scale-180" />
      </TransitionLink>

      <div className="flex items-center gap-1.5 sm:gap-3 pr-3 sm:pr-4 shrink-0">
        <SoundToggle />
        <ThemePicker mobileCenter />
        <LanguageSwitcher />
        <p
          className="font-[font4] italic cursor-pointer text-sm sm:text-base whitespace-nowrap"
          onClick={() => setOpen(true)}
        >
          {t("menu").toUpperCase()}
        </p>
      </div>
    </div>
  );
}

export default Nave;