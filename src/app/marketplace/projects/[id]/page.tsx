"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { ProjectListing, VendorBid, VendorProfile, VendorSubscription } from "@/types";

function fmtCurrency(n: number | null): string {
  if (!n) return "TBD";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

const BID_STATUS_STYLE: Record<string, string> = {
  submitted:   "bg-slate-800 text-slate-300 border-slate-700",
  shortlisted: "bg-amber-900/40 text-amber-300 border-amber-700/40",
  awarded:     "bg-emerald-900/40 text-emerald-300 border-emerald-700/40",
  rejected:    "bg-red-900/30 text-red-400 border-red-700/30",
};

// ── Bid submission form ───────────────────────────────────────────────────────

function BidForm({ listingId, onSuccess }: { listingId: string; onSuccess: () => void }) {
  const [form, setForm] = useState({
    bid_amount: "",
    proposal_text: "",
    estimated_timeline: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/marketplace/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listingId,
          bid_amount: form.bid_amount ? parseFloat(form.bid_amount) : undefined,
          proposal_text: form.proposal_text,
          estimated_timeline: form.estimated_timeline || undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json() as { error: string }).error);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit bid");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1.5">
          Proposed Fee ($) <span className="text-slate-600 font-normal">(optional)</span>
        </label>
        <input
          type="number" min="0"
          value={form.bid_amount}
          onChange={(e) => setForm({ ...form, bid_amount: e.target.value })}
          placeholder="e.g. 450000"
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Estimated Timeline</label>
        <input
          type="text"
          value={form.estimated_timeline}
          onChange={(e) => setForm({ ...form, estimated_timeline: e.target.value })}
          placeholder="e.g. 18 months from contract execution"
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Proposal *</label>
        <textarea
          value={form.proposal_text}
          onChange={(e) => setForm({ ...form, proposal_text: e.target.value })}
          rows={6}
          required
          placeholder="Describe your relevant experience, qualifications, approach to this project, and why you're the right team…"
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600 resize-none"
        />
      </div>
      {error && (
        <p className="text-xs text-red-400 bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-2">{error}</p>
      )}
      <button
        type="submit" disabled={submitting || !form.proposal_text.trim()}
        className="w-full px-4 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
      >
        {submitting ? "Submitting…" : "Submit Bid"}
      </button>
    </form>
  );
}

// ── Developer bid row ─────────────────────────────────────────────────────────

