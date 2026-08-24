import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Service-role Supabase client — bypasses RLS entirely and can call the
 * `auth.admin.*` API (list/update users, sessions). SUPABASE_SERVICE_ROLE_KEY
 * must never reach the browser; this file has no "use client" and every
 * caller must be a Server Action or Route Handler, never imported from a
 * Client Component.
 *
 * Used only for the handful of things the regular authenticated client
 * can't do: changing the owner's login email (auth.admin.updateUserById)
 * and revoking sessions (auth.admin.signOut with scope). Everything else
 * (projects, technologies, settings, storage) goes through the normal
 * RLS-protected client in server.ts.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
