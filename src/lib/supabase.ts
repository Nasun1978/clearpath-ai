// @ts-nocheck
// ============================================================================
// Supabase Client Configuration
// ============================================================================
// Three clients:
//   createBrowserClient()  — browser, anon key, respects RLS
//   createServerClient()   — server, service role key, BYPASSES RLS
//                            Use ONLY for internal admin ops (e.g. storage uploads)
//   createUserClient(req)  — server, anon key + user JWT from cookies
//                            Enforces RLS as the authenticated user.
//                            Use this in all user-facing API routes.
// ============================================================================

import { createClient } from "@supabase/supabase-js";
import { createServerClient as createSSRClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";

// Browser client — respects RLS policies, safe for client components
export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Server client — bypasses RLS, for API routes and server actions ONLY
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Singleton for server-side usage
let serverClient: ReturnType<typeof createClient> | null = null;

export function getServerClient() {
  if (!serverClient) {
    serverClient = createServerClient();
  }
  return serverClient;
}

// User-session client — uses the caller's JWT from request cookies.
// RLS is enforced: the client can only see/modify rows belonging to the user.
// Use this in all user-facing API Route Handlers.
export function createUserClient(request: NextRequest) {
  return createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        // Route handlers can't mutate the incoming request cookies;
        // session refresh is handled by middleware on every request.
        setAll() {},
      },
    }
  );
}

// Helper: get the authenticated user from a request, or return null.
// Returns { user, supabase } on success; { user: null, supabase } when unauthenticated.
export async function getUserFromRequest(request: NextRequest) {
  const supabase = createUserClient(request);
  const { data: { user } } = await supabase.auth.getUser();
  return { user, supabase };
}
