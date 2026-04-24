"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { VendorProfile, VendorBid, ProjectListing, VendorSubscription } from "@/types";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtCurrency(n: number | null): string {
  if (!n) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${(n / 1_000).toFixed(0)}K`;
}

const BID_STATUS_STYLE: Record<string, string> = {
  submitted:   "bg-slate-800 text-slate-300 border-slate-700",
  shortlisted: "bg-amber-900/40 text-amber-300 border-amber-700/40",
  awarded:     "bg-emerald-900/40 text-emerald-300 border-emerald-700/40",
  rejected:    "bg-red-900/30 text-red-400 border-red-700/30",
};

const PLAN_FEATURES: Record<string, { price: string; bids: string; listings: string; features: string[] }> = {
  basic: {
    price: "$29/mo",
    bids: "3 bids/month",
    listings: "5 listings/month",
    features: ["View project listings", "Submit up to 3 bids/month", "Basic vendor profile"],
  },
  professional: {
    price: "$79/mo",
    bids: "10 bids/month",
    listings: "Unlimited",
    features: ["Unlimited project viewing", "10 bids/month", "Priority badge", "Email alerts for new projects"],
  },
  premium: {
    price: "$149/mo",
    bids: "Unlimited",
    listings: "Unlimited",
    features: ["Unlimited bids", "Featured vendor listing", "Direct developer messaging", "Bid analytics"],
  },
};

export default function VendorDashboardPage() {
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [subscription, setSubscription] = useState<VendorSubscription | null>(null);
  const [myBids, setMyBids] = useState<(VendorBid & { listing?: ProjectListing })[]>([]);
  const [availableProjects, setAvailableProjects] = useState<ProjectListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"bids" | "projects" | "plan">("bids");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [profileRes, listingsRes] = await Promise.all([
          fetch("/api/vendor/profile"),
          fetch("/api/marketplace/listings?status=open"),
        ]);

        if (profileRes.ok) {
          const { profile: p, subscription: sub } = await profileRes.json() as {
            profile: VendorProfile | null;
            subscription: VendorSubscription | null;
          };
          setProfile(p);
          setSubscription(sub);

          // Fetch my bids if profile exists
          if (p) {
            const bidsRes = await fetch("/api/marketplace/bids/my");
            if (bidsRes.ok) {
              const { bids } = await bidsRes.json() as { bids: (VendorBid & { listing?: ProjectListing })[] };
              setMyBids(bids);
            }
          }
        }

        if (listingsRes.ok) {
          const { listings } = await listingsRes.json() as { listings: ProjectListing[] };
          setAvailableProjects(listings);
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  // Filter available projects to match vendor type
  const matchingProjects = profile
    ? availableProjects.filter((l) => l.services_needed.includes(profile.vendor_type))
    : availableProjects;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080E1A] text-white flex items-center justify-center">
        <div className="text-slate-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080E1A] text-white">
      <header className="border-b border-amber-900/30 bg-gradient-to-b from-amber-950/20 to-transparent px-6 py-6">
        <div className="max-w-5xl mx-auto flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/marketplace" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Marketplace</Link>
              <span className="text-slate-700">/</span>
              <span className="text-amber-400 text-sm font-semibold">Vendor Dashboard</span>
            </div>
            <h1 className="text-xl font-bold text-white">
              {profile ? profile.company_name : "Vendor Dashboard"}
            </h1>
            {profile && (
              <p className="text-slate-400 text-sm mt-0.5">{profile.vendor_type} · {profile.contact_name}</p>
            )}
          </div>
          {!profile && (
            <Link
              href="/vendor/register"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
            >
              Complete Registration
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {!profile ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🏢</div>
            <p className="text-slate-300 font-semibold mb-2">You haven&apos;t registered as a vendor yet</p>
            <p className="text-slate-500 text-sm mb-6">
              Create your vendor profile to start bidding on affordable housing projects.
            </p>
            <Link
              href="/vendor/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-colors"
            >
              Register as a Vendor
            </Link>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Bids", value: myBids.length },
                { label: "Shortlisted", value: myBids.filter((b) => b.status === "shortlisted").length },
                { label: "Awarded", value: myBids.filter((b) => b.status === "awarded").length },
                { label: "Matching Projects", value: matchingProjects.length },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#0F1729] border border-slate-800 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-amber-400">{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Subscription status */}
            {!subscription && (
              <div className="bg-amber-950/30 border border-amber-700/40 rounded-xl px-5 py-4 flex items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm font-semibold text-amber-300">No Active Subscription</p>
                  <p className="text-xs text-amber-400/70 mt-0.5">Subscribe to start submitting bids on projects.</p>
                </div>
                <button
                  onClick={() => setTab("plan")}
                  className="shrink-0 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
                >
                  View Plans
                </button>
              </div>
            )}
            {subscription && (
              <div className="bg-[#0F1729] border border-amber-800/40 rounded-xl px-5 py-4 flex items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm font-semibold text-amber-300">
                    {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Status: <span className={subscription.status === "active" ? "text-emerald-400" : "text-red-400"}>{subscription.status}</span>
                    {subscription.current_period_end && ` · Renews ${fmtDate(subscription.current_period_end)}`}
                  </p>
                </div>
                <button
                  onClick={() => setTab("plan")}
                  className="shrink-0 text-xs text-amber-500 hover:text-amber-400 transition-colors"
                >
                  Manage →
                </button>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-slate-900/50 rounded-xl p-1 border border-slate-800 w-fit">
              {(["bids", "projects", "plan"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    tab === t
                      ? "bg-amber-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {t === "bids" ? `My Bids (${myBids.length})` :
                   t === "projects" ? `Available Projects (${matchingProjects.length})` :
                   "Subscription"}
                </button>
              ))}
            </div>

            {/* My Bids */}
            {tab === "bids" && (
              <div className="space-y-3">
                {myBids.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500 text-sm mb-3">No bids submitted yet.</p>
                    <Link href="/marketplace" className="text-amber-400 hover:text-amber-300 text-sm">Browse Projects →</Link>
                  </div>
                ) : (
                  myBids.map((bid) => (
                    <div key={bid.id} className="bg-[#0F1729] border border-slate-800 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link
                            href={`/marketplace/projects/${bid.listing_id}`}
                            className="text-sm font-semibold text-white hover:text-amber-300 transition-colors"
                          >
                            {bid.listing?.project_name ?? "Project"}
                          </Link>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Submitted {fmtDate(bid.submitted_at)}
                            {bid.bid_amount && ` · ${fmtCurrency(bid.bid_amount)}`}
                          </p>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${BID_STATUS_STYLE[bid.status]}`}>
                          {bid.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2">{bid.proposal_text}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Available Projects */}
            {tab === "projects" && (
              <div className="space-y-3">
                {matchingProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500 text-sm">No matching projects available right now.</p>
                  </div>
                ) : (
                  matchingProjects.map((listing) => (
                    <Link key={listing.id} href={`/marketplace/projects/${listing.id}`}>
                      <div className="bg-[#0F1729] border border-slate-800 hover:border-amber-800/50 rounded-xl p-4 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">{listing.project_name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {listing.project_address ?? listing.project_type}
                              {listing.unit_count && ` · ${listing.unit_count} units`}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs text-slate-500">
                            {listing.bid_count ?? 0} bids
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2">{listing.description}</p>
                        {listing.deadline && (
                          <p className="text-xs text-amber-400 mt-2">
                            Deadline: {fmtDate(listing.deadline)}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* Subscription Plans */}
            {tab === "plan" && (
              <div className="space-y-4">
                <p className="text-sm text-slate-400">
                  Choose a plan to submit bids on project listings. All plans include a vendor profile in the directory.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(["basic", "professional", "premium"] as const).map((plan) => {
                    const info = PLAN_FEATURES[plan];
                    const isCurrent = subscription?.plan === plan && subscription?.status === "active";
                    return (
                      <div
                        key={plan}
                        className={`bg-[#0F1729] border rounded-xl p-5 flex flex-col gap-3 ${
                          plan === "professional"
                            ? "border-amber-600/60"
                            : "border-slate-800"
                        }`}
                      >
                        {plan === "professional" && (
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Most Popular</span>
                        )}
                        <div>
                          <p className="font-bold text-white text-lg capitalize">{plan}</p>
                          <p className="text-2xl font-bold text-amber-400">{info.price}</p>
                        </div>
                        <ul className="space-y-1.5 flex-1">
                          {info.features.map((f) => (
                            <li key={f} className="flex items-start gap-1.5 text-xs text-slate-400">
                              <span className="text-amber-500 shrink-0 mt-0.5">✓</span>
                              {f}
                            </li>
                          ))}
                        </ul>
                        {isCurrent ? (
                          <div className="text-center py-2 text-xs font-semibold text-emerald-400">Current Plan</div>
                        ) : (
                          <Link
                            href="/dashboard/billing"
                            className="block text-center px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
                          >
                            {subscription ? "Upgrade" : "Subscribe"}
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