function BidRow({ bid, onStatusChange }: { bid: VendorBid; onStatusChange: (id: string, status: string) => void }) {
  const [updating, setUpdating] = useState(false);
  const vendor = bid.vendor as VendorProfile | undefined;

  async function updateStatus(status: string) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/marketplace/bids/${bid.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) onStatusChange(bid.id, status);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="bg-[#0B1120] border border-slate-800 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-white text-sm">{vendor?.company_name ?? "Unknown Vendor"}</p>
          <p className="text-xs text-slate-500">{vendor?.vendor_type} · {vendor?.contact_name}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${BID_STATUS_STYLE[bid.status]}`}>
            {bid.status}
          </span>
          {bid.bid_amount && (
            <span className="text-sm font-bold text-amber-400">{fmtCurrency(bid.bid_amount)}</span>
          )}
        </div>
      </div>

      {/* Certifications */}
      {vendor?.certifications && vendor.certifications.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {vendor.certifications.map((c) => (
            <span key={c} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-900/30 text-emerald-300 border border-emerald-700/30">
              {c}
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-300 mb-2 leading-relaxed line-clamp-3">{bid.proposal_text}</p>

      {bid.estimated_timeline && (
        <p className="text-xs text-slate-500 mb-3">Timeline: {bid.estimated_timeline}</p>
      )}

      <p className="text-xs text-slate-600 mb-3">Submitted {fmtDate(bid.submitted_at)}</p>

      {/* Actions */}
      <div className="flex gap-2">
        {bid.status !== "shortlisted" && bid.status !== "awarded" && (
          <button
            onClick={() => updateStatus("shortlisted")}
            disabled={updating}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-900/40 text-amber-300 hover:bg-amber-800/50 border border-amber-700/40 transition-colors disabled:opacity-40"
          >
            Shortlist
          </button>
        )}
        {bid.status !== "awarded" && (
          <button
            onClick={() => updateStatus("awarded")}
            disabled={updating}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-900/40 text-emerald-300 hover:bg-emerald-800/50 border border-emerald-700/40 transition-colors disabled:opacity-40"
          >
            Award
          </button>
        )}
        {bid.status !== "rejected" && (
          <button
            onClick={() => updateStatus("rejected")}
            disabled={updating}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-red-400 hover:bg-red-900/20 border border-slate-700 hover:border-red-700/40 transition-colors disabled:opacity-40"
          >
            Reject
          </button>
        )}
        {vendor?.email && (
          <a
            href={`mailto:${vendor.email}`}
            className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 transition-colors"
          >
            Email Vendor
          </a>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [listing, setListing] = useState<ProjectListing | null>(null);
  const [bids, setBids] = useState<VendorBid[]>([]);
  const [myBid, setMyBid] = useState<VendorBid | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [subscription, setSubscription] = useState<VendorSubscription | null>(null);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidSubmitted, setBidSubmitted] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [listingRes, vendorRes] = await Promise.all([
          fetch(`/api/marketplace/listings/${id}`),
          fetch("/api/vendor/profile"),
        ]);

        if (listingRes.ok) {
          const { listing: l, bids: b, myBid: mb, isOwner: io } = await listingRes.json() as {
            listing: ProjectListing;
            bids: VendorBid[];
            myBid: VendorBid | null;
            isOwner: boolean;
          };
          setListing(l);
          setBids(b ?? []);
          setMyBid(mb);
          setIsOwner(io);
        }

        if (vendorRes.ok) {
          const { profile, subscription: sub } = await vendorRes.json() as {
            profile: VendorProfile | null;
            subscription: VendorSubscription | null;
          };
          setVendorProfile(profile);
          setSubscription(sub);
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  function handleStatusChange(bidId: string, status: string) {
    setBids((prev) => prev.map((b) => b.id === bidId ? { ...b, status: status as VendorBid["status"] } : b));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080E1A] text-white flex items-center justify-center">
        <div className="text-slate-500">Loading project…</div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#080E1A] text-white flex flex-col items-center justify-center gap-4">
        <p className="text-slate-400">Project not found.</p>
        <Link href="/marketplace" className="text-amber-400 hover:text-amber-300">← Back to Marketplace</Link>
      </div>
    );
  }

  const canBid = vendorProfile && subscription && subscription.status === "active";

  return (
    <div className="min-h-screen bg-[#080E1A] text-white">
      <header className="border-b border-slate-800 bg-[#080E1A]/90 backdrop-blur-sm sticky top-0 z-20 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/marketplace" className="text-slate-400 hover:text-white text-sm transition-colors">
            Marketplace
          </Link>
          <span className="text-slate-700">/</span>
          <h1 className="text-sm font-bold text-white truncate">{listing.project_name}</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: project details */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h2 className="text-xl font-bold text-white">{listing.project_name}</h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  listing.status === "open" ? "bg-emerald-900/40 text-emerald-300 border border-emerald-700/40" :
                  "bg-slate-800 text-slate-400 border border-slate-700"
                }`}>
                  {listing.status}
                </span>
              </div>
              {listing.project_address && (
                <p className="text-sm text-slate-400">{listing.project_address}</p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Project Type", value: listing.project_type },
                { label: "Unit Count", value: listing.unit_count ? `${listing.unit_count} units` : "TBD" },
                { label: "Est. Budget", value: fmtCurrency(listing.estimated_budget) },
                { label: "Deadline", value: listing.deadline ? fmtDate(listing.deadline) : "Open" },
              ].map((item) => (
                <div key={item.label} className="bg-[#0F1729] border border-slate-800 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                  <p className="text-sm font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-300 mb-2">Project Description</h3>
              <div className="bg-[#0F1729] border border-slate-800 rounded-xl p-4">
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
              </div>
            </div>

            {listing.services_needed.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-300 mb-2">Services Needed</h3>
                <div className="flex flex-wrap gap-2">
                  {listing.services_needed.map((s) => (
                    <span key={s} className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-900/30 text-amber-300 border border-amber-700/40">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bids section (developer only) */}
            {isOwner && (
              <div>
                <h3 className="text-sm font-bold text-slate-300 mb-3">
                  Bids Received ({bids.length})
                </h3>
                {bids.length === 0 ? (
                  <div className="bg-[#0F1729] border border-slate-800 rounded-xl p-6 text-center">
                    <p className="text-slate-500 text-sm">No bids yet. Share this listing with vendors.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bids.map((bid) => (
                      <BidRow key={bid.id} bid={bid} onStatusChange={handleStatusChange} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: bid panel */}
          <div className="space-y-4">
            {isOwner ? (
              <div className="bg-[#0F1729] border border-amber-800/40 rounded-xl p-4">
                <p className="text-sm font-bold text-amber-400 mb-1">Your Listing</p>
                <p className="text-xs text-slate-400">
                  You posted this project. Share it with vendors to receive bids.
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Posted {fmtDate(listing.created_at)}
                </p>
              </div>
            ) : (
              <div className="bg-[#0F1729] border border-slate-800 rounded-xl p-5">
                <h3 className="font-bold text-white mb-4">
                  {myBid || bidSubmitted ? "Your Bid" : "Submit a Bid"}
                </h3>

                {(myBid || bidSubmitted) ? (
                  <div className="space-y-3">
                    <div className={`px-3 py-2 rounded-lg border text-sm font-semibold ${BID_STATUS_STYLE[(myBid?.status ?? "submitted")]}`}>
                      Status: {myBid?.status ?? "submitted"}
                    </div>
                    {myBid?.bid_amount && (
                      <p className="text-sm text-slate-400">
                        Your fee: <span className="font-bold text-amber-400">{fmtCurrency(myBid.bid_amount)}</span>
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      Submitted {myBid ? fmtDate(myBid.submitted_at) : "just now"}
                    </p>
                  </div>
                ) : !vendorProfile ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400">
                      Register as a vendor to submit bids on projects.
                    </p>
                    <Link
                      href="/vendor/register"
                      className="block w-full text-center px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
                    >
                      Register as Vendor
                    </Link>
                  </div>
                ) : !canBid ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400">
                      An active subscription is required to submit bids.
                    </p>
                    <Link
                      href="/vendor/dashboard"
                      className="block w-full text-center px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
                    >
                      View Plans & Subscribe
                    </Link>
                  </div>
                ) : listing.status !== "open" ? (
                  <p className="text-xs text-slate-500">This project is no longer accepting bids.</p>
                ) : (
                  <BidForm
                    listingId={listing.id}
                    onSuccess={() => setBidSubmitted(true)}
                  />
                )}
              </div>
            )}

            {/* Bid count */}
            <div className="bg-[#0F1729] border border-slate-800 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-400">{listing.bid_count ?? 0}</p>
              <p className="text-xs text-slate-500 mt-0.5">bids submitted</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
