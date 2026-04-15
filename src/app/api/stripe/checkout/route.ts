import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

// POST /api/stripe/checkout
// Creates a Checkout Session for a one-time platform access payment.
// Returns { url } — the redirect URL for the Stripe-hosted checkout page.
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      priceId?: string;
    };

    // Derive absolute base URL from the request so this works on any environment
    // (localhost, preview deployments, production) without extra config.
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ??
      `${req.nextUrl.protocol}//${req.nextUrl.host}`;

    // If a specific priceId is passed (e.g. from a pricing table), use it.
    // Otherwise fall back to the default product defined at deploy time.
    const lineItems =
      body.priceId
        ? [{ price: body.priceId, quantity: 1 }]
        : [
            {
              price_data: {
                currency: "usd",
                // $20.00 one-time access fee — adjust in the Dashboard or via env
                unit_amount: parseInt(
                  process.env.STRIPE_PRODUCT_PRICE_CENTS ?? "2000",
                  10
                ),
                product_data: {
                  name:
                    process.env.STRIPE_PRODUCT_NAME ??
                    "ClearPath AI — Platform Access",
                  description:
                    "One-time access to ClearPath AI affordable housing compliance platform.",
                },
              },
              quantity: 1,
            },
          ];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      // Dynamic payment methods — Stripe automatically shows wallets, BNPL, etc.
      // based on the customer's location and preferences (no payment_method_types needed).
      success_url: `${origin}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard?checkout=cancelled`,
      // Surface billing address for tax purposes
      billing_address_collection: "auto",
      // Allow promotional codes entered at checkout
      allow_promotion_codes: true,
    });

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
