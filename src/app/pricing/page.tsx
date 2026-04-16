"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { STRIPE_PRICE_IDS } from "@/lib/plans";

interface PlanConfig {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: string[];
  notIncluded: string[];
  monthlyPriceId: string;
  annualPriceId: string;
  isPopular: boolean;
  ctaLabel: string;
  isEnterprise: boolean;
}

const PLANS: PlanConfig[] = [
  {
    name: "Starter",
    monthlyPrice: 49,
    annualPrice: 490,
    description: "Perfect for individual developers and small projects.",
    features: [
      "Up to 3 projects",
      "Up to 25 deals in pipeline",
      "1 LIHTC checklist",
      "Up to 5 team members",
      "1 GB document storage",
      "Zoning lookup",
      "Deal pipeline",
      "HUD HOME guide",
      "FFIEC maps",
    ],
    notIncluded: [
      "Tax credit analysis",
      "PILOT analysis",
      "Task notifications",
      "Custom reports",
      "API access",
    ],
    monthlyPriceId: STRIPE_PRICE_IDS.starter_monthly,
    annualPriceId:  STRIPE_PRICE_IDS.starter_annual,
    isPopular:      false,
    ctaLabel:       "Start Free Trial",
    isEnterprise:   false,
  },
  {
    name: "Pro",
    monthlyPrice: 149,
    annualPrice: 1490,
    description: "For serious developers managing multiple LIHTC applications.",
    features: [
      "Unlimited projects",
      "Unlimited deals",
      "Unlimited LIHTC checklists",
      "Unlimited team members",
      "10 GB document storage",
      "Zoning lookup",
      "Deal pipeline",
      "Tax credit analysis",
      "PILOT analysis",
      "HUD HOME guide",
      "FFIEC maps",
      "Task notifications",
    ],
    notIncluded: [
      "Custom reports",
      "API access",
      "Dedicated account manager",
    ],
    monthlyPriceId: STRIPE_PRICE_IDS.pro_monthly,
    annualPriceId:  STRIPE_PRICE_IDS.pro_annual,
    isPopular:      true,
    ctaLabel:       "Start Free Trial",
    isEnterprise:   false,
  },
  {
    name: "Enterprise",
    monthlyPrice: 399,
    annualPrice: 3990,
    description: "For housing agencies, HFAs, and large development teams.",
    features: [
      "Everything in Pro",
      "Unlimited storage",
      "Custom reports",
      "API access",
      "Dedicated account manager",
      "Phone support",
      "Priority review",
      "Custom integrations",
      "SLA guarantees",
    ],
    notIncluded: [],
    monthlyPriceId: STRIPE_PRICE_IDS.enterprise_monthly,
    annualPriceId:  STRIPE_PRICE_IDS.enterprise_annual,
    isPopular:      false,
    ctaLabel:       "Contact Sales",
    isEnterprise:   true,
  },
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const router = useRouter();

  async function startCheckout(priceId: string, isEnterprise: boolean) {
    if (isEnterprise) {
      window.location.href = "mailto:hello@ripespot.com?subject=RipeSpot%20Enterprise%20Inquiry";
      return;
    }

    if (!priceId) {
      console.warn("Price ID not configured yet — run /api/stripe/products-seed in development");
      return;
    }

    setLoadingPriceId(priceId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, mode: "subscription", isTrial: true }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Checkout error:", data.error);
      }
    } finally {
      setLoadingPriceId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#080E1A] text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#080E1A]/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold font-serif tracking-tight text-white hover:text-teal-300 transition-colors">
            RipeSpot
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/consulting" className="text-sm text-slate-400 hover:text-white transition-colors">
              Consulting
            </Link>
            <Link href="/dashboard" className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-serif tracking-tight mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Everything you need to navigate affordable housing compliance — from individual projects
            to agency-scale operations.
          </p>

          {/* Free trial callout */}
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-sm font-medium">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            All plans include a 14-day free trial. No credit card required.
          </div>
        </div>

        {/* Monthly / Annual toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm font-medium transition-colors ${!isAnnual ? "text-white" : "text-slate-500"}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isAnnual ? "bg-teal-600" : "bg-slate-700"
            }`}
            aria-pressed={isAnnual}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                isAnnual ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className={`text-sm font-medium transition-colors ${isAnnual ? "text-white" : "text-slate-500"}`}>
            Annual
          </span>
          {isAnnual && (
            <span className="bg-teal-500/20 text-teal-300 text-xs px-2 py-0.5 rounded-full border border-teal-500/30 font-semibold">
              Save 17%
            </span>
          )}
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {PLANS.map((plan) => {
            const priceId = isAnnual ? plan.annualPriceId : plan.monthlyPriceId;
            const displayPrice = isAnnual
              ? Math.round(plan.annualPrice / 12)
              : plan.monthlyPrice;
            const isLoading = loadingPriceId === priceId;

            return (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-7 transition-all ${
                  plan.isPopular
                    ? "bg-[#0D1627] border-teal-500/50 ring-2 ring-teal-500/30"
                    : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 border border-teal-500/50 text-teal-300 whitespace-nowrap">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-1">{plan.name}</h2>
                  <p className="text-sm text-slate-400">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold font-serif">${displayPrice}</span>
                    <span className="text-slate-400 text-sm mb-1">/mo</span>
                  </div>
                  {isAnnual && (
                    <p className="text-xs text-slate-500 mt-1">
                      ${plan.annualPrice}/yr billed annually
                    </p>
                  )}
                  {!isAnnual && (
                    <p className="text-xs text-slate-500 mt-1">billed monthly</p>
                  )}
                </div>

                <button
                  onClick={() => startCheckout(priceId, plan.isEnterprise)}
                  disabled={isLoading}
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold mb-6 transition-colors ${
                    plan.isPopular || plan.isEnterprise
                      ? "bg-teal-600 hover:bg-teal-500 text-white disabled:opacity-60"
                      : "bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-60"
                  }`}
                >
                  {isLoading ? "Loading…" : plan.ctaLabel}
                </button>

                <div className="flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-slate-300">{f}</span>
                    </div>
                  ))}
                  {plan.notIncluded.map((f) => (
                    <div key={f} className="flex items-start gap-2.5 opacity-40">
                      <svg className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-sm text-slate-500">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pay-Per-Project */}
        <div className="mb-16">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-4">
              One-Time Purchase
            </div>
            <h2 className="text-2xl font-bold font-serif mb-2">Pay-Per-Project</h2>
            <div className="text-4xl font-bold font-serif mb-2">$99</div>
            <p className="text-slate-400 text-sm mb-6">
              Full Pro-level access for a single project — valid for 90 days.
              Ideal for consultants or one-off compliance reviews.
            </p>
            <ul className="text-sm text-slate-300 space-y-2 mb-8 text-left max-w-xs mx-auto">
              {["All Pro features for one project", "90-day access window", "No recurring charges", "Includes LIHTC checklist, PILOT analysis, and tax credit tools"].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={async () => {
                const priceId = STRIPE_PRICE_IDS.pay_per_project;
                if (!priceId) return;
                setLoadingPriceId(priceId);
                try {
                  const res = await fetch("/api/stripe/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ priceId, mode: "payment" }),
                  });
                  const data = (await res.json()) as { url?: string };
                  if (data.url) window.location.href = data.url;
                } finally {
                  setLoadingPriceId(null);
                }
              }}
              disabled={loadingPriceId === STRIPE_PRICE_IDS.pay_per_project}
              className="px-8 py-2.5 rounded-lg text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white transition-colors disabled:opacity-60"
            >
              {loadingPriceId === STRIPE_PRICE_IDS.pay_per_project ? "Loading…" : "Purchase Project Access"}
            </button>
          </div>
        </div>

        {/* Nonprofit / Government discount note */}
        <div className="text-center text-sm text-slate-500 border-t border-slate-800 pt-10">
          <p className="mb-2">
            Nonprofit organizations and government agencies may be eligible for discounted pricing.
          </p>
          <a
            href="mailto:hello@ripespot.com?subject=Nonprofit%20%2F%20Government%20Discount%20Inquiry"
            className="text-teal-400 hover:text-teal-300 transition-colors"
          >
            Contact us to learn more →
          </a>
          <p className="mt-6 text-xs text-slate-600">
            Looking for advisory support?{" "}
            <Link href="/consulting" className="text-teal-500 hover:text-teal-400">
              View consulting services
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
