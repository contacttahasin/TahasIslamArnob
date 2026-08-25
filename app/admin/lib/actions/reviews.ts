"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/app/admin/lib/auth";
import { reviewSchema, type ReviewInput } from "@/app/admin/lib/schemas/review";
import type { ActionResult } from "@/app/admin/lib/actions/projects";
import type { ReviewStatus } from "@/lib/supabase/types";

/** The public site caches these pages, so an approval has to invalidate
 *  them or the new card only appears on the next deploy. */
function revalidateReviewSurfaces() {
  revalidatePath("/admin/reviews");
  revalidatePath("/");
}

function toRow(input: ReviewInput) {
  return {
    name: input.name,
    title: input.title,
    company: input.company,
    text: input.text,
    // Empty strings from the form become NULL, so "no avatar" is one value
    // in the database rather than two the reader has to handle.
    picture: input.picture || null,
    link: input.link || null,
    rating: input.rating,
    status: input.status,
    featured: input.featured,
  };
}

export async function createReview(input: ReviewInput): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { error } = await supabase.from("reviews").insert(toRow(parsed.data));
  if (error) return { ok: false, error: error.message };

  revalidateReviewSurfaces();
  return { ok: true };
}

export async function updateReview(id: string, input: ReviewInput): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { error } = await supabase.from("reviews").update(toRow(parsed.data)).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateReviewSurfaces();
  return { ok: true };
}

/** Approve / reject / send back to pending from the table, without having
 *  to open the full edit dialog. */
export async function setReviewStatus(id: string, status: ReviewStatus): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateReviewSurfaces();
  return { ok: true };
}

export async function deleteReview(id: string): Promise<ActionResult> {
  const { supabase } = await requireOwner();
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateReviewSurfaces();
  return { ok: true };
}
