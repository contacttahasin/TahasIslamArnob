import type { Metadata } from "next";
import LiveChat from "@/app/components/LiveChat/LiveChat";
import ScrollTop from "@/app/components/scrollTop/ScrollTop";
import { jakarta } from "@/app/components/shared/fonts";
import ContactHero from "@/app/components/contact/ContactHero";
import ContactFormNoir from "@/app/components/contact/ContactFormNoir";
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
      <ContactFormNoir />

      <LiveChat />
      <ScrollTop />
      <Footer />
    </div>
  );
}
