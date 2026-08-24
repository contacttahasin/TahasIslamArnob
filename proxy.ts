import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * The only gate in front of /admin. This is an owner-only CMS — there is no
 * signup, no roles, just one allowed email (OWNER_EMAIL). Every /admin
 * route except /admin/login and /admin/reset-password requires a session
 * whose email matches OWNER_EMAIL exactly; anyone else (including a
 * logged-in-but-different Supabase user, which shouldn't exist but is
 * checked anyway) is bounced to /admin/login.
 *
 * This is the first line of defense, not the only one — every Server
 * Action under app/admin re-checks the same thing server-side (see
 * app/admin/lib/auth.ts's requireOwner()), since proxy alone can be
 * misconfigured or skipped for a given path and must never be the sole
 * thing standing between a request and a mutation.
 */
const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/reset-password", "/admin/setup-required"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Supabase env vars are empty placeholders until ADMIN_SETUP.md's steps
  // are done — createServerClient() throws on an empty URL/key, which would
  // otherwise 500 every /admin request instead of explaining what's missing.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (pathname === "/admin/setup-required") return NextResponse.next();
    return NextResponse.redirect(new URL("/admin/setup-required", request.url));
  }

  const { response, user } = await updateSession(request);
  const isOwner = !!user && user.email === process.env.OWNER_EMAIL;
  const isPublicAdminPath = PUBLIC_ADMIN_PATHS.some((path) => pathname.startsWith(path));

  if (!isOwner && !isPublicAdminPath) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Already logged in as the owner and trying to view the login page —
  // send them straight to the dashboard instead.
  if (isOwner && pathname === "/admin/login") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
