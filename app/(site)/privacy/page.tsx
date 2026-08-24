import type { Metadata } from "next";
import LiveChat from "@/app/components/LiveChat/LiveChat";
import ScrollTop from "@/app/components/scrollTop/ScrollTop";
import { jakarta } from "@/app/components/shared/fonts";
import SectionHeading from "@/app/components/shared/SectionHeading";
import { T } from "@/app/components/shared/T";
import Footer from "@/app/components/homeComponents/footer/Footer";
import { about } from "@/data/about";

export const metadata: Metadata = {
  title: `Privacy Policy — ${about.name}`,
  description: `How ${about.name} collects, uses and protects your information on this site.`,
};

export default function Page() {
  return (
    <div className={`${jakarta.variable} w-full bg-noir-bg text-noir-ink`}>
      <section className="relative w-full overflow-hidden px-6 pb-16 pt-32 sm:px-10 sm:pt-40 lg:px-16">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-noir-gold/10 blur-[160px]" />

        <SectionHeading
          as="h1"
          eyebrow={<T ns="common" k="legal" />}
          title={
            <>
              Privacy{" "}
              <span className="bg-linear-to-r from-noir-gold to-noir-gold-bright bg-clip-text italic text-transparent">
                Policy
              </span>
            </>
          }
          className="relative"
        />

        <p className="relative mx-auto -mt-8 max-w-xl text-center text-sm text-noir-ink-soft sm:text-base">
          Last updated: July 10, 2026
        </p>
      </section>

      <section className="w-full px-6 pb-28 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl space-y-10 text-noir-ink-soft">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-noir-ink">1. Overview</h2>
            <p>
              This Privacy Policy explains what information is collected when you
              visit this portfolio site, how it is used, and the choices you have
              regarding it. This site is operated by {about.name}.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-noir-ink">2. Information Collected</h2>
            <p>
              When you use the contact form or newsletter signup, the name, email
              address and message content you submit are collected so a response
              can be provided. Basic usage data (such as pages visited, device and
              browser type) may also be collected automatically to help understand
              how the site is used.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-noir-ink">3. How Information Is Used</h2>
            <p>
              Information you provide is used solely to respond to inquiries, send
              updates you&apos;ve opted into, and improve the site. Your information
              is never sold to third parties.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-noir-ink">4. Third-Party Services</h2>
            <p>
              This site may use third-party services (such as analytics or hosting
              providers) that process limited technical data in order to operate
              and improve the site. These providers are bound by their own
              privacy practices.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-noir-ink">5. Your Rights</h2>
            <p>
              You may request access to, correction of, or deletion of your
              personal information at any time by reaching out using the contact
              details below.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-noir-ink">6. Contact</h2>
            <p>
              Questions about this policy can be sent to{" "}
              <a
                href={`mailto:${about.contactEmail}`}
                className="text-noir-gold hover:underline"
              >
                {about.contactEmail}
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <LiveChat />
      <ScrollTop />
      <Footer />
    </div>
  );
}
