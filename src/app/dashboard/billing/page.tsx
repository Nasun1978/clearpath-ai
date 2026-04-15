"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { UserSubscription } from "@/types";
import { getPlanDisplayName, getPlanColor, PLAN_FEATURES } from "@/lib/plans";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    trialing:  "bg-teal-500/20 text-teal-300 border-teal-500/30",
    active:    "bg-green-500/20 text-green-300 border-green-500/30",
    past_due:  "bg-red-500/20 text-red-400 border-red-500/30",
    cancelled: "bg-slate-700/50 text-slate-400 border-slate-600/30",
    unpaid:    "bg-red-500/20 text-red-400 border-red-500/30",
    paused:    "bg-amber-500/20 text-amber-300 border-amber-500/30",
  };
  const labels: Record<string, string> = {
    trialing:  "Free Trial",
    active:    "Active",
    past_due:  "Past Due",
    cancelled: "Cancelled",
    unpaid:    "Unpaid",
    paused:    "Paused",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] ?? "bg-slate-700 text-slate-400 border-slate-600"}`}>
      {labels[status] ?? status}
    </span>
  );
}

// Feature comparison: what the user has now vs what Pro adds
const COMPARISON_ROWS: { label: string; starterValue: string; proValue: string; enterpriseValue: string }[] = [
  { label: "Projects",          starterValue: "3",           proValue: "Unlimited",   enterpriseValue: "Unlimited" },
  { label: "LIHTC Checklists",  starterValue: "1",           proValue: "Unlimited",   enterpriseValue: "Unlimited" },
  { label: "Deals",             starterValue: "25",          proValue: "Unlimited",   enterpriseValue: "Unlimited" },
  { label: "Team Members",      starterValue: "5",           proValue: "Unlimited",   enterpriseValue: "Unlimited" },
  { label: "Storage",           starterValue: "1 GB",        proValue: "10 GB",       enterpriseValue: "Unlimited" },
  { label: "Tax Credit Analysis",starterValue: "—",          proValue: "Included",    enterpriseValue: "Included" },
  { label: "PILOT Analysis",    starterValue: "—",           proValue: "Included",    enterpriseValue: "Included" },
  { label: "Task Notifications",starterValue: "—",           proValue: "Included",    enterpriseValue: "Included" },
  { label: "Custom Reports",    starterValue: "—",           proValue: "—",           enterpriseValue: "Included" },
  { label: "API Access",        starterValue: "—",           proValue: "—",           enterpriseValue: "Included" },
  { label: "Dedicated Manager", starterValue: "—",           proValue: "—",           enterpriseValue: "Included" },
];

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Partial<UserSubscription> | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const res = await fetch("/api/user/subscription");
        if (res.ok) {
          const data = (await res.json()) as Partial<UserSubscription>;
          setSubscription(data);
        }
      } catch (err) {
        console.error("Failed to fetch subscription:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSubscription();
  }, []);

  async function openBillingPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        router.push(data.url);
      } else {
        console.error("Portal error:", data.error);
        alert("Could not open billing portal. Please try again.");
      }
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080E1A] flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading billing info…</div>
      </div>
    );
  }

  const planTier     = subscription?.plan_tier     ?? "trial";
  const status       = subscription?.subscription_status ?? "trialing";
  const trialDays    = daysUntil(subscription?.trial_ends_at ?? null);
  const isTrialing   = status === "trialing";
  const isPastDue    = status === "past_due" || status === "unpaid";
  const features     = PLAN_FEATURES[planTier];

  return (
    <div className="min-h-screen bg-[#080E1A] text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#080E1A]/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-bold font-serif">Billing &amp; Subscription</h1>
          </div>
          <Link href="/pricing" className="text-sm text-teal-400 hover:text-teal-300 transition-colors">
            View all plans →
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* Past due alert */}
        {isPastDue && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-sm">Payment issue — your subscription is {status === "unpaid" ? "unpaid" : "past due"}.</p>
              <p className="text-xs mt-1 text-red-400">Update your payment method to restore full access.</p>
            </div>
          </div>
        )}

        {/* Trial urgency banner */}
        {isTrialing && trialDays !== null && trialDays <= 5 && (
          <div className={`flex items-start gap-3 p-4 rounded-xl border ${
            trialDays <= 1
              ? "bg-red-950/40 border-red-500/40 text-red-300"
              : "bg-amber-950/30 border-amber-500/30 text-amber-300"
          }`}>
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold text-sm">
                {trialDays <= 0
                  ? "Your trial ends today — upgrade now to keep your data."
                  : trialDays === 1
                  ? "Trial ending tomorrow — upgrade to keep access."
                  : `Trial ending in ${trialDays} days — upgrade to keep your data.`}
              </p>
            </div>
            <Link href="/pricing" className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white transition-colors">
              Upgrade Now
            </Link>
          </div>
        )}

        {/* Current plan card */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-7">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Current Plan</h2>
          <div className="flex flex-wrap items-start gap-4 justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-bold font-serif">{getPlanDisplayName(planTier)}</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getPlanColor(planTier)}`}>
                  {planTier}
                </span>
                <StatusBadge status={status} />
              </div>

              <div className="space-y-1 text-sm text-slate-400">
                {isTrialing && subscription?.trial_ends_at && (
                  <p>
                    Trial ends: <span className="text-white">{formatDate(subscription.trial_ends_at)}</span>
                    {trialDays !== null && (
                      <span className={`ml-2 text-xs ${trialDays <= 3 ? "text-amber-400" : "text-slate-500"}`}>
                        ({trialDays <= 0 ? "today" : `${trialDays} day${trialDays === 1 ? "" : "s"} left`})
                      </span>
                    )}
                  </p>
                )}
                {subscription?.current_period_end && !isTrialing && (
                  <p>
                    Next billing date: <span className="text-white">{formatDate(subscription.current_period_end)}</span>
                  </p>
                )}
                {subscription?.stripe_subscription_id && (
                  <p className="text-xs text-slate-600 font-mono mt-2">
                    {subscription.stripe_subscription_id}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 min-w-[180px]">
              {isTrialing ? (
                <Link
                  href="/pricing"
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-teal-600 hover:bg-teal-500 text-white text-center transition-colors"
                >
                  Upgrade Now →
                </Link>
              ) : (
                <>
                  <button
                    onClick={openBillingPortal}
                    disabled={portalLoading || !subscription?.stripe_customer_id}
                    className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-700 hover:bg-slate-600 text-white transition-colors disabled:opacity-50"
                  >
                    {portalLoading ? "Opening…" : "Manage Billing"}
                  </button>
                  <Link
                    href="/pricing"
                    className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 text-center border border-teal-600/30 transition-colors"
                  >
                    Upgrade Plan
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Current plan features summary */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-3">Your Plan Includes</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { label: "Projects",    value: typeof features.maxProjects === "number" ? features.maxProjects.toString() : features.maxProjects },
                { label: "Storage",     value: typeof features.maxStorageGB === "number" ? `${features.maxStorageGB} GB` : features.maxStorageGB },
                { label: "Team Members",value: typeof features.maxTeamMembers === "number" ? features.maxTeamMembers.toString() : features.maxTeamMembers },
                { label: "Tax Credit Analysis", value: features.taxCreditAnalysis ? "Yes" : "No" },
                { label: "PILOT Analysis",       value: features.pilotAnalysis ? "Yes" : "No" },
                { label: "API Access",            value: features.apiAccess ? "Yes" : "No" },
              ].map((item) => (
                <div key={item.label} className="bg-slate-800/40 rounded-lg px-3 py-2.5">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className={`text-sm font-semibold mt-0.5 ${item.value === "No" ? "text-slate-600" : "text-white"}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Plan comparison table */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-7 py-4 border-b border-slate-800">
            <h2 className="text-sm font-bold text-slate-300">Plan Comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-7 py-3 text-xs text-slate-500 font-semibold uppercase tracking-wider">Feature</th>
                  <th className="px-4 py-3 text-xs text-slate-500 font-semibold uppercase tracking-wider text-center">Starter</th>
                  <th className="px-4 py-3 text-xs text-teal-400 font-semibold uppercase tracking-wider text-center">Pro</th>
                  <th className="px-4 py-3 text-xs text-amber-400 font-semibold uppercase tracking-wider text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.label} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-7 py-3 text-slate-300">{row.label}</td>
                    <td className="px-4 py-3 text-center text-slate-400">{row.starterValue}</td>
                    <td className="px-4 py-3 text-center text-teal-300 font-medium">{row.proValue}</td>
                    <td className="px-4 py-3 text-center text-amber-300 font-medium">{row.enterpriseValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoices note */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl px-7 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-slate-300">Invoices &amp; Payment History</p>
            <p className="text-xs text-slate-500 mt-0.5">View and download past invoices in the Stripe billing portal.</p>
          </div>
          <button
            onClick={openBillingPortal}
            disabled={portalLoading || !subscription?.stripe_customer_id}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {portalLoading ? "Opening…" : "Open Billing Portal"}
          </button>
        </div>

      </main>
    </div>
  );
}
