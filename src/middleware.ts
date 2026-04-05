// @ts-nocheck
// ============================================================================
// RipeSpot — Route Protection Middleware
// ============================================================================
// Protects /dashboard and /submit routes.
// In demo mode: checks for a ripespot_demo cookie (set by the login page).
// In production: validates a Supabase session.
// ============================================================================

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const PROTECTED_PATHS = ["/dashboard", "/submit"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // ── Demo mode: accept any request with the demo session cookie ───────────
  if (DEMO_MODE) {
    const demoCookie = request.cookies.get("ripespot_demo");
    if (!demoCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ── Production: validate Supabase session ────────────────────────────────
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/submit/:path*"],
};
