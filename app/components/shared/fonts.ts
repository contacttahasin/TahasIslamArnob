import { Anton, JetBrains_Mono, Playfair_Display, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";

/**
 * Editorial display font for About/Projects. Scoped via `variable` rather
 * than added to the shared root layout — apply `jakarta.variable` to each
 * page's root wrapper so the `font-jakarta-sans` Tailwind utility (see
 * globals.css) resolves within that subtree only.
 */
export const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta-sans",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

/**
 * Type set for the drone-camera scroll hero (homeComponents/DroneScrollHero).
 * Scoped the same way as `jakarta` above — the variables are applied to that
 * section's own wrapper, so nothing else on the site inherits them.
 */
export const anton = Anton({
  subsets: ["latin"],
  variable: "--font-anton",
  weight: "400",
  display: "swap",
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500"],
  style: "italic",
  display: "swap",
});
