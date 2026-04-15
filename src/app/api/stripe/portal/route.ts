import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getUserFromRequest } from "@/lib/supabase";

// POST /api/stripe/portal
// Creates a Stripe Customer Portal session for the authenticated user.
// Returns: { url } — redirect to Stripe's hosted billing portal.
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { user } = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Look up the user's stripe_customer_id from their subscription row.
    // We use the user-scoped client here — RLS ensures they can only see their own row.
    const { supabase } = await getUserFromRequest(req);
    const { data: subscription, error } = await supabase
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[stripe/portal] Supabase error:", error.message);
      return NextResponse.json({ error: "Failed to look up subscription" }, { status: 500 });
    }

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No Stripe customer found for this account" },
        { status: 404 }
      );
    }

    const origin =
      process.env.NEXT_PUBLIC_APP_URL ??
      `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer:   subscription.stripe_customer_id,
      return_url: `${origin}/dashboard/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe/portal] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
