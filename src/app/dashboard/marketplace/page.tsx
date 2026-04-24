"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { ProjectListing, VendorBid, VendorProfile } from "@/types";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtCurrency(n: number | null): string {
  if (!n) return "TBD";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${(n / 1_000).toFixed(0)}K`;
}

const STATUS_COLOR: Record<string, string> = {
  open:      "bg-emerald-900/40 text-emerald-300 border-emerald-700/40",
  in_review: "bg-amber-900/40 text-amber-300 border-amber-700/40",
  awarded:   "bg-blue-900/40 text-blue-300 border-blue-700/40",
  closed:    "bg-slate-800 text-slate-500 border-slate-700",
};

function StatusSelect({ listing, onUpdate }: { listing: ProjectListing; onUpdate: (id: string, status: ProjectListing["status"]) => void }) {
  const [updating, setUpdating] = useState(false);

  async function handleChange(status: string) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/marketplace/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) onUpdate(listing.id, status as ProjectListing["status"]);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <select
      value={listing.status}
      onChange={(e) => handleChange(e.target.value)}
      disabled={updating}
      className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-amber-600 disabled:opacity-50"
    >
      <option value="open">Open</option>
      <option value="in_review">In Review</option>
      <option value="awarded">Awarded</option>
      <option value="closed">Closed</option>
    </select>
  );
}

export default function DeveloperMarketplacePage() {
  const [listings, setListings] = useState<ProjectListing[]>([]);
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  const [bids, setBids] = useState<(VendorBid & { vendor?: VendorProfile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidsLoading, setBidsLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/marketplace/listings?status=all");
        if (res.ok) {
          const { listings: data } = await res.json() as { listings: ProjectListing[] };
          // Filter to only developer's own listings (server returns all open + owned)
          setListings(data);
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function loadBids(listingId: string) {
    setSelectedListing(listingId);
    setBidsLoading(true);
    try {
      const res = await fetch(`/api/marketplace/listings/${listingId}`);
      if (res.ok) {
        const { bids: b } = await res.json() as { bids: (VendorBid & { vendor?: VendorProfile })[] };
        setBids(b ?? []);
      }
    } finally {
      setBidsLoading(false);
    }
  }

  function handleStatusUpdate(id: string, status: ProjectListing["status"]) {
    setListings((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
  }

  async function handleBidStatus(bidId: string, status: string) {
    const res = await fetch(`/api/marketplace/bids/${bidId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setBids((prev) => prev.map((b) => b.id === bidId ? { ...b, status: status as VendorBid["status"] } : b));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this listing? All bids will also be deleted.")) return;
    const res = await fetch(`/api/marketplace/listings/${id}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setListings((prev) => prev.filter((l) => l.id !== id));
      if (selectedListing === id) setSelectedListing(null);
    }
  }

  const selected = listings.find((l) => l.id === selectedListing);
  const awardedVendors = listings.flatMap(() => bids.filter((b) => b.status === "awarded"));

  return (
    <div className="min-h-screen bg-[#080E1A] text-white">
      <header className="border-b border-amber-900/30 bg-gradient-to-b from-amber-950/20 to-transparent px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/dashboard" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Dashboard</Link>
              <span className="text-slate-700">/</span>
              <span className="text-amber-400 text-sm font-semibold">My Marketplace</span>
            </div>
            <h1 className="text-xl font-bold text-white">My Project Listings</h1>
          </div>
          <Link
            href="/marketplace"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Post New Project
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Listings panel */}
          <div className="lg:col-span-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
              My Listings ({listings.length})
            </h2>

            {loading && (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-[#0F1729] border border-slate-800 rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-slate-800 rounded w-2/3 mb-2" />
                    <div className="h-3 bg-slate-800 rounded w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {!loading && listings.length === 0 && (
              <div className="text-center py-12 bg-[#0F1729] border border-slate-800 rounded-xl">
                <p className="text-slate-500 text-sm mb-3">No project listings yet.</p>
                <Link
                  href="/marketplace"
                  className="text-amber-400 hover:text-amber-300 text-xs"
                >
                  Post your first project →
                </Link>
              </div>
            )}

            <div className="space-y-2">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className={`bg-[#0F1729] border rounded-xl p-4 cursor-pointer transition-colors ${
                    selectedListing === listing.id
                      ? "border-amber-700/60 bg-amber-950/10"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                  onClick={() => loadBids(listing.id)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-white leading-snug">{listing.project_name}</p>
                    <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_COLOR[listing.status]}`}>
                      {listing.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      {listing.bid_count ?? 0} bid{(listing.bid_count ?? 0) !== 1 ? "s" : ""} · {fmtCurrency(listing.estimated_budget)}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <StatusSelect listing={listing} onUpdate={handleStatusUpdate} />
                      <button
                        onClick={(e) => { e.stopPropagation(); void handleDelete(listing.id); }}
                        className="p-1 rounded text-slate-600 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bids panel */}
          <div className="lg:col-span-3">
            {!selectedListing ? (
              <div className="text-center py-20 text-slate-600">
                <svg className="w-10 h-10 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm">Select a listing to view bids</p>
              </div>
            ) : (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                  Bids for {selected?.project_name} ({bids.length})
                </h2>

                {bidsLoading && (
                  <div className="space-y-3">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="bg-[#0F1729] border border-slate-800 rounded-xl p-4 animate-pulse">
                        <div className="h-4 bg-slate-800 rounded w-1/2 mb-2" />
                        <div className="h-3 bg-slate-800 rounded w-full" />
                      </div>
                    ))}
                  </div>
                )}

                {!bidsLoading && bids.length === 0 && (
                  <div className="text-center py-12 bg-[#0F1729] border border-slate-800 rounded-xl">
                    <p className="text-slate-500 text-sm">No bids yet.</p>
                    <p className="text-xs text-slate-600 mt-1">Share your listing link with vendors.</p>
                  </div>
                )}

                <div className="space-y-3">
                  {bids.map((bid) => {
                    const vendor = bid.vendor;
                    return (
                      <div key={bid.id} className="bg-[#0F1729] border border-slate-800 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <p className="text-sm font-bold text-white">{vendor?.company_name ?? "Vendor"}</p>
                            <p className="text-xs text-slate-500">{vendor?.vendor_type} · {vendor?.contact_name}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {bid.bid_amount && (
                              <span className="text-sm font-bold text-amber-400">{fmtCurrency(bid.bid_amount)}</span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              bid.status === "shortlisted" ? "bg-amber-900/40 text-amber-300 border-amber-700/40" :
                              bid.status === "awarded" ? "bg-emerald-900/40 text-emerald-300 border-emerald-700/40" :
                              bid.status === "rejected" ? "bg-red-900/30 text-red-400 border-red-700/30" :
                              "bg-slate-800 text-slate-400 border-slate-700"
                            }`}>
                              {bid.status}
                            </span>
                          </div>
                        </div>

                        {vendor?.certifications && vendor.certifications.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {vendor.certifications.map((c) => (
                              <span key={c} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-900/30 text-emerald-300 border border-emerald-700/30">
                                {c}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="text-xs text-slate-300 line-clamp-3 mb-2">{bid.proposal_text}</p>
                        {bid.estimated_timeline && (
                          <p className="text-xs text-slate-500 mb-2">Timeline: {bid.estimated_timeline}</p>
                        )}
                        <p className="text-xs text-slate-600 mb-3">Submitted {fmtDate(bid.submitted_at)}</p>

                        <div className="flex gap-2 flex-wrap">
                          {bid.status !== "shortlisted" && bid.status !== "awarded" && (
                            <button
                              onClick={() => handleBidStatus(bid.id, "shortlisted")}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-900/40 text-amber-300 hover:bg-amber-800/50 border border-amber-700/40 transition-colors"
                            >
                              Shortlist
                            </button>
                          )}
                          {bid.status !== "awarded" && (
                            <button
                              onClick={() => handleBidStatus(bid.id, "awarded")}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-900/40 text-emerald-300 hover:bg-emerald-800/50 border border-emerald-700/40 transition-colors"
                            >
                              Award
                            </button>
                          )}
                          {bid.status !== "rejected" && (
                            <button
                              onClick={() => handleBidStatus(bid.id, "rejected")}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-red-400 border border-slate-700 hover:border-red-700/40 transition-colors"
                            >
                              Reject
                            </button>
                          )}
                          {vendor?.email && (
                            <a
                              href={`mailto:${vendor.email}`}
                              className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white border border-slate-700 transition-colors"
                            >
                              Email
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
