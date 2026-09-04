/**
 * Content for the Contact page. Reuses `about.contactEmail` and
 * `about.socials` as the single source of truth for email/social links —
 * edit those in data/about.ts and this page stays in sync automatically.
 */

import { about, type SocialLink } from "./about";

export type ContactMethod = {
  label: string;
  value: string;
  href: string;
  icon: "email" | "whatsapp";
};

export type ContactData = {
  subheading: string;
  heading: string;
  intro: string;
  methods: ContactMethod[];
  socials: SocialLink[];
};

const WHATSAPP_NUMBER = "+880 1568-842688";
const WHATSAPP_LINK = "https://wa.me/8801568842688";

export const contact: ContactData = {
  subheading: "Contact",
  heading: "Let's Get In Touch",
  intro:
    "Have a project in mind, or just want to say hello? I'm always open to discussing new ideas, collaborations, or freelance opportunities.",
  methods: [
    { label: "Email", value: about.contactEmail, href: `mailto:${about.contactEmail}`, icon: "email" },
    { label: "WhatsApp", value: WHATSAPP_NUMBER, href: WHATSAPP_LINK, icon: "whatsapp" },
  ],
  // Only the socials that actually have a link configured in about.ts.
  socials: about.socials.filter((social) => social.href),
};
