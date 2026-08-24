import type { Metadata } from "next";
import LiveChat from "@/app/components/LiveChat/LiveChat";
import ScrollTop from "@/app/components/scrollTop/ScrollTop";
import { jakarta } from "@/app/components/shared/fonts";
import SectionHeading from "@/app/components/shared/SectionHeading";
import ThreeBackground from "@/app/components/projects/ThreeBackground";
import ProjectGrid from "@/app/components/projects/ProjectGrid";
import ProjectsRing from "@/app/components/projectsRing/ProjectsRing";
import IllustratedSection from "@/app/components/shared/IllustratedSection";
import Footer from "@/app/components/homeComponents/footer/Footer";
import { getPublishedProjects } from "@/app/(site)/lib/projects";

export const metadata: Metadata = {
  title: "Projects — Tahasin Islam",
  description:
    "Selected projects by Tahasin Islam — full-stack web apps, e-commerce platforms, design systems and developer tools.",
};

export default async function Page() {
  const [latestProjects, allProjects] = await Promise.all([
    getPublishedProjects("latest"),
    getPublishedProjects(),
  ]);

  return (
    <div className={`${jakarta.variable} w-full overflow-x-hidden bg-noir-bg text-noir-ink`}>
      <ProjectsRing projects={latestProjects} />

      <section className="relative w-full overflow-hidden px-6 pb-16 pt-40 sm:px-10 sm:pt-52 lg:px-16 lg:pt-64">
        <ThreeBackground />

        <div className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-noir-gold/10 blur-[160px]" />

        <SectionHeading
          as="h1"
          eyebrow="Selected Work"
          title={
            <>
              Things I&apos;ve{" "}
              <span className="bg-linear-to-r from-noir-gold to-noir-gold-bright bg-clip-text italic text-transparent">
                Built
              </span>
            </>
          }
          className="relative"
        />

        <p className="relative mx-auto -mt-8 max-w-xl text-center text-sm text-noir-ink-soft sm:text-base">
          A collection of products, tools and interfaces — filter by category
          to explore.
        </p>
      </section>

      <section className="w-full px-6 pb-28 sm:px-10 lg:px-16">
        <ProjectGrid projects={allProjects} />
      </section>

      <IllustratedSection
        eyebrow={["SYSTEMS", "UNDER THE HOOD"]}
        headlineLines={["The interface is", "the surface. The", "system is the work."]}
        intro="Every screen above sits on something: data models, state that has to stay honest, jobs that run when nobody is watching, and the quiet decisions about what happens when a request fails. That layer is where most of the time goes, and it is what decides whether the thing still works a year later."
        points={[
          "Typed end to end — the shape of the data is the same in the database, on the server and in the component.",
          "Auth and access checked at every gate, not only the first one.",
          "Motion and 3D built to degrade: reduced-motion, low-power devices and slow networks all get a version that works.",
          "Measured after launch, not just before it.",
        ]}
        image={{
          src: "/hero/ai-systems.png",
          alt: "Sketched system diagram: neural network, data pipeline, media browser, automation arm and flow steps",
          width: 1240,
          height: 1240,
        }}
      />

      <LiveChat />
      <ScrollTop />
      <Footer />
    </div>
  );
}
