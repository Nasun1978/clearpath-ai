"use client";

import { useState } from "react";
import Link from "next/link";
import { STRIPE_PRICE_IDS } from "@/lib/plans";

interface ServiceConfig {
  name: string;
  price: string;
  priceSubtext: string;
  description: string;
  bullets: string[];
  priceId: string;
  mode: "payment" | "subscription";
  icon: string;
}

const SERVICES: ServiceConfig[] = [
  {
    name: "Strategy Session",
    price: "$250",
    priceSubtext: "one-time",
    description:
      "A focused 90-minute working session to scope your project, identify feasibility risks, and map a path forward.",
    bullets: [
      "90-minute deep-dive call",
      "Project feasibility review",
      "Program selection guidance (LIHTC, HOME, HTF, CDBG)",
      "Written summary of findings",
    ],
    priceId: STRIPE_PRICE_IDS.strategy_session,
    mode: "payment",
    icon: "🎯",
  },
  {
    name: "Project Launch Package",
    price: "$2,500",
    priceSubtext: "one-time",
    description:
      "Full project onboarding — document review, timeline planning, team coordination, and setup inside RipeSpot.",
    bullets: [
      "Full project setup in RipeSpot",
      "Document review & gap analysis",
      "LIHTC checklist configuration",
      "60-day kickoff timeline",
      "Stakeholder coordination support",
    ],
    priceId: STRIPE_PRICE_IDS.project_launch,
    mode: "payment",
    icon: "🚀",
  },
  {
    name: "LIHTC Application Support",
    price: "$7,500",
    priceSubtext: "one-time",
    description:
      "End-to-end preparation and review of your LIHTC tax credit application — from QAP scoring to submission.",
    bullets: [
      "QAP scoring analysis",
      "Narrative and exhibit review",
      "Competitive market benchmarking",
      "Deficiency response support",
      "Final submission review",
    ],
    priceId: STRIPE_PRICE_IDS.lihtc_app_support,
    mode: "payment",
    icon: "📋",
  },
  {
    name: "Monthly Advisory Retainer",
    price: "$1,500",
    priceSubtext: "/month",
    description:
      "Ongoing expert guidance for developers navigating complex affordable housing transactions.",
    bullets: [
      "4 hours of advisory time per month",
      "Priority response (24-hour SLA)",
      "Deal pipeline review",
      "Regulatory change alerts",
      "Cancel anytime",
    ],
    priceId: STRIPE_PRICE_IDS.monthly_advisory,
    mode: "subscription",
    icon: "📅",
  },
  {
    name: "Government Agency Advisory",
    price: "$5,000",
    priceSubtext: "/month",
    description:
      "Dedicated support for PHAs, HFAs, and housing agencies reviewing and approving affordable housing proposals.",
    bullets: [
      "Dedicated advisory team",
      "Unlimited review requests",
      "Staff training and documentation",
      "Regulatory compliance guidance",
      "Custom reporting and dashboards",
    ],
    priceId: STRIPE_PRICE_IDS.government_advisory,
    mode: "subscription",
    icon: "🏛️",
  },
];

export default function ConsultingPage() {
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  async function bookService(service: ServiceConfig) {
    if (!service.priceId) {
      console.warn("Price ID not configured — run /api/stripe/products-seed in development");
      return;
    }

    setLoadingPriceId(service.priceId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: service.priceId, mode: service.mode }),
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
            <Link href="/pricing" className="text-sm text-slate-400 hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/dashboard" className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold font-serif tracking-tight mb-4">
            Advisory &amp; Consulting Services
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Expert support at every stage of your affordable housing development — from first
            feasibility call to final tax credit submission.
          </p>
        </div>

        {/* Services grid — 2 columns on md, 3 on lg */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {SERVICES.map((service) => {
            const isLoading = loadingPriceId === service.priceId;
            return (
              <div
                key={service.name}
                className="flex flex-col bg-slate-900/50 border border-slate-800 rounded-2xl p-7 hover:border-slate-700 transition-all"
              >
                <div className="text-3xl mb-4">{service.icon}</div>
                <h2 className="text-lg font-bold mb-1">{service.name}</h2>
                <div className="flex items-end gap-1 mb-3">
                  <span className="text-2xl font-bold font-serif text-teal-300">{service.price}</span>
                  <span className="text-slate-500 text-sm mb-0.5">{service.priceSubtext}</span>
                </div>
                <p className="text-sm text-slate-400 mb-5 leading-relaxed">{service.description}</p>

                <ul className="space-y-2 mb-8 flex-1">
                  {service.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-slate-300">
                      <svg className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {b}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => bookService(service)}
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white transition-colors disabled:opacity-60"
                >
                  {isLoading ? "Loading…" : "Book Now"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Custom pricing CTA */}
        <div className="text-center border-t border-slate-800 pt-12">
          <p className="text-slate-400 text-sm mb-3">
            Need something custom? We work with government agencies, syndicators, and large development teams on bespoke engagements.
          </p>
          <a
            href="mailto:hello@ripespot.com?subject=Custom%20Consulting%20Inquiry"
            className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors font-semibold text-sm"
          >
            Contact us for custom pricing →
          </a>
          <p className="mt-8 text-xs text-slate-600">
            Looking for self-serve platform access?{" "}
            <Link href="/pricing" className="text-teal-500 hover:text-teal-400">
              View subscription plans
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
