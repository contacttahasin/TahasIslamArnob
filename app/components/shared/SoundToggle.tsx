"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useUiSoundEnabled } from "@/app/lib/uiSoundContext";

/** Small mute/unmute control for the site's UI sound effects. */
export default function SoundToggle() {
  const { enabled, toggle } = useUiSoundEnabled();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={enabled ? "Mute interface sounds" : "Unmute interface sounds"}
      aria-pressed={enabled}
      className="flex h-8 w-8 items-center justify-center rounded-full text-ink-secondary transition-colors hover:text-ink"
    >
      {enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
    </button>
  );
}
