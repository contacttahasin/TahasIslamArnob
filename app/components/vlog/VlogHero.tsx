import Moon from "./Moon";
import { T } from "../shared/T";
import { about } from "@/data/about";
import AnimatedText from "../shared/AnimatedText";
import Reveal from "../shared/Reveal";

export default function VlogHero() {
  return (
    <section className="relative w-full overflow-hidden px-6 pb-16 pt-32 sm:px-10 sm:pt-40 lg:px-16">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-noir-gold/10 blur-[160px]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div className="text-center lg:text-left">
          <Reveal as="span" y={-12} duration={0.6} className="mb-4 inline-flex items-center gap-3 text-xs font-medium uppercase tracking-[0.4em] text-noir-gold">
            <span className="h-1 w-1 rounded-full bg-noir-gold" />
            <T ns="vlog" k="eyebrow" />
            <span className="h-1 w-1 rounded-full bg-noir-gold" />
          </Reveal>

          <AnimatedText
            as="h1"
            className="font-jakarta-sans text-4xl font-bold uppercase tracking-tight text-noir-ink sm:text-6xl lg:text-7xl"
          >
            Notes From{" "}
            <span className="bg-linear-to-r from-noir-gold to-noir-gold-bright bg-clip-text italic text-transparent">
              Orbit
            </span>
          </AnimatedText>

          <Reveal
            as="p"
            delay={0.15}
            className="mx-auto mt-6 max-w-md text-sm text-noir-ink-soft sm:text-base lg:mx-0"
          >
            Build logs, half-finished experiments and the odd life update from{" "}
            {about.name} — drag the moon, it spins on its own too.
          </Reveal>
        </div>

        <Moon />
      </div>
    </section>
  );
}
