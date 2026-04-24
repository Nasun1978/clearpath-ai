"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { ProjectListing, VendorType, MarketplaceProjectType } from "@/types";
import { VENDOR_TYPES } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCurrency(n: number | null): string {
  if (!n) return "Budget TBD";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso + "T23:59:59").getTime() - Date.now()) / 86_400_000);
}

const STATUS_COLOR: Record<string, string> = {
  open:      "bg-emerald-900/40 text-emerald-300 border-emerald-700/40",
  in_review: "bg-amber-900/40 text-amber-300 border-amber-700/40",
  awarded:   "bg-blue-900/40 text-blue-300 border-blue-700/40",
  closed:    "bg-slate-800 text-slate-500 border-slate-700",
};

const TYPE_COLOR: Record<string, string> = {
  "New Construction": "bg-teal-900/30 text-teal-300 border-teal-700/40",
  "Rehabilitation":   "bg-violet-900/30 text-violet-300 border-violet-700/40",
  "Both":             "bg-amber-900/30 text-amber-300 border-amber-700/40",
};

// ── Post Listing Modal ────────────────────────────────────────────────────────

interface PostModalProps {
  onClose: () => void;
  onSuccess: (listing: ProjectListing) => void;
}

function PostListingModal({ onClose, onSuccess }: PostModalProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    project_name: "",
    project_address: "",
    project_type: "New Construction" as MarketplaceProjectType,
    unit_count: "",
    estimated_budget: "",
    description: "",
    services_needed: [] as VendorType[],
    deadline: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleService(type: VendorType) {
    setForm((f) => ({
      ...f,
      services_needed: f.services_needed.includes(type)
        ? f.services_needed.filter((s) => s !== type)
        : [...f.services_needed, type],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/marketplace/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          unit_count: form.unit_count ? parseInt(form.unit_count) : undefined,
          estimated_budget: form.estimated_budget ? parseFloat(form.estimated_budget) : undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json() as { error: string }).error);
      const { listing } = await res.json() as { listing: ProjectListing };
      onSuccess(listing);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post listing");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[#0F1729] border border-amber-800/50 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-[#0F1729] z-10">
          <div>
            <h2 className="font-bold text-white">Post a Project</h2>
            <p className="text-xs text-slate-500 mt-0.5">Step {step} of 2</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Project Name *</label>
                  <input
                    type="text" value={form.project_name}
                    onChange={(e) => setForm({ ...form, project_name: e.target.value })}
                    placeholder="e.g. Riverside Commons Phase II"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Project Address</label>
                  <input
                    type="text" value={form.project_address}
                    onChange={(e) => setForm({ ...form, project_address: e.target.value })}
                    placeholder="123 Main St, Houston, TX 77001"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Project Type *</label>
                  <select
                    value={form.project_type}
                    onChange={(e) => setForm({ ...form, project_type: e.target.value as MarketplaceProjectType })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-600"
                  >
                    <option>New Construction</option>
                    <option>Rehabilitation</option>
                    <option>Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Unit Count</label>
                  <input
                    type="number" min="1" value={form.unit_count}
                    onChange={(e) => setForm({ ...form, unit_count: e.target.value })}
                    placeholder="e.g. 120"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Estimated Budget ($)</label>
                  <input
                    type="number" min="0" value={form.estimated_budget}
                    onChange={(e) => setForm({ ...form, estimated_budget: e.target.value })}
                    placeholder="e.g. 25000000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Submission Deadline</label>
                  <input
                    type="date" value={form.deadline}
                    onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-600"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Project Description *</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={4}
                    placeholder="Describe the project scope, funding sources, timeline, and any special requirements…"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600 resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!form.project_name.trim() || !form.description.trim()}
                  className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
                >
                  Next: Select Services
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Services Needed <span className="text-slate-600 font-normal">(select all that apply)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {VENDOR_TYPES.filter((t) => t !== "Other").map((type) => {
                    const selected = form.services_needed.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleService(type)}
                        className={`text-left px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                          selected
                            ? "bg-amber-900/40 border-amber-600/60 text-amber-200"
                            : "bg-slate-900 border-slate-700 text-slate-400 hover:border-amber-700/50 hover:text-slate-200"
                        }`}
                      >
                        {selected && <span className="mr-1">✓</span>}
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button" onClick={() => setStep(1)}
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                >
                  {submitting ? "Posting…" : "Post Project"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

// ── Project Card ──────────────────────────────────────────────────────────────

function ProjectCard({ listing }: { listing: ProjectListing }) {
  const deadline = listing.deadline;
  const days = deadline ? daysUntil(deadline) : null;

  return (
    <Link href={`/marketplace/projects/${listing.id}`}>
      <div className="bg-[#0F1729] border border-slate-800 hover:border-amber-800/50 rounded-xl p-5 flex flex-col gap-3 transition-colors cursor-pointer group">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-white group-hover:text-amber-100 transition-colors leading-snug">
            {listing.project_name}
          </h3>
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_COLOR[listing.status]}`}>
            {listing.status.replace("_", " ")}
          </span>
        </div>

        {/* Location */}
        {listing.project_address && (
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {listing.project_address}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap gap-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${TYPE_COLOR[listing.project_type]}`}>
            {listing.project_type}
          </span>
          {listing.unit_count && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
              {listing.unit_count} units
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            {fmtCurrency(listing.estimated_budget)}
          </span>
        </div>

        {/* Services needed */}
        {listing.services_needed.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {listing.services_needed.slice(0, 4).map((s) => (
              <span key={s} className="px-1.5 py-0.5 rounded text-[10px] bg-amber-900/20 text-amber-400 border border-amber-800/30">
                {s}
              </span>
            ))}
            {listing.services_needed.length > 4 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] text-slate-600">
                +{listing.services_needed.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/50">
          <span className="text-slate-500">
            {listing.bid_count ?? 0} bid{(listing.bid_count ?? 0) !== 1 ? "s" : ""} submitted
          </span>
          {deadline && (
            <span className={`font-medium ${days !== null && days < 7 ? "text-red-400" : "text-slate-500"}`}>
              {days !== null && days < 0 ? "Deadline passed" : days !== null && days === 0 ? "Due today" : `${days}d remaining`}
            </span>
          )}
          {!deadline && (
            <span className="text-slate-600">Posted {fmtDate(listing.created_at)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [listings, setListings] = useState<ProjectListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [postOpen, setPostOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState<VendorType | "">("");
  const [typeFilter, setTypeFilter] = useState<MarketplaceProjectType | "">("");
  const [statusFilter, setStatusFilter] = useState<"open" | "all">("open");

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: statusFilter });
      if (serviceFilter) params.set("service", serviceFilter);
      if (typeFilter) params.set("type", typeFilter);
      const res = await fetch(`/api/marketplace/listings?${params}`);
      if (res.ok) {
        const { listings: data } = await res.json() as { listings: ProjectListing[] };
        setListings(data);
      }
    } finally {
      setLoading(false);
    }
  }, [serviceFilter, typeFilter, statusFilter]);

  useEffect(() => { void loadListings(); }, [loadListings]);

  const filtered = search.trim()
    ? listings.filter((l) =>
        l.project_name.toLowerCase().includes(search.toLowerCase()) ||
        (l.project_address ?? "").toLowerCase().includes(search.toLowerCase()) ||
        l.description.toLowerCase().includes(search.toLowerCase())
      )
    : listings;

  return (
    <div className="min-h-screen bg-[#080E1A] text-white">
      {/* Hero header */}
      <header className="border-b border-amber-900/30 bg-gradient-to-b from-amber-950/20 to-transparent">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link href="/dashboard" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Dashboard</Link>
                <span className="text-slate-700">/</span>
                <span className="text-amber-400 text-sm font-semibold">Marketplace</span>
              </div>
              <h1 className="text-2xl font-bold text-white">Development Partner Marketplace</h1>
              <p className="text-slate-400 text-sm mt-1 max-w-xl">
                Connect with qualified architects, engineers, contractors, and compliance specialists for your affordable housing projects.
              </p>
              <div className="flex items-center gap-4 mt-4">
                <Link
                  href="/marketplace/vendors"
                  className="flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Browse Vendor Directory
                </Link>
                <Link
                  href="/vendor/dashboard"
                  className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Vendor Dashboard →
                </Link>
              </div>
            </div>
            <button
              onClick={() => setPostOpen(true)}
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-amber-900/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Find Development Partners
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search projects…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#0F1729] border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-700"
            />
          </div>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value as VendorType | "")}
            className="bg-[#0F1729] border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-700"
          >
            <option value="">All Services</option>
            {VENDOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as MarketplaceProjectType | "")}
            className="bg-[#0F1729] border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-700"
          >
            <option value="">All Types</option>
            <option>New Construction</option>
            <option>Rehabilitation</option>
            <option>Both</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "open" | "all")}
            className="bg-[#0F1729] border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-700"
          >
            <option value="open">Open Projects</option>
            <option value="all">All Projects</option>
          </select>
        </div>

        {/* Stats */}
        {!loading && (
          <p className="text-xs text-slate-600 mb-4 px-1">
            {filtered.length} project{filtered.length !== 1 ? "s" : ""} found
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#0F1729] border border-slate-800 rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-slate-800 rounded w-3/4 mb-3" />
                <div className="h-3 bg-slate-800 rounded w-1/2 mb-3" />
                <div className="h-3 bg-slate-800 rounded w-full mb-2" />
                <div className="h-3 bg-slate-800 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🏗️</div>
            <p className="text-slate-300 font-semibold mb-1">No projects found</p>
            <p className="text-slate-500 text-sm mb-6">
              {search || serviceFilter || typeFilter
                ? "Try adjusting your filters"
                : "Be the first to post a project and connect with qualified vendors"}
            </p>
            <button
              onClick={() => setPostOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
            >
              Post Your First Project
            </button>
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((listing) => (
              <ProjectCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </main>

      {postOpen && (
        <PostListingModal
          onClose={() => setPostOpen(false)}
          onSuccess={(listing) => {
            setPostOpen(false);
            setListings((prev) => [{ ...listing, bid_count: 0 }, ...prev]);
          }}
        />
      )}
    </div>
  );
}
