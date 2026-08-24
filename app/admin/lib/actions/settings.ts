"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/app/admin/lib/auth";
import { settingsSchema, type SettingsInput } from "@/app/admin/lib/schemas/settings";
import type { ActionResult } from "@/app/admin/lib/actions/projects";

export async function updateSettings(input: SettingsInput): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const d = parsed.data;

  const { error } = await supabase
    .from("portfolio_settings")
    .update({
      name: d.name,
      job_title: d.jobTitle,
      about: d.about,
      location: d.location,
      availability: d.availability,
      email: d.email,
      phone: d.phone,
      whatsapp: d.whatsapp,
      github: d.github,
      linkedin: d.linkedin,
      facebook: d.facebook,
      instagram: d.instagram,
      twitter: d.twitter,
      resume_url: d.resumeUrl,
      meta_title: d.metaTitle,
      meta_description: d.metaDescription,
      og_image: d.ogImage,
      logo: d.logo,
      favicon: d.favicon,
      accent_color: d.accentColor,
      loader: d.loader,
    })
    .eq("id", true);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/settings");
  revalidatePath("/admin/dashboard");
  return { ok: true };
}
