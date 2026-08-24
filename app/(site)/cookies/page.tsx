import type { Metadata } from "next";
import LiveChat from "@/app/components/LiveChat/LiveChat";
import ScrollTop from "@/app/components/scrollTop/ScrollTop";
import { jakarta } from "@/app/components/shared/fonts";
import SectionHeading from "@/app/components/shared/SectionHeading";
import { T } from "@/app/components/shared/T";
import Footer from "@/app/components/homeComponents/footer/Footer";
import { about } from "@/data/about";

export const metadata: Metadata = {
  title: `Cookie Policy — ${about.name}`,
  description: `How ${about.name}'s portfolio site uses cookies and similar technologies.`,
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
              Cookie{" "}
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
            <h2 className="text-xl font-semibold text-noir-ink">1. What Are Cookies</h2>
            <p>
              Cookies are small text files stored on your device by your browser.
              They help websites remember information about your visit, such as
              preferences and how you interact with the site.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-noir-ink">2. How This Site Uses Cookies</h2>
            <p>
              This site may use essential cookies to keep it functioning properly
              (such as remembering interface preferences) and analytics cookies to
              understand how visitors use the site so it can be improved. This
              site does not use cookies for third-party advertising.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-noir-ink">3. Managing Cookies</h2>
            <p>
              Most browsers let you control or delete cookies through their
              settings. Disabling cookies may affect some site functionality, but
              the site remains usable without them.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-noir-ink">4. Changes to This Policy</h2>
            <p>
              This Cookie Policy may be updated from time to time to reflect
              changes in how the site works. Any updates will be posted on this
              page.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-noir-ink">5. Contact</h2>
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
