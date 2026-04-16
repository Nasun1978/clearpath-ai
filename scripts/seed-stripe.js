#!/usr/bin/env node
/**
 * RipeSpot — Stripe Product & Price Seeder
 *
 * Creates all subscription plans, one-time purchases, and consulting services
 * in your Stripe account, then prints the price IDs to paste into .env.local.
 *
 * Usage:
 *   node scripts/seed-stripe.js
 *
 * Requires STRIPE_SECRET_KEY in .env.local (auto-loaded below).
 * Safe to re-run — uses idempotency keys and searches for existing products
 * by metadata so nothing is created twice.
 */

const fs   = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Load .env.local manually — no dotenv dependency needed
// ---------------------------------------------------------------------------
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌  .env.local not found at', envPath);
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key   = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey || secretKey.includes('YOUR_SECRET_KEY')) {
  console.error('❌  STRIPE_SECRET_KEY is not set in .env.local');
  process.exit(1);
}

// Load stripe from node_modules
const Stripe = require(path.join(__dirname, '..', 'node_modules', 'stripe'));
const stripe = new Stripe(secretKey, { apiVersion: '2026-03-25.dahlia' });

// ---------------------------------------------------------------------------
// Product definitions
// Each entry: { key, name, description, metadata, prices[] }
// price: { key, nickname, amount (cents), currency, recurring? }
// ---------------------------------------------------------------------------
const PRODUCTS = [
  {
    key:         'starter',
    name:        'RipeSpot — Starter',
    description: 'Up to 3 active projects, zoning lookup, deal pipeline (25 deals), LIHTC checklist (1 active), 5 team members per project.',
    metadata:    { plan: 'starter', ripespot_product: 'true' },
    prices: [
      { key: 'starter_monthly', nickname: 'Starter Monthly', amount: 4900,  currency: 'usd', recurring: { interval: 'month' } },
      { key: 'starter_annual',  nickname: 'Starter Annual',  amount: 49000, currency: 'usd', recurring: { interval: 'year'  } },
    ],
  },
  {
    key:         'pro',
    name:        'RipeSpot — Pro',
    description: 'Unlimited projects, deals, and checklists. Tax credit financial analysis, PILOT analysis, 10GB document storage, priority support.',
    metadata:    { plan: 'pro', ripespot_product: 'true' },
    prices: [
      { key: 'pro_monthly', nickname: 'Pro Monthly', amount: 14900,  currency: 'usd', recurring: { interval: 'month' } },
      { key: 'pro_annual',  nickname: 'Pro Annual',  amount: 149000, currency: 'usd', recurring: { interval: 'year'  } },
    ],
  },
  {
    key:         'enterprise',
    name:        'RipeSpot — Enterprise',
    description: 'Everything in Pro plus unlimited storage, 10 user seats, custom branded reports, API access, dedicated account manager, phone support.',
    metadata:    { plan: 'enterprise', ripespot_product: 'true' },
    prices: [
      { key: 'enterprise_monthly', nickname: 'Enterprise Monthly', amount: 39900,  currency: 'usd', recurring: { interval: 'month' } },
      { key: 'enterprise_annual',  nickname: 'Enterprise Annual',  amount: 399000, currency: 'usd', recurring: { interval: 'year'  } },
    ],
  },
  {
    key:         'pay_per_project',
    name:        'RipeSpot — Pay-Per-Project',
    description: 'Single project with full Pro-tier access for 90 days. No subscription required.',
    metadata:    { plan: 'pay_per_project', ripespot_product: 'true' },
    prices: [
      { key: 'pay_per_project', nickname: 'Pay-Per-Project (90 days)', amount: 9900, currency: 'usd' },
    ],
  },
  // --- Consulting services ---
  {
    key:         'strategy_session',
    name:        'RipeSpot — Strategy Session',
    description: '90-minute strategy session: project scoping, feasibility review, and affordable housing development roadmap.',
    metadata:    { plan: 'consulting', service: 'strategy_session', ripespot_product: 'true' },
    prices: [
      { key: 'strategy_session', nickname: 'Strategy Session (90 min)', amount: 25000, currency: 'usd' },
    ],
  },
  {
    key:         'project_launch',
    name:        'RipeSpot — Project Launch Package',
    description: 'Full project setup: document review, compliance checklist configuration, timeline planning, and kickoff support.',
    metadata:    { plan: 'consulting', service: 'project_launch', ripespot_product: 'true' },
    prices: [
      { key: 'project_launch', nickname: 'Project Launch Package', amount: 250000, currency: 'usd' },
    ],
  },
  {
    key:         'lihtc_app_support',
    name:        'RipeSpot — LIHTC Application Support',
    description: 'End-to-end LIHTC application preparation, QAP compliance review, and submission support.',
    metadata:    { plan: 'consulting', service: 'lihtc_app_support', ripespot_product: 'true' },
    prices: [
      { key: 'lihtc_app_support', nickname: 'LIHTC Application Support', amount: 750000, currency: 'usd' },
    ],
  },
  {
    key:         'monthly_advisory',
    name:        'RipeSpot — Monthly Advisory Retainer',
    description: 'Ongoing expert guidance for affordable housing developers — monthly retainer.',
    metadata:    { plan: 'consulting', service: 'monthly_advisory', ripespot_product: 'true' },
    prices: [
      { key: 'monthly_advisory', nickname: 'Monthly Advisory Retainer', amount: 150000, currency: 'usd', recurring: { interval: 'month' } },
    ],
  },
  {
    key:         'government_advisory',
    name:        'RipeSpot — Government Agency Advisory',
    description: 'Dedicated compliance and program support for housing authorities and government agencies — monthly retainer.',
    metadata:    { plan: 'consulting', service: 'government_advisory', ripespot_product: 'true' },
    prices: [
      { key: 'government_advisory', nickname: 'Government Agency Advisory', amount: 500000, currency: 'usd', recurring: { interval: 'month' } },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function findExistingProduct(key) {
  // Search by metadata key so re-runs don't create duplicates
  const list = await stripe.products.search({
    query: `metadata['ripespot_product']:'true' AND metadata['plan']:'${key}'`,
    limit: 1,
  });
  return list.data[0] ?? null;
}

async function findExistingPrice(productId, nickname) {
  const list = await stripe.prices.list({ product: productId, active: true, limit: 20 });
  return list.data.find(p => p.nickname === nickname) ?? null;
}

async function upsertProduct(def) {
  // Try metadata search for subscription plans; fall back to name match for consulting
  let existing = await findExistingProduct(def.key);
  if (!existing) {
    // Consulting products share plan:'consulting' metadata — search by service key too
    if (def.metadata.service) {
      const list = await stripe.products.search({
        query: `metadata['service']:'${def.metadata.service}' AND metadata['ripespot_product']:'true'`,
        limit: 1,
      });
      existing = list.data[0] ?? null;
    }
  }

  if (existing) {
    process.stdout.write(`  ↩  Product exists: ${existing.id}  (${def.name})\n`);
    return existing;
  }

  const product = await stripe.products.create(
    { name: def.name, description: def.description, metadata: def.metadata },
    { idempotencyKey: `ripespot-product-${def.key}` }
  );
  process.stdout.write(`  ✓  Created product: ${product.id}  (${def.name})\n`);
  return product;
}

async function upsertPrice(productId, priceDef) {
  const existing = await findExistingPrice(productId, priceDef.nickname);
  if (existing) {
    process.stdout.write(`     ↩  Price exists: ${existing.id}  (${priceDef.nickname})\n`);
    return { key: priceDef.key, priceId: existing.id };
  }

  const params = {
    product:    productId,
    currency:   priceDef.currency,
    unit_amount: priceDef.amount,
    nickname:   priceDef.nickname,
    metadata:   { ripespot_price: 'true', price_key: priceDef.key },
  };
  if (priceDef.recurring) params.recurring = priceDef.recurring;

  const price = await stripe.prices.create(
    params,
    { idempotencyKey: `ripespot-price-${priceDef.key}` }
  );
  process.stdout.write(`     ✓  Created price:   ${price.id}  (${priceDef.nickname}: $${(priceDef.amount / 100).toFixed(2)})\n`);
  return { key: priceDef.key, priceId: price.id };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('\n🚀  RipeSpot — Stripe Product Seeder');
  console.log('━'.repeat(60));
  console.log(`   Using key: ${secretKey.slice(0, 12)}...`);
  console.log('━'.repeat(60) + '\n');

  const results = {};

  for (const def of PRODUCTS) {
    console.log(`\n📦  ${def.name}`);
    const product = await upsertProduct(def);
    for (const priceDef of def.prices) {
      const { key, priceId } = await upsertPrice(product.id, priceDef);
      results[key] = priceId;
    }
  }

  // ---------------------------------------------------------------------------
  // Print env block to paste into .env.local / Vercel
  // ---------------------------------------------------------------------------
  console.log('\n' + '━'.repeat(60));
  console.log('✅  Done! Paste these into .env.local and your Vercel project settings:\n');

  const envLines = [
    `# Stripe Price IDs — generated by scripts/seed-stripe.js`,
    `STRIPE_PRICE_STARTER_MONTHLY=${results.starter_monthly    ?? ''}`,
    `STRIPE_PRICE_STARTER_ANNUAL=${results.starter_annual      ?? ''}`,
    `STRIPE_PRICE_PRO_MONTHLY=${results.pro_monthly            ?? ''}`,
    `STRIPE_PRICE_PRO_ANNUAL=${results.pro_annual              ?? ''}`,
    `STRIPE_PRICE_ENTERPRISE_MONTHLY=${results.enterprise_monthly ?? ''}`,
    `STRIPE_PRICE_ENTERPRISE_ANNUAL=${results.enterprise_annual  ?? ''}`,
    `STRIPE_PRICE_PAY_PER_PROJECT=${results.pay_per_project    ?? ''}`,
    `STRIPE_PRICE_STRATEGY_SESSION=${results.strategy_session  ?? ''}`,
    `STRIPE_PRICE_PROJECT_LAUNCH=${results.project_launch      ?? ''}`,
    `STRIPE_PRICE_LIHTC_APP_SUPPORT=${results.lihtc_app_support ?? ''}`,
    `STRIPE_PRICE_MONTHLY_ADVISORY=${results.monthly_advisory  ?? ''}`,
    `STRIPE_PRICE_GOVERNMENT_ADVISORY=${results.government_advisory ?? ''}`,
  ];

  console.log(envLines.join('\n'));
  console.log('\n' + '━'.repeat(60) + '\n');
}

main().catch(err => {
  console.error('\n❌  Seeder failed:', err.message);
  process.exit(1);
});
