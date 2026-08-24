import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Re-verifies the owner's identity server-side. Middleware already blocks
 * unauthenticated/non-owner requests to /admin, but that's one layer —
 * every Server Action here calls this too, so a mutation is never reachable
 * purely because middleware happened to be misconfigured or bypassed for
 * some path. Cheap (one already-cached getUser() call per request) and
 * non-negotiable for anything that writes data.
 */
export async function requireOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.OWNER_EMAIL) {
    redirect("/admin/login");
  }

  return { supabase, user };
}
