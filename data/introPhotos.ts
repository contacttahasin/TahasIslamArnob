export type IntroPhoto = {
  /** Path under /public — swap to any image you drop into public/hero/intro/. */
  src: string;
  alt: string;
  /** Short punch word shown alongside the photo during the flash. */
  caption: string;
};

/**
 * Photos cycled rapidly during the intro's opening "photo flash" beat
 * (see CinematicIntro.tsx). Edit freely — add, remove, or reorder entries,
 * swap in new images under public/hero/intro/, and change captions. For
 * best results keep images portrait-oriented and under ~150KB (resize +
 * convert to .webp) so the flash preloads fast.
 */
export const introPhotos: IntroPhoto[] = [
  { src: "/hero/intro/5.webp", alt: "Tahasin Islam portrait, dramatic red light", caption: "Design." },
  { src: "/hero/intro/2.webp", alt: "Tahasin Islam portrait, sunlit shadows", caption: "Build." },
  { src: "/hero/intro/6.webp", alt: "Tahasin Islam portrait, golden hour", caption: "Ship." },
  { src: "/hero/intro/3.webp", alt: "Tahasin Islam portrait, concrete wall", caption: "Iterate." },
  { src: "/hero/intro/4.webp", alt: "Tahasin Islam studio portrait", caption: "Create." },
  { src: "/hero/intro/about.webp", alt: "Tahasin Islam portrait, motion blur", caption: "Motion." },
  { src: "/hero/intro/img_3374.webp", alt: "Tahasin Islam candid portrait", caption: "Detail." },
  { src: "/hero/intro/7.webp", alt: "Tahasin Islam portrait, sunset", caption: "Experience." },
];
