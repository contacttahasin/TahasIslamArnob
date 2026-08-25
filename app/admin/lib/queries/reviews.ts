import "server-only";
import { requireOwner } from "@/app/admin/lib/auth";
import type { Review } from "@/lib/supabase/types";

/**
 * Every review regardless of status — the admin table is where pending
 * submissions are triaged, so it must see what the public site cannot.
 * Newest first, since the thing the owner usually wants is whatever just
 * came in.
 */
export async function listReviews(): Promise<Review[]> {
  const { supabase } = await requireOwner();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data;
}
