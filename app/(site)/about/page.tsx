import type { Metadata } from "next";
import LiveChat from "@/app/components/LiveChat/LiveChat";
import ScrollTop from "@/app/components/scrollTop/ScrollTop";
import { jakarta } from "@/app/components/shared/fonts";
import Hero from "@/app/components/about/Hero";
import Availability from "@/app/components/about/Availability";
import Stats from "@/app/components/about/Stats";
import Timeline from "@/app/components/about/Timeline";
import Education from "@/app/components/about/Education";
import Experience from "@/app/components/about/Experience";
import Skills from "@/app/components/about/Skills";
import CommitActivity from "@/app/components/shared/CommitActivity";
import TechShowcase from "@/app/components/about/TechShowcase";
import Philosophy from "@/app/components/about/Philosophy";


import CTA from "@/app/components/about/CTA";
import { about } from "@/data/about";
import Footer from "@/app/components/homeComponents/footer/Footer";
import IllustratedSection from "@/app/components/shared/IllustratedSection";


export const metadata: Metadata = {
  title: `About — ${about.name}`,
  description: about.bio,
};

export default function Page() {
  return (
    <div className={`${jakarta.variable} w-full bg-noir-bg text-noir-ink`}>
      <Hero />
      <Availability />
      <Stats />
      <Timeline />
      <Education />
      <Experience />
      <Skills />
      <CommitActivity />
      <TechShowcase />
      <Philosophy />

      <IllustratedSection
        eyebrow={["OFF THE CLOCK"]}
        headlineLines={["There's a life", "behind the", "commits."]}
        intro="The work above is only half of it. The rest is a camera, a notebook that is mostly lists, too much coffee, and a running list of places I still want to see. Those hours are not separate from the craft — noticing how things are put together outside a screen is what keeps the taste sharp on it."
        image={{
          src: "/hero/beyond-work.png",
          alt: "Sketched travel desk: camera, passport, map, compass, globe, coffee and an open adventure list",
          width: 1536,
          height: 1024,
        }}
      />

      <CTA />

      <LiveChat />
      <ScrollTop />
      <Footer />
    </div>
  );
}
