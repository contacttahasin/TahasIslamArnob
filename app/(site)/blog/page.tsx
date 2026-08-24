import type { Metadata } from "next";
import LiveChat from "@/app/components/LiveChat/LiveChat";
import ScrollTop from "@/app/components/scrollTop/ScrollTop";
import { jakarta } from "@/app/components/shared/fonts";
import VlogHero from "@/app/components/vlog/VlogHero";
import VlogGrid from "@/app/components/vlog/VlogGrid";
import IllustratedSection from "@/app/components/shared/IllustratedSection";
import Footer from "@/app/components/homeComponents/footer/Footer";
import { about } from "@/data/about";

export const metadata: Metadata = {
  title: `Vlog — ${about.name}`,
  description: "Build logs, experiments and updates from " + about.name + ".",
};

export default function Page() {
  return (
    <div className={`${jakarta.variable} w-full bg-noir-bg text-noir-ink`}>
      <VlogHero />

      <section className="w-full px-6 pb-28 sm:px-10 lg:px-16">
        <VlogGrid />
      </section>

      <IllustratedSection
        side="left"
        eyebrow={["NOTES", "HOW THIS GETS WRITTEN"]}
        headlineLines={["Build logs, not", "press releases."]}
        intro="Most of what ends up here starts as a note while something is still broken — the wrong assumption, the fix that did not work, the one that did. Writing it down is how the lesson survives past the project it came from, so the notes stay closer to a work journal than to an article."
        image={{
          src: "/hero/process-desk.png",
          alt: "Sketched desk: open notebook, pinned notes, wireframes, a code window, keyboard and coffee",
          width: 1536,
          height: 1024,
        }}
      />

      <LiveChat />
      <ScrollTop />
      <Footer />
    </div>
  );
}
