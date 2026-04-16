import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

// GET /api/stripe/products-seed
// Development-only route that creates all RipeSpot Stripe products and prices.
// Uses idempotency keys on every creation call so re-running is safe.
// Returns a JSON object you can paste directly into .env.local.
export async function GET(): Promise<NextResponse> {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  try {
    // -------------------------------------------------------------------------
    // Helper — create (or retrieve by idempotency) a product + prices
    // -------------------------------------------------------------------------
    async function createProduct(
      name: string,
      metadata: Record<string, string>
    ) {
      return stripe.products.create(
        { name, metadata },
        { idempotencyKey: `seed-product-${name.toLowerCase().replace(/\s+/g, "-")}` }
      );
    }

    async function createPrice(
      productId: string,
      unitAmountCents: number,
      currency: "usd",
      recurring: { interval: "month" | "year" } | null,
      idempotencyKeySuffix: string
    ) {
      const params = recurring
        ? {
            product: productId,
            unit_amount: unitAmountCents,
            currency,
            recurring,
          }
        : {
            product: productId,
            unit_amount: unitAmountCents,
            currency,
          };

      return stripe.prices.create(params, {
        idempotencyKey: `seed-price-${idempotencyKeySuffix}`,
      });
    }

    // -------------------------------------------------------------------------
    // Subscription plans
    // -------------------------------------------------------------------------
    const starterProduct    = await createProduct("RipeSpot — Starter",    { plan: "starter" });
    const proProduct        = await createProduct("RipeSpot — Pro",         { plan: "pro" });
    const enterpriseProduct = await createProduct("RipeSpot — Enterprise",  { plan: "enterprise" });

    const [
      starterMonthly,
      starterAnnual,
      proMonthly,
      proAnnual,
      enterpriseMonthly,
      enterpriseAnnual,
    ] = await Promise.all([
      createPrice(starterProduct.id,    4900,  "usd", { interval: "month" }, "starter-monthly"),
      createPrice(starterProduct.id,    49000, "usd", { interval: "year"  }, "starter-annual"),
      createPrice(proProduct.id,        14900, "usd", { interval: "month" }, "pro-monthly"),
      createPrice(proProduct.id,        149000,"usd", { interval: "year"  }, "pro-annual"),
      createPrice(enterpriseProduct.id, 39900, "usd", { interval: "month" }, "enterprise-monthly"),
      createPrice(enterpriseProduct.id, 399000,"usd", { interval: "year"  }, "enterprise-annual"),
    ]);

    // -------------------------------------------------------------------------
    // Pay-Per-Project (one-time)
    // -------------------------------------------------------------------------
    const payPerProjectProduct = await createProduct("RipeSpot — Pay-Per-Project", { plan: "pay_per_project" });
    const payPerProject = await createPrice(payPerProjectProduct.id, 9900, "usd", null, "pay-per-project");

    // -------------------------------------------------------------------------
    // Consulting / Advisory services
    // -------------------------------------------------------------------------
    const strategyProduct    = await createProduct("RipeSpot — Strategy Session",          { service: "consulting" });
    const launchProduct      = await createProduct("RipeSpot — Project Launch Package",    { service: "consulting" });
    const lihtcSupportProduct= await createProduct("RipeSpot — LIHTC Application Support", { service: "consulting" });
    const monthlyAdvisory    = await createProduct("RipeSpot — Monthly Advisory Retainer",  { service: "advisory" });
    const govAdvisory        = await createProduct("RipeSpot — Government Agency Advisory", { service: "advisory" });

    const [
      strategyPrice,
      launchPrice,
      lihtcSupportPrice,
      monthlyAdvisoryPrice,
      govAdvisoryPrice,
    ] = await Promise.all([
      createPrice(strategyProduct.id,     25000,  "usd", null,                    "strategy-session"),
      createPrice(launchProduct.id,       250000, "usd", null,                    "project-launch"),
      createPrice(lihtcSupportProduct.id, 750000, "usd", null,                    "lihtc-app-support"),
      createPrice(monthlyAdvisory.id,     150000, "usd", { interval: "month" },   "monthly-advisory"),
      createPrice(govAdvisory.id,         500000, "usd", { interval: "month" },   "government-advisory"),
    ]);

    // -------------------------------------------------------------------------
    // Return env vars to paste into .env.local
    // -------------------------------------------------------------------------
    const envVars = {
      STRIPE_PRICE_STARTER_MONTHLY:    starterMonthly.id,
      STRIPE_PRICE_STARTER_ANNUAL:     starterAnnual.id,
      STRIPE_PRICE_PRO_MONTHLY:        proMonthly.id,
      STRIPE_PRICE_PRO_ANNUAL:         proAnnual.id,
      STRIPE_PRICE_ENTERPRISE_MONTHLY: enterpriseMonthly.id,
      STRIPE_PRICE_ENTERPRISE_ANNUAL:  enterpriseAnnual.id,
      STRIPE_PRICE_PAY_PER_PROJECT:    payPerProject.id,
      STRIPE_PRICE_STRATEGY_SESSION:   strategyPrice.id,
      STRIPE_PRICE_PROJECT_LAUNCH:     launchPrice.id,
      STRIPE_PRICE_LIHTC_APP_SUPPORT:  lihtcSupportPrice.id,
      STRIPE_PRICE_MONTHLY_ADVISORY:   monthlyAdvisoryPrice.id,
      STRIPE_PRICE_GOVERNMENT_ADVISORY:govAdvisoryPrice.id,
    };

    // Format as .env.local lines for easy copy-paste
    const envLines = Object.entries(envVars)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n");

    return NextResponse.json({
      message: "Products and prices created successfully. Paste the env block into .env.local.",
      envBlock: envLines,
      priceIds: envVars,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[stripe/products-seed] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
