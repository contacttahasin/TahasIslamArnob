import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./types";

/**
 * Refreshes the Supabase session cookie (if needed) and returns the
 * request's current user. Split out from middleware.ts because this part —
 * "keep the auth cookie fresh on every request" — is generic Supabase/SSR
 * plumbing, while middleware.ts owns the actual route-protection policy
 * (which paths require auth, where to redirect, the OWNER_EMAIL check).
 *
 * Uses getUser(), not getSession(): getSession() only decodes the local
 * cookie without verifying it against the auth server, so a forged or
 * stale cookie could pass. getUser() round-trips to Supabase Auth to
 * confirm the token is actually still valid — the right call for anything
 * gating access, per Supabase's own guidance.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
