import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is not set");
}

// Single shared Stripe client — server-side only.
// SDK version 22+ defaults to the latest API version (2026-03-25.dahlia);
// we pin it explicitly so upgrades are intentional.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-03-25.dahlia",
});
