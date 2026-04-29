import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase";
import Stripe from "stripe";

const ADMIN_EMAILS = [
  "admin@ripespot.com",
  "steven@ripespotdevelopment.com",
  "stevenkennedy78@gmail.com",
];

const PACKAGE_NAMES: Record<string, string> = {
  tier1: "LIHTC Pipeline — Tier 1 Immediate Outreach",
  tier2: "LIHTC Pipeline — Tier 1 & 2 Priority Properties",
  full:  "LIHTC Pipeline — Full Houston Database (275 Properties)",
  custom: "LIHTC Pipeline — Custom Property Selection",
};

interface SellBody {
  package: string;
  buyerEmail: string;
  buyerName: string;
  price: number;
  selectedIds: string[];
}

// POST /api/admin/lihtc-pipeline/sell
// Admin-only — creates a Stripe payment link for a developer data purchase
export async function POST(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);
    if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json() as SellBody;
    if (!body.buyerEmail?.trim()) {
      return NextResponse.json({ error: "buyerEmail is required" }, { status: 400 });
    }
    if (!body.price || body.price < 1) {
      return NextResponse.json({ error: "price must be a positive number" }, { status: 400 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2026-03-25.dahlia" });
    const packageName = PACKAGE_NAMES[body.package] ?? "LIHTC Pipeline Data Package";
    const propertyCount = body.package === "custom" ? body.selectedIds.length : undefined;
    const description = propertyCount
      ? `${packageName} (${propertyCount} properties selected)`
      : packageName;

    // Create a one-time Stripe payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: body.price * 100, // cents
            product_data: {
              name: packageName,
              description,
            },
          },
          quantity: 1,
        },
      ],
      after_completion: {
        type: "redirect",
        redirect: { url: `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://ripespot.com"}/marketplace` },
      },
      metadata: {
        package:       body.package,
        buyer_email:   body.buyerEmail,
        buyer_name:    body.buyerName,
        seller_email:  user.email,
        property_ids:  body.selectedIds.slice(0, 50).join(","), // Stripe metadata limit
      },
    });

    return NextResponse.json({ url: paymentLink.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
