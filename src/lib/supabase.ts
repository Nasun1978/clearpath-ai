// ============================================================================
// Supabase Client Configuration
// ============================================================================
// Two clients: one for browser (anon key), one for server (service role key)
// The service role key bypasses RLS — use ONLY in API routes, never in client code
// ============================================================================

import { createClient } from "@supabase/supabase-js";

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
