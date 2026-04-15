import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getUserFromRequest } from "@/lib/supabase";

// POST /api/stripe/checkout
// Creates a Stripe Checkout Session for subscriptions or one-time payments.
// Body: { priceId: string, mode: 'subscription' | 'payment', isTrial?: boolean }
// Returns: { url } — the Stripe-hosted checkout redirect URL.
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      priceId?: string;
      mode?: "subscription" | "payment";
      isTrial?: boolean;
    };

    if (!body.priceId) {
      return NextResponse.json({ error: "priceId is required" }, { status: 400 });
    }

    const mode = body.mode ?? "subscription";

    // Derive absolute base URL so this works on localhost, preview deploys, and production
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ??
      `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    // Attempt to get the authenticated user so we can pre-fill their email.
    // If they're not logged in we still allow checkout (they'll be asked to sign up after).
    const { user } = await getUserFromRequest(req);

    const baseParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      mode,
      line_items: [{ price: body.priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/pricing?checkout=cancelled`,
      // Surface billing address for tax purposes
      billing_address_collection: "auto",
    };

    // Pre-fill customer email when the user is authenticated
    if (user?.email) {
      baseParams.customer_email = user.email;
    }

    if (mode === "subscription") {
      baseParams.allow_promotion_codes = true;

      if (body.isTrial) {
        // 14-day free trial — no credit card required at signup.
        // payment_method_collection: 'if_required' means Stripe won't mandate
        // card entry for $0 trial sessions, improving conversion.
        baseParams.subscription_data = { trial_period_days: 14 };
        baseParams.payment_method_collection = "if_required";
      }
    }

    const session = await stripe.checkout.sessions.create(baseParams);

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe/checkout] Error creating session:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
