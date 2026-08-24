import { z } from "zod";

// Plain (non-optional) string fields — every field here is a controlled RHF
// input that always holds a string ("" when empty), so the schema's input
// type must be `string` too, not `string | undefined`, or zodResolver's
// generics stop lining up with useForm<SettingsInput>.
const opt = z.string().trim();

export const settingsSchema = z.object({
  // Personal Information
  name: opt,
  jobTitle: opt,
  about: opt,
  location: opt,
  availability: opt,
  // Contact
  email: z.string().trim().email("Enter a valid email").or(z.literal("")),
  phone: opt,
  whatsapp: opt,
  // Social Links
  github: opt,
  linkedin: opt,
  facebook: opt,
  instagram: opt,
  twitter: opt,
  // Resume
  resumeUrl: opt,
  // SEO
  metaTitle: opt,
  metaDescription: opt,
  ogImage: opt,
  // Theme
  logo: opt,
  favicon: opt,
  accentColor: opt,
  loader: opt,
});
export type SettingsInput = z.infer<typeof settingsSchema>;
