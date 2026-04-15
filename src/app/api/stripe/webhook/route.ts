import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";

// Stripe delivers webhook payloads as raw bytes — we must NOT let Next.js
// parse the body as JSON before we verify the signature.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/stripe/webhook
// Receives and verifies Stripe webhook events.
// Must be registered in the Stripe Dashboard (or via CLI for local dev).
export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  // Read the raw body bytes — signature verification requires the exact payload
  // that Stripe signed; JSON.parse/stringify would break the check.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature verification failed";
    console.error("[stripe/webhook] Signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Route events to handlers. Add new event types here as needed.
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case "checkout.session.expired":
        // Session expired without payment — log for analytics but no action needed
        console.log("[stripe/webhook] Checkout session expired:", event.data.object.id);
        break;

      case "payment_intent.payment_failed":
        console.warn("[stripe/webhook] Payment failed:", event.data.object.id);
        break;

      default:
        // Acknowledge unhandled events so Stripe doesn't retry them
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Handler error";
    console.error(`[stripe/webhook] Error handling ${event.type}:`, message);
    // Return 500 so Stripe retries — only for unexpected handler errors,
    // not for signature or routing issues above.
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  // payment_status ensures we only act on paid sessions (not free or async methods)
  if (session.payment_status !== "paid") {
    console.log(
      `[stripe/webhook] Session ${session.id} completed but payment_status=${session.payment_status} — skipping`
    );
    return;
  }

  console.log(
    `[stripe/webhook] Payment confirmed for session ${session.id}`,
    {
      customer: session.customer,
      amount_total: session.amount_total,
      currency: session.currency,
    }
  );

  // TODO: provision access — e.g., update a `subscriptions` or `orders` table
  // in Supabase using the service role client.  Use session.customer_email or
  // session.metadata to identify the user.
  //
  // Example:
  //   const supabase = createServiceRoleClient();
  //   await supabase.from("orders").insert({
  //     stripe_session_id: session.id,
  //     stripe_customer_id: session.customer as string,
  //     amount_cents: session.amount_total ?? 0,
  //     currency: session.currency ?? "usd",
  //     email: session.customer_details?.email,
  //     status: "paid",
  //   });
}
