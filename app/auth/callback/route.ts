import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth landing point for the public "sign in with Google" used by the
 * review form. Supabase sends the browser back here with a one-time code;
 * exchanging it is what actually writes the session cookie.
 *
 * `next` decides where the visitor ends up afterwards, but only ever as a
 * path on this site — an absolute URL here would turn the callback into an
 * open redirect.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}${next}?auth_error=1`);
}
