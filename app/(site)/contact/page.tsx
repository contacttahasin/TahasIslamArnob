import type { Metadata } from "next";
import LiveChat from "@/app/components/LiveChat/LiveChat";
import ScrollTop from "@/app/components/scrollTop/ScrollTop";
import { jakarta } from "@/app/components/shared/fonts";
import ContactHero from "@/app/components/contact/ContactHero";
import BookingSection from "@/app/components/booking/BookingSection";
import ContactFormNoir from "@/app/components/contact/ContactFormNoir";
import CodeSnippet from "@/app/components/code/CodeSnippet";
import Footer from "@/app/components/homeComponents/footer/Footer";
import { about } from "@/data/about";
import { contact } from "@/data/contact";

export const metadata: Metadata = {
  title: `Contact — ${about.name}`,
  description: contact.intro,
};

export default function Page() {
  return (
    <div className={`${jakarta.variable} w-full bg-noir-bg text-noir-ink`}>
      <ContactHero />

      {/* The same details the hero lists, in the form the reader most
          likely works in. Values come from data/contact.ts and
          data/about.ts, so there is one source of truth for them. */}
      <section className="w-full px-6 pb-4 sm:px-10 lg:px-16">
        <CodeSnippet
          filename="contact.ts"
          lines={[
            [
              { text: "export const ", tone: "keyword" },
              { text: "contact" },
              { text: " = {", tone: "punct" },
            ],
            [
              { text: "  email", tone: "prop" },
              { text: ": ", tone: "punct" },
              { text: `"${about.contactEmail}"`, tone: "string" },
              { text: ",", tone: "punct" },
            ],
            [
              { text: "  location", tone: "prop" },
              { text: ": ", tone: "punct" },
              { text: `"${about.location}"`, tone: "string" },
              { text: ",", tone: "punct" },
            ],
            [
              { text: "  replies", tone: "prop" },
              { text: ": ", tone: "punct" },
              { text: `"${about.availability.responseTime}"`, tone: "string" },
              { text: ",", tone: "punct" },
            ],
            [{ text: "};", tone: "punct" }],
            [{ text: "" }],
            [{ text: "// or just use the form below", tone: "comment" }],
          ]}
        />
      </section>

      <BookingSection>
        <ContactFormNoir />
      </BookingSection>

      <LiveChat />
      <ScrollTop />
      <Footer />
    </div>
  );
}
