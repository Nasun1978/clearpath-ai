import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { priceToPlanTier } from "@/lib/plans";
import type { PlanTier, SubscriptionStatus } from "@/types";

// Stripe delivers webhook payloads as raw bytes — do NOT let Next.js
// parse the body as JSON before we verify the HMAC signature.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Service-role Supabase client — bypasses RLS for webhook writes.
// We create it inline here (not via createServerClient) because the webhook
// handler has no user session context at all.
// ---------------------------------------------------------------------------
function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase env vars not configured");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// POST /api/stripe/webhook
// Receives and verifies Stripe webhook events, then updates user_subscriptions.
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

  // Read raw bytes — signature verification requires the exact payload Stripe signed
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature verification failed";
    console.error("[stripe/webhook] Signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        // Acknowledge unhandled events so Stripe doesn't keep retrying them
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Handler error";
    console.error(`[stripe/webhook] Error handling ${event.type}:`, message);
    // Return 500 so Stripe retries the event — only for unexpected handler errors
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------
// checkout.session.completed
// ---------------------------------------------------------------------------
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  // Identify the user from metadata (set at checkout creation) or customer email
  const userId = session.metadata?.user_id ?? null;
  const customerEmail = session.customer_details?.email ?? session.customer_email;

  const supabase = getServiceSupabase();

  // Resolve user_id from email when not embedded in metadata
  let resolvedUserId = userId;
  if (!resolvedUserId && customerEmail) {
    const { data: users } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", customerEmail)
      .limit(1)
      .maybeSingle();
    resolvedUserId = (users as { id: string } | null)?.id ?? null;
  }

  if (!resolvedUserId) {
    console.warn("[stripe/webhook] checkout.session.completed — cannot identify user", {
      session_id: session.id,
      customer_email: customerEmail,
    });
    return;
  }

  const stripeCustomerId = typeof session.customer === "string" ? session.customer : null;

  if (session.mode === "subscription" && session.subscription) {
    // Retrieve the full subscription to get status and period end
    const subId = typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id;

    const subscription = await stripe.subscriptions.retrieve(subId);
    const firstItem    = subscription.items.data[0];
    const priceId      = firstItem?.price.id ?? null;
    const planTier     = (priceId ? priceToPlanTier(priceId) : null) ?? "trial";
    const status       = mapStripeStatus(subscription.status);
    // In API version 2026-03-25.dahlia, current_period_end moved to the subscription item level
    const periodEnd    = firstItem?.current_period_end ?? null;

    await supabase.from("user_subscriptions").upsert(
      {
        user_id:                  resolvedUserId,
        stripe_customer_id:       stripeCustomerId,
        stripe_subscription_id:   subscription.id,
        stripe_price_id:          priceId,
        plan_tier:                planTier,
        subscription_status:      status,
        trial_ends_at:            subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
        trial_used:               subscription.trial_end !== null,
        current_period_end:       periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : null,
      },
      { onConflict: "user_id" }
    );
  } else if (session.mode === "payment") {
    // One-time pay-per-project purchase — grant 90 days of project-level access
    const priceId = session.line_items?.data[0]?.price?.id ?? null;
    const planTier: PlanTier = "pay_per_project";
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    await supabase.from("user_subscriptions").upsert(
      {
        user_id:                     resolvedUserId,
        stripe_customer_id:          stripeCustomerId,
        stripe_price_id:             priceId,
        plan_tier:                   planTier,
        subscription_status:         "active" satisfies SubscriptionStatus,
        project_access_expires_at:   expiresAt,
        trial_used:                  true,
      },
      { onConflict: "user_id" }
    );
  }
}

// ---------------------------------------------------------------------------
// customer.subscription.created
// ---------------------------------------------------------------------------
async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  const supabase = getServiceSupabase();
  const stripeCustomerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  // Look up user by stripe_customer_id (may have been set at checkout)
  const { data: existing } = await supabase
    .from("user_subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  if (!existing) {
    // Cannot match to a user yet — checkout.session.completed will handle it
    return;
  }

  const firstItem  = subscription.items.data[0];
  const priceId    = firstItem?.price.id ?? null;
  const planTier   = (priceId ? priceToPlanTier(priceId) : null) ?? "trial";
  const status     = mapStripeStatus(subscription.status);
  const periodEnd  = firstItem?.current_period_end ?? null;

  await supabase
    .from("user_subscriptions")
    .update({
      stripe_subscription_id: subscription.id,
      stripe_price_id:        priceId,
      plan_tier:              planTier,
      subscription_status:    status,
      trial_ends_at:          subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      trial_used:             subscription.trial_end !== null,
      current_period_end:     periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null,
    })
    .eq("user_id", existing.user_id);
}

// ---------------------------------------------------------------------------
// customer.subscription.updated
// ---------------------------------------------------------------------------
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const supabase = getServiceSupabase();
  const stripeCustomerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const firstItem  = subscription.items.data[0];
  const priceId    = firstItem?.price.id ?? null;
  const planTier   = (priceId ? priceToPlanTier(priceId) : null) ?? "trial";
  const status     = mapStripeStatus(subscription.status);
  const periodEnd  = firstItem?.current_period_end ?? null;

  await supabase
    .from("user_subscriptions")
    .update({
      stripe_price_id:        priceId,
      plan_tier:              planTier,
      subscription_status:    status,
      trial_ends_at:          subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      current_period_end:     periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null,
    })
    .eq("stripe_customer_id", stripeCustomerId);
}

// ---------------------------------------------------------------------------
// customer.subscription.deleted
// ---------------------------------------------------------------------------
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const supabase = getServiceSupabase();
  const stripeCustomerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  await supabase
    .from("user_subscriptions")
    .update({
      subscription_status: "cancelled" satisfies SubscriptionStatus,
      plan_tier:           "cancelled" satisfies PlanTier,
    })
    .eq("stripe_customer_id", stripeCustomerId);
}

// ---------------------------------------------------------------------------
// invoice.payment_failed
// ---------------------------------------------------------------------------
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const supabase = getServiceSupabase();
  const stripeCustomerId = typeof invoice.customer === "string" ? invoice.customer : (invoice.customer as Stripe.Customer)?.id;

  if (!stripeCustomerId) return;

  await supabase
    .from("user_subscriptions")
    .update({ subscription_status: "past_due" satisfies SubscriptionStatus })
    .eq("stripe_customer_id", stripeCustomerId);
}

// ---------------------------------------------------------------------------
// Map Stripe subscription status to our SubscriptionStatus union type
// ---------------------------------------------------------------------------
function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
  const map: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
    active:             "active",
    canceled:           "cancelled",
    incomplete:         "unpaid",
    incomplete_expired: "cancelled",
    past_due:           "past_due",
    paused:             "paused",
    trialing:           "trialing",
    unpaid:             "unpaid",
  };
  return map[stripeStatus] ?? "unpaid";
}
