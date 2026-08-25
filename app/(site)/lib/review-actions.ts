"use server";

import { createClient } from "@/lib/supabase/server";
import { publicReviewSchema, type PublicReviewInput } from "@/app/admin/lib/schemas/review";

export type SubmitReviewResult = { ok: true } | { ok: false; error: string };

/**
 * Reads the display name and picture off the signed-in Google account.
 * Supabase copies Google's profile claims into user_metadata; which key
 * holds what varies a little by provider, hence the fallbacks.
 */
function identityOf(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): { name: string; avatar: string | null } {
  const meta = user.user_metadata ?? {};
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = meta[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return null;
  };

  return {
    // Last resort is the part of the address before the @, so a review can
    // never end up attributed to nobody.
    name: pick("full_name", "name", "user_name") ?? user.email?.split("@")[0] ?? "Anonymous",
    avatar: pick("avatar_url", "picture"),
  };
}

/**
 * Visitor-facing review submission.
 *
 * The visitor only ever sends a rating and their text. Who they are — name
 * and profile picture — is read here from their signed-in Google account,
 * never from the request body: a browser that could name itself could post
 * a review as anyone. The database policy enforces the same thing
 * independently (`author_id = auth.uid()`), so this is convenience, not the
 * security boundary.
 *
 * Nothing submitted here is visible on the site until the owner approves it.
 */
export async function submitReview(input: PublicReviewInput): Promise<SubmitReviewResult> {
  const parsed = publicReviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Please sign in with Google first." };

  const { name, avatar } = identityOf(user);

  const { error } = await supabase.from("reviews").insert({
    name,
    title: "",
    company: "",
    text: parsed.data.text,
    rating: parsed.data.rating,
    author_id: user.id,
    author_avatar: avatar,
    status: "pending",
  });

  if (error) {
    // Worth the server-side log: everything below is a setup or policy
    // problem, and a visitor-facing string alone made the cause invisible.
    console.error("[submitReview]", error.code, error.message);

    // PGRST205 / 42P01: the reviews table does not exist yet, i.e.
    // supabase/schema.sql has not been run against this project.
    if (error.code === "PGRST205" || error.code === "42P01") {
      return { ok: false, error: "Reviews are not set up on this site yet." };
    }
    // 42501: the row was refused by the RLS policy.
    if (error.code === "42501") {
      return { ok: false, error: "That review was rejected — please sign in again and retry." };
    }
    return { ok: false, error: "Could not submit right now — please try again." };
  }

  return { ok: true };
}
