import "server-only";
import { requireOwner } from "@/app/admin/lib/auth";
import type { PortfolioSettings } from "@/lib/supabase/types";

export async function getSettings(): Promise<PortfolioSettings> {
  const { supabase } = await requireOwner();
  const { data } = await supabase.from("portfolio_settings").select("*").eq("id", true).single();
  // The schema seeds exactly one row (id=true) — this should always exist,
  // but a fresh/never-migrated project falls back to empty rather than
  // crashing the settings page.
  return (
    data ?? {
      id: true,
      name: null,
      job_title: null,
      about: null,
      location: null,
      availability: null,
      email: null,
      phone: null,
      whatsapp: null,
      github: null,
      linkedin: null,
      facebook: null,
      instagram: null,
      twitter: null,
      resume_url: null,
      meta_title: null,
      meta_description: null,
      og_image: null,
      logo: null,
      favicon: null,
      accent_color: null,
      loader: null,
      updated_at: new Date().toISOString(),
    }
  );
}
