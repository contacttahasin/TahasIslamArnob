import type { Metadata } from "next";
import LiveChat from "@/app/components/LiveChat/LiveChat";
import ScrollTop from "@/app/components/scrollTop/ScrollTop";
import { jakarta } from "@/app/components/shared/fonts";
import SectionHeading from "@/app/components/shared/SectionHeading";
import { T } from "@/app/components/shared/T";
import Footer from "@/app/components/homeComponents/footer/Footer";
import { about } from "@/data/about";

export const metadata: Metadata = {
  title: `Terms of Service — ${about.name}`,
  description: `The terms and conditions for using ${about.name}'s portfolio site.`,
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
              Terms of{" "}
              <span className="bg-linear-to-r from-noir-gold to-noir-gold-bright bg-clip-text italic text-transparent">
                Service
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
            <h2 className="text-xl font-semibold text-noir-ink">1. Acceptance of Terms</h2>
            <p>
              By accessing this site, you agree to these Terms of Service. If you
              do not agree, please discontinue use of the site.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-noir-ink">2. Use of Content</h2>
            <p>
              All content on this site — including design, code samples, project
              case studies and written material — belongs to {about.name} unless
              otherwise credited. You may reference or share links to this site,
              but reproducing substantial portions without permission is not
              allowed.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-noir-ink">3. No Warranty</h2>
            <p>
              This site and its content are provided &quot;as is&quot; without
              warranties of any kind. While every effort is made to keep
              information accurate and up to date, no guarantee is made as to
              completeness or reliability.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-noir-ink">4. Limitation of Liability</h2>
            <p>
              {about.name} is not liable for any damages arising from the use of,
              or inability to use, this site or its content.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-noir-ink">5. External Links</h2>
            <p>
              This site may link to third-party websites (such as project demos or
              social profiles). These are provided for convenience and are not
              endorsed or controlled by {about.name}.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-noir-ink">6. Changes to These Terms</h2>
            <p>
              These terms may be updated periodically. Continued use of the site
              after changes are posted constitutes acceptance of the revised
              terms.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-noir-ink">7. Contact</h2>
            <p>
              Questions about these terms can be sent to{" "}
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
