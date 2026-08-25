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
import DependencyList from "@/app/components/code/DependencyList";
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

      {/* The versions this site actually runs on — checkable, unlike a
          wall of logos. Kept in step with package.json by hand. */}
      <section className="w-full px-6 pt-16 pb-24 sm:px-10 sm:pt-24 lg:px-16">
        <DependencyList
          dependencies={[
            { name: "next", version: "16.2.10" },
            { name: "react", version: "19.2.4" },
            { name: "typescript", version: "^5" },
            { name: "tailwindcss", version: "^4" },
            { name: "gsap", version: "^3.15.0" },
            { name: "three", version: "^0.185.1" },
            { name: "framer-motion", version: "^12.42.2" },
            { name: "@supabase/supabase-js", version: "^2.111.0" },
          ]}
        />
      </section>
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
