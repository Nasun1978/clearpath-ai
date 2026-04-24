"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { VendorProfile, VendorType, VendorCertification } from "@/types";
import { VENDOR_TYPES, VENDOR_CERTIFICATIONS } from "@/types";

// ── Cert Badge ────────────────────────────────────────────────────────────────

const CERT_COLOR: Record<string, string> = {
  DBE:       "bg-emerald-900/40 text-emerald-300 border-emerald-700/40",
  MBE:       "bg-blue-900/40 text-blue-300 border-blue-700/40",
  WBE:       "bg-pink-900/40 text-pink-300 border-pink-700/40",
  "Section 3": "bg-amber-900/40 text-amber-300 border-amber-700/40",
  HUBZone:   "bg-violet-900/40 text-violet-300 border-violet-700/40",
  SDVOSB:    "bg-orange-900/40 text-orange-300 border-orange-700/40",
  VOSB:      "bg-teal-900/40 text-teal-300 border-teal-700/40",
  "8(a)":    "bg-red-900/40 text-red-300 border-red-700/40",
};

function CertBadge({ cert }: { cert: string }) {
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold border ${CERT_COLOR[cert] ?? "bg-slate-800 text-slate-400 border-slate-700"}`}>
      {cert}
    </span>
  );
}

// ── Vendor Card ───────────────────────────────────────────────────────────────

function VendorCard({ vendor }: { vendor: VendorProfile }) {
  return (
    <div className="bg-[#0F1729] border border-slate-800 hover:border-amber-800/40 rounded-xl p-5 flex flex-col gap-3 transition-colors">
      {/* Company + type */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold text-white leading-snug">{vendor.company_name}</h3>
          <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-900/30 text-amber-300 border border-amber-800/40">
            {vendor.vendor_type}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{vendor.contact_name}</p>
      </div>

      {/* Certifications */}
      {vendor.certifications.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {vendor.certifications.map((c) => <CertBadge key={c} cert={c} />)}
        </div>
      )}

      {/* Service areas */}
      {vendor.service_areas.length > 0 && (
        <p className="text-xs text-slate-500 flex items-start gap-1">
          <svg className="w-3 h-3 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          {vendor.service_areas.slice(0, 3).join(" · ")}
          {vendor.service_areas.length > 3 && ` +${vendor.service_areas.length - 3} more`}
        </p>
      )}

      {/* Bio */}
      {vendor.bio && (
        <p className="text-xs text-slate-400 line-clamp-2">{vendor.bio}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800/50">
        <span className="text-xs text-slate-600">
          {vendor.years_experience ? `${vendor.years_experience} yrs experience` : "Experience not listed"}
        </span>
        <div className="flex items-center gap-2">
          {vendor.website && (
            <a
              href={vendor.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-amber-500 hover:text-amber-400 transition-colors"
            >
              Website ↗
            </a>
          )}
          {vendor.email && (
            <a
              href={`mailto:${vendor.email}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Contact
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VendorDirectoryPage() {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<VendorType | "">("");
  const [certFilter, setCertFilter] = useState<VendorCertification | "">("");
  const [expFilter, setExpFilter] = useState<"" | "5+" | "10+" | "20+">("");

  const loadVendors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set("type", typeFilter);
      if (certFilter) params.set("cert", certFilter);
      if (search) params.set("q", search);
      const res = await fetch(`/api/marketplace/vendors?${params}`);
      if (res.ok) {
        const { vendors: data } = await res.json() as { vendors: VendorProfile[] };
        setVendors(data);
      }
    } finally {
      setLoading(false);
    }
  }, [typeFilter, certFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => { void loadVendors(); }, 300);
    return () => clearTimeout(timer);
  }, [loadVendors]);

  const filtered = expFilter
    ? vendors.filter((v) => {
        const min = parseInt(expFilter);
        return (v.years_experience ?? 0) >= min;
      })
    : vendors;

  return (
    <div className="min-h-screen bg-[#080E1A] text-white">
      <header className="border-b border-amber-900/30 bg-gradient-to-b from-amber-950/20 to-transparent">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/marketplace" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Marketplace</Link>
            <span className="text-slate-700">/</span>
            <span className="text-amber-400 text-sm font-semibold">Vendor Directory</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Vendor Directory</h1>
          <p className="text-slate-400 text-sm mt-1">
            Browse certified professionals specializing in affordable housing development.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <span className="text-xs text-slate-500">
              DBE, MBE, WBE, Section 3 and other certified vendors are highlighted
            </span>
            <Link
              href="/vendor/register"
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors font-semibold border border-amber-800/50 px-3 py-1 rounded-lg"
            >
              Register as Vendor →
            </Link>
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
              placeholder="Search vendors…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#0F1729] border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-700"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as VendorType | "")}
            className="bg-[#0F1729] border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-700"
          >
            <option value="">All Types</option>
            {VENDOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={certFilter}
            onChange={(e) => setCertFilter(e.target.value as VendorCertification | "")}
            className="bg-[#0F1729] border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-700"
          >
            <option value="">All Certifications</option>
            {VENDOR_CERTIFICATIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={expFilter}
            onChange={(e) => setExpFilter(e.target.value as "" | "5+" | "10+" | "20+")}
            className="bg-[#0F1729] border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-700"
          >
            <option value="">Any Experience</option>
            <option value="5+">5+ years</option>
            <option value="10+">10+ years</option>
            <option value="20+">20+ years</option>
          </select>
        </div>

        {/* Cert legend */}
        <div className="flex flex-wrap gap-2 mb-6 items-center">
          <span className="text-xs text-slate-600">Certification badges:</span>
          {["DBE", "MBE", "WBE", "Section 3", "HUBZone"].map((c) => (
            <CertBadge key={c} cert={c} />
          ))}
        </div>

        {!loading && (
          <p className="text-xs text-slate-600 mb-4 px-1">
            {filtered.length} vendor{filtered.length !== 1 ? "s" : ""} found
          </p>
        )}

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#0F1729] border border-slate-800 rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-slate-800 rounded w-2/3 mb-2" />
                <div className="h-3 bg-slate-800 rounded w-1/3 mb-3" />
                <div className="h-3 bg-slate-800 rounded w-full mb-2" />
                <div className="h-3 bg-slate-800 rounded w-3/4" />
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🤝</div>
            <p className="text-slate-300 font-semibold mb-1">No vendors found</p>
            <p className="text-slate-500 text-sm mb-6">
              {typeFilter || certFilter || search ? "Try adjusting your filters" : "No vendors have registered yet"}
            </p>
            <Link
              href="/vendor/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
            >
              Register as a Vendor
            </Link>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
