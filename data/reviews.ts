/**
 * Content for the homepage testimonials marquee (rendered by
 * app/components/review/review.jsx). No review copy should be hardcoded
 * in the component itself.
 *
 * PLACEHOLDER entries below — company names are intentionally fictional
 * (not real brands) since these are stand-in reviews, not verified
 * endorsements. Swap in real name/title/company/text/picture/link per
 * review as they become available.
 */

export type Review = {
  name: string;
  title: string;
  company: string;
  text: string;
  /** Avatar image path, e.g. "/hero/2.png" — null falls back to initials. */
  picture: string | null;
  /** Link to the review's source (LinkedIn recommendation, company site,
   * etc.) — null renders the card without a link. */
  link: string | null;
};

export const reviews: Review[] = [
  {
    name: "Elena Rostova",
    title: "Principal UI/UX Designer",
    company: "Nova Interface",
    text: "Rarely do you find a developer who translates a design file token-for-token with such typographic respect and cohesive micro-interactions.",
    picture: null,
    link: null,
  },
  {
    name: "Michael K. Vance",
    title: "VP of Engineering",
    company: "Fluxbase Systems",
    text: "Uncompromising code quality and a deep command over modern frameworks. Integrated complex dashboard architecture seamlessly and reliably.",
    picture: null,
    link: null,
  },
  {
    name: "Sarah Jenkins",
    title: "Lead Product Engineer",
    company: "Verdant Studio",
    text: "An exceptionally skilled engineer who doesn't just build UI, but crafts complete terminal-grade experiences. The attention to performance is amazing.",
    picture: null,
    link: null,
  },
  {
    name: "Amina Al-Mansoor",
    title: "Senior Frontend Architect",
    company: "Orbital Frontend Co.",
    text: "Utterly obsessed with layout hierarchy and custom shader/canvas performance. Refined our telemetry pipelines into a gorgeous dashboard.",
    picture: null,
    link: null,
  },
  {
    name: "Marcus Aurelius",
    title: "Developer Relations",
    company: "Hublink Technologies",
    text: "The custom interactions and sandbox mockups are gorgeous. Writes clean, predictable, and robust TypeScript that requires zero revisions.",
    picture: null,
    link: null,
  },
  {
    name: "Sophia Moretti",
    title: "Founder & Creative Director",
    company: "Atelier Noir",
    text: "Brought a level of design polish that is extremely rare in software engineering. The site feels organic, premium, and stunningly responsive.",
    picture: null,
    link: null,
  },
  {
    name: "Daniel Osei",
    title: "Engineering Manager",
    company: "Northlight Labs",
    text: "Consistently ships ahead of schedule without cutting corners. The GSAP-driven interactions never dropped a frame, even on mid-range devices.",
    picture: null,
    link: null,
  },
  {
    name: "Priya Nair",
    title: "Product Design Lead",
    company: "Circuitry Studio",
    text: "A rare mix of engineering discipline and visual taste. Every handoff came back more refined than the original design spec.",
    picture: null,
    link: null,
  },
];
