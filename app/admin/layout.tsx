import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — Admin" },
  description: "Owner-only portfolio CMS",
  robots: { index: false, follow: false },
};

/**
 * Root shell for the entire /admin tree — deliberately does not import
 * LocaleProvider/ThemeProvider/UiSoundProvider/TransitionProvider or any of
 * the public nav/menu chrome from app/(site)/layout.tsx; this is a separate,
 * English-only, always-dark admin UI. The `dark` class here (not on <html>,
 * so the public site is unaffected) activates shadcn's dark-mode CSS
 * variables for everything inside /admin — see globals.css.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark min-h-screen bg-background font-sans text-foreground">
      {children}
      <Toaster richColors position="top-right" theme="dark" />
    </div>
  );
}
