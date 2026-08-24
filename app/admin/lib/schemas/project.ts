import { z } from "zod";

const urlOrEmpty = z
  .string()
  .trim()
  .refine((v) => v === "" || /^https?:\/\/.+/i.test(v), "Enter a valid URL (https://...)");

export const projectSchema = z.object({
  type: z.enum(["latest", "portfolio"]),
  title: z.string().trim().min(2, "Title is required"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers, and hyphens only"),
  description: z.string().trim().min(1, "Short description is required").max(240, "Keep it under 240 characters"),
  fullDescription: z.string().trim(),
  technologyIds: z.array(z.string().uuid()),
  liveUrl: urlOrEmpty,
  githubUrl: urlOrEmpty,
  coverImage: z.string().trim(),
  galleryImages: z.array(z.string()),
  featured: z.boolean(),
  status: z.enum(["published", "draft"]),
  displayOrder: z.number().int(),
});
export type ProjectInput = z.infer<typeof projectSchema>;
