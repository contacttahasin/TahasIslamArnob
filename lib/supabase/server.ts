import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

/**
 * Server-side Supabase client for Server Components, Server Actions, and
 * Route Handlers — reads the session from the incoming request's cookies
 * and (where the caller can set cookies, i.e. Server Actions/Route
 * Handlers, not plain Server Components rendering a page) writes refreshed
 * tokens back. Must be created fresh per request, never module-cached —
 * it's bound to this request's specific cookie jar.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a plain Server Component render (e.g. a page.tsx
            // reading data, not a Server Action) — cookies() is read-only
            // there. Harmless: middleware already refreshes the session on
            // every request, so this write is a redundant optimization,
            // not a requirement for correctness.
          }
        },
      },
    }
  );
}
