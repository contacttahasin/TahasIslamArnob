"use client";

import { useEffect } from "react";
import useSound from "use-sound";
import { useUiSoundEnabled } from "@/app/lib/uiSoundContext";

/**
 * Plays click.wav for every button on the site via a single delegated
 * document-level listener, instead of wiring useSound into each button
 * individually — so any current or future <button>/role="button" element
 * gets the sound automatically with zero per-component setup. Reuses the
 * same UiSoundContext the Navbar mute toggle already controls, so muting
 * silences these too. `interrupt: true` restarts the sample on rapid
 * repeat clicks instead of letting overlapping instances pile up.
 * Opt an individual button out (e.g. one that already plays its own sound
 * on click) with a `data-no-sound` attribute.
 */
export default function GlobalClickSound() {
  const { enabled } = useUiSoundEnabled();
  const [play] = useSound("/audio/ui/click.wav", {
    volume: 0.4,
    soundEnabled: enabled,
    interrupt: true,
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const trigger = target?.closest<HTMLElement>("button, [role='button']");
      if (!trigger || trigger.hasAttribute("data-no-sound")) return;
      if (trigger.hasAttribute("disabled") || trigger.getAttribute("aria-disabled") === "true") return;
      play();
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [play]);

  return null;
}
