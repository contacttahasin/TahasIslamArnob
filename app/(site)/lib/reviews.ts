import "server-only";
import { createClient } from "@/lib/supabase/server";
import { reviews as fallbackReviews, type Review as StaticReview } from "@/data/reviews";

export type PublicReview = StaticReview & {
  id: string | null;
  rating: number | null;
};

/**
 * Approved reviews for the home page's testimonial marquee.
 *
 * Avatars resolve here rather than in the component, so the marquee stays a
 * plain renderer of whatever `picture` it is handed: an image the owner set
 * wins, then the submitter's own Google profile picture, then nothing —
 * which the card draws as their initials.
 *
 * Falls back to the placeholder set in data/reviews.ts when the table is
 * empty or unreachable — that keeps the section looking finished before
 * the schema migration has been run or before the first review is
 * approved, instead of rendering an empty marquee.
 *
 * No auth: the RLS policy in supabase/schema.sql already limits anonymous
 * reads to `status = 'approved'`, so a pending submission cannot leak out
 * through this path even if the filter below were removed.
 */
export async function getApprovedReviews(): Promise<PublicReview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("status", "approved")
    .order("featured", { ascending: false })
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  // PGRST205 = the reviews table does not exist yet, i.e. the migration in
  // supabase/reviews-migration.sql has not been run. That is a setup state,
  // not a crash — the fallback below covers it — so it must not go to
  // console.error, which Next's dev overlay throws in front of the page.
  if (error && error.code === "PGRST205") {
    console.warn(
      "[reviews] table missing — run supabase/reviews-migration.sql. Showing placeholder reviews."
    );
  } else if (error && error.code !== "PGRST116") {
    console.error("[getApprovedReviews]", error.code, error.message);
  }

  if (error || !data || data.length === 0) {
    return fallbackReviews.map((r) => ({ ...r, id: null, rating: null }));
  }

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    title: row.title,
    company: row.company,
    text: row.text,
    picture: row.picture ?? row.author_avatar,
    link: row.link,
    rating: row.rating,
  }));
}
