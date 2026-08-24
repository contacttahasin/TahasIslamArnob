"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

const ONE_DAY = 60 * 60 * 24;
const THIRTY_DAYS = ONE_DAY * 30;

/**
 * Browser-side Supabase client — cookie-backed session (via @supabase/ssr),
 * shared across every Client Component that needs it. Call this again
 * wherever it's needed rather than caching the instance at module scope;
 * createBrowserClient() is cheap and this avoids any cross-request state
 * leaking between users in dev's Fast Refresh.
 *
 * `remember: false` (the login form's unchecked "Remember me") shortens the
 * session cookie's maxAge to one day instead of the default 30 — the
 * @supabase/ssr cookie adapter always sets an explicit Max-Age, so there's
 * no reliable "expires when the browser closes" option to fall back to;
 * a short-lived cookie is the closest honest equivalent.
 */
export function createClient(options?: { remember?: boolean }) {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: { maxAge: options?.remember === false ? ONE_DAY : THIRTY_DAYS } }
  );
}
