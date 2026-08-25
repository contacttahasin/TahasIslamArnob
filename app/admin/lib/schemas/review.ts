import { z } from "zod";

/**
 * What the owner may write from the admin panel — every field, including
 * the avatar and the source link.
 */
export const reviewSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  title: z.string().trim().max(120),
  company: z.string().trim().max(120),
  text: z.string().trim().min(10, "Review text is too short").max(1000),
  /** Uploaded media URL or a pasted external link; empty means "no avatar". */
  picture: z.string().trim().max(600),
  /** Source of the review; empty renders the card without a link. */
  link: z.string().trim().max(600),
  rating: z.number().int().min(1).max(5).nullable(),
  status: z.enum(["pending", "approved", "rejected"]),
  featured: z.boolean(),
});
export type ReviewInput = z.infer<typeof reviewSchema>;

/**
 * What a visitor may submit: their rating and their words, nothing else.
 *
 * Name and profile picture are read server-side from the signed-in Google
 * account (app/(site)/lib/review-actions.ts) rather than accepted from the
 * form, so a review cannot be posted under someone else's name. Avatar URL,
 * source link, status and the featured flag stay owner-only — the image
 * optimizer accepts any https host, so a URL a stranger typed must never
 * reach it, and nothing submitted here should be able to publish itself.
 */
export const publicReviewSchema = z.object({
  text: z
    .string()
    .trim()
    .min(20, "Please write at least a sentence or two")
    .max(1000, "Please keep it under 1000 characters"),
  rating: z.number().int().min(1).max(5).nullable(),
});
export type PublicReviewInput = z.infer<typeof publicReviewSchema>;
