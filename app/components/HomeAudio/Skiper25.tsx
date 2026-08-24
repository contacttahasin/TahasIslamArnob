"use client";

import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import useSound from "use-sound";
import { useUiSoundEnabled } from "@/app/lib/uiSoundContext";

const Skiper25 = () => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <div className="text-foreground absolute top-[20%] grid content-start justify-items-center gap-6 py-20 text-center">
        <span className="after:from-background after:to-foreground relative max-w-[12ch] text-xs uppercase leading-tight opacity-40 after:absolute after:left-1/2 after:top-full after:h-16 after:w-px after:bg-gradient-to-b after:content-['']">
          Click to play the music
        </span>
      </div>
      <MusicToggleButton />
    </div>
  );
};

export { Skiper25 };

export const MusicToggleButton = () => {
  const bars = 5;
  const pathname = usePathname();
  const { enabled: uiSoundEnabled } = useUiSoundEnabled();

  const getRandomHeights = () => {
    return Array.from({ length: bars }, () => Math.random() * 0.8 + 0.2);
  };

  const [heights, setHeights] = useState(getRandomHeights());

  const [isPlaying, setIsPlaying] = useState(false);

  const [play, { pause, stop }] = useSound("/audio/The_weekend_-_sao_paulo_tiktok_slow_version_(mp3.pm).mp3", {
    loop: false,
    onplay: () => setIsPlaying(true),
    onend: () => setIsPlaying(false),
    onpause: () => setIsPlaying(false),
    onstop: () => setIsPlaying(false),
    soundEnabled: true,
  });

  // This component only exists inside Home's own page content, so it can
  // never re-render with a non-"/" pathname while still mounted — leaving
  // "/" always unmounts it rather than updating it in place. That means
  // the reliable signal for "the route changed away from Home" is React's
  // own cleanup function, not a reactive `pathname !== "/"` branch (which
  // would be dead code here). The cleanup runs both on unmount and right
  // before this effect re-fires for a dependency change, so `stop()`
  // (pause + rewind to 0, per Howler) always fires exactly when leaving.
  // uiSoundEnabled is the navbar's sound on/off switch — mirrored here so
  // toggling it off/on there also stops/starts this background track.
  /* eslint-disable react-hooks/set-state-in-effect --
   * these setState calls mirror the imperative Howler play()/stop() calls
   * alongside them and reset the waveform on stop; neither is a value
   * derivable during render. */
  useEffect(() => {
    if (pathname === "/" && uiSoundEnabled) {
      play();
      setIsPlaying(true);
    } else {
      stop();
      setIsPlaying(false);
    }

    return () => {
      stop();
      setIsPlaying(false);
    };
  }, [pathname, uiSoundEnabled, play, stop]);

  useEffect(() => {
    if (isPlaying) {
      const waveformIntervalId = setInterval(() => {
        setHeights(getRandomHeights());
      }, 100);

      return () => {
        clearInterval(waveformIntervalId);
      };
    }
    setHeights(Array(bars).fill(0.1));
  }, [isPlaying]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleClick = () => {
    if (!uiSoundEnabled) return;

    if (isPlaying) {
      pause();
      setIsPlaying(false);
      return;
    }
    play();
    setIsPlaying(true);
  };

  return (
    <>
      <motion.div
        onClick={handleClick}
        key="audio"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
        className="cursor-pointer rounded-full border border-line bg-bg-elevated/70 px-4 py-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] backdrop-blur-md transition-[border-color,box-shadow] duration-300 hover:border-glow-cyan/50 hover:shadow-[0_0_26px_rgba(34,211,238,0.4)]"
      >
        <motion.div
          initial={{ opacity: 0, filter: "blur(4px)" }}
          animate={{
            opacity: 1,
            filter: "blur(0px)",
          }}
          exit={{ opacity: 0, filter: "blur(4px)" }}
          transition={{ type: "spring", bounce: 0.35 }}
          className="flex h-[18px] w-full items-center gap-1 rounded-full"
        >
          {/* Waveform visualization */}
          {heights.map((height, index) => (
            <motion.div
              key={index}
              className="w-[1px] rounded-full bg-glow-cyan"
              initial={{ height: 1 }}
              animate={{
                height: Math.max(4, height * 14),
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 10,
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </>
  );
};

/**
 * Skiper 25 Micro Interactions_005 — React + framer motion + use-sound
 *
 * License & Usage:
 * - Free to use and modify in both personal and commercial projects.
 * - Attribution to Skiper UI is required when using the free version.
 * - No attribution required with Skiper UI Pro.
 *
 * Feedback and contributions are welcome.
 *
 * Author: @gurvinder-singh02
 * Website: https://gxuri.me
 * Twitter: https://x.com/Gur__vi
 */
