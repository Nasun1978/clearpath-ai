import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase";
import type { UserSubscription } from "@/types";

// GET /api/user/subscription
// Returns the authenticated user's user_subscriptions row.
// If no row exists yet (new user), returns a default trial object.
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase } = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[user/subscription] Supabase error:", error.message);
      return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
    }

    if (!data) {
      // New user who hasn't gone through checkout yet — default trial state
      const defaultSubscription: Partial<UserSubscription> = {
        plan_tier:           "trial",
        subscription_status: "trialing",
        trial_ends_at:       null,
        trial_used:          false,
      };
      return NextResponse.json(defaultSubscription);
    }

    return NextResponse.json(data as UserSubscription);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[user/subscription] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
