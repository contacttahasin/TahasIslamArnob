import { about } from "@/data/about";
import {
  ScrollVelocityContainer,
  ScrollVelocityRow,
} from "../homeComponents/ScrollVelocityContainer";

/**
 * Auto-scrolling technology marquee. Reuses the site's existing
 * ScrollVelocityRow (already proven on the home page banner) rather than
 * reimplementing infinite-loop scroll math.
 */
export default function TechShowcase() {
  return (
    <section className="w-full overflow-hidden border-y border-noir-border bg-noir-surface/40 py-8">
      <ScrollVelocityContainer className="text-2xl font-bold uppercase tracking-tight text-noir-ink/60 sm:text-4xl">
        <ScrollVelocityRow baseVelocity={12} direction={1}>
          {about.techStack.map((tech) => (
            <span key={tech} className="mx-6 inline-flex items-center gap-6">
              {tech}
              <span className="text-noir-gold">/</span>
            </span>
          ))}
        </ScrollVelocityRow>
      </ScrollVelocityContainer>
    </section>
  );
}
