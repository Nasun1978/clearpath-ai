"use client";

import { useState } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MapTab {
  id: string;
  label: string;
  url: string;
  description: string;
}

interface FmrMarket {
  name: string;
  hmfa: string;
  counties: string[];
  rents: { br0: number; br1: number; br2: number; br3: number; br4: number };
  accent: "teal" | "blue" | "purple";
}

interface ContextCard {
  title: string;
  body: string;
  accent: "teal" | "blue" | "amber" | "emerald" | "purple";
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MAP_TABS: MapTab[] = [
  {
    id: "lihtc-properties",
    label: "LIHTC Properties Map",
    url: "https://hudgis-hud.opendata.arcgis.com/maps/HUD::low-income-housing-tax-credit-properties-1",
    description:
      "All LIHTC properties placed in service since 1987. Filter by state, city, placed-in-service year, and credit type to identify resyndication targets nearing the end of their 15-year compliance period.",
  },
  {
    id: "econ-planning",
    label: "HUD eCon Planning Suite",
    url: "https://egis.hud.gov/cpdmaps/",
    description:
      "HUD's Consolidated Plan mapping tool showing LIHTC properties, HCV concentrations, poverty rates, and community development data. Overlay multiple datasets to identify opportunity areas.",
  },
  {
    id: "fmr-lookup",
    label: "FMR Lookup",
    url: "https://www.huduser.gov/portal/datasets/fmr.html",
    description:
      "Look up Fair Market Rents and Small Area FMRs by geography. FMRs determine Housing Choice Voucher payment standards.",
  },
];

const FMR_MARKETS: FmrMarket[] = [
  {
    name: "New Orleans-Metairie HMFA",
    hmfa: "FY 2026",
    counties: [
      "Jefferson", "Orleans", "Plaquemines", "St. Bernard",
      "St. Charles", "St. James", "St. John the Baptist", "St. Tammany",
    ],
    rents: { br0: 1071, br1: 1236, br2: 1478, br3: 1889, br4: 2217 },
    accent: "teal",
  },
  {
    name: "Baton Rouge HMFA",
    hmfa: "FY 2026",
    counties: [
      "Ascension", "East Baton Rouge", "East Feliciana", "Livingston",
      "Pointe Coupee", "St. Helena", "West Baton Rouge", "West Feliciana",
    ],
    rents: { br0: 1032, br1: 1064, br2: 1204, br3: 1511, br4: 1943 },
    accent: "blue",
  },
  {
    name: "Houston–The Woodlands–Sugar Land MSA",
    hmfa: "FY 2026",
    counties: [
      "Austin", "Brazoria", "Chambers", "Fort Bend",
      "Galveston", "Harris", "Liberty", "Montgomery", "Waller",
    ],
    rents: { br0: 1053, br1: 1170, br2: 1370, br3: 1791, br4: 2196 },
    accent: "purple",
  },
];

const CONTEXT_CARDS: ContextCard[] = [
  {
    title: "Housing Choice Vouchers (HCV / Section 8)",
    body: "HUD's tenant-based rental assistance program. Voucher holders pay 30% of their adjusted income toward rent; the local Public Housing Authority pays the remainder up to the Payment Standard. Approximately 2.3 million households are served nationwide.",
    accent: "teal",
  },
  {
    title: "Fair Market Rents (FMRs)",
    body: "HUD's annual estimate of the 40th percentile gross rent paid by recent movers in the private market. FMRs set the ceiling for Payment Standards and are updated each October for the coming federal fiscal year.",
    accent: "blue",
  },
  {
    title: "Small Area FMRs (SAFMRs)",
    body: "Zip-code level FMRs that more accurately reflect neighborhood rent variation within a metro area. Required in 24 metros and optionally adopted by others. SAFMRs allow voucher holders to afford units in higher-opportunity neighborhoods.",
    accent: "emerald",
  },
  {
    title: "Why This Matters for LIHTC",
    body: "Developers can set LIHTC contract rents at or near the local Payment Standard for voucher holders, locking in stable revenue with minimal vacancy risk. HCV-income certification is also simpler since the PHA verifies income at issuance.",
    accent: "amber",
  },
  {
    title: "Resyndication Targets (2008–2011 Vintage)",
    body: "LIHTC properties placed in service between 2008 and 2011 are now at or past their 15-year compliance period. Owners may sell to a new developer who can claim a second allocation of credits. The HUD map above filters by placed-in-service year to identify these assets.",
    accent: "purple",
  },
];

const ACCENT_RING: Record<string, string> = {
  teal:    "border-teal-800/50",
  blue:    "border-blue-800/50",
  purple:  "border-purple-800/50",
  emerald: "border-emerald-800/50",
  amber:   "border-amber-800/50",
};
const ACCENT_TITLE: Record<string, string> = {
  teal:    "text-teal-300",
  blue:    "text-blue-300",
  purple:  "text-purple-300",
  emerald: "text-emerald-300",
  amber:   "text-amber-300",
};
const ACCENT_BG: Record<string, string> = {
  teal:    "bg-teal-900/15",
  blue:    "bg-blue-900/15",
  purple:  "bg-purple-900/15",
  emerald: "bg-emerald-900/15",
  amber:   "bg-amber-900/15",
};
const ACCENT_BADGE: Record<string, string> = {
  teal:    "bg-teal-800/40 text-teal-300 border-teal-700/40",
  blue:    "bg-blue-800/40 text-blue-300 border-blue-700/40",
  purple:  "bg-purple-800/40 text-purple-300 border-purple-700/40",
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

// ── FMR Table ─────────────────────────────────────────────────────────────────

function FmrTable({ market }: { market: FmrMarket }) {
  const a = market.accent;
  return (
    <div className={`bg-[#0F1729] border rounded-2xl overflow-hidden flex flex-col ${ACCENT_RING[a]}`}>
      {/* Header */}
      <div className={`px-5 pt-5 pb-4 border-b border-slate-800/60 ${ACCENT_BG[a]}`}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className={`text-sm font-bold leading-snug ${ACCENT_TITLE[a]}`}>{market.name}</h3>
          <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${ACCENT_BADGE[a]}`}>
            {market.hmfa}
          </span>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          {market.counties.join(" · ")}
        </p>
      </div>

      {/* Rent grid */}
      <div className="px-5 py-4 flex-1">
        <div className="grid grid-cols-5 gap-2">
          {(["br0", "br1", "br2", "br3", "br4"] as const).map((key, i) => (
            <div key={key} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                {i}BR
              </span>
              <span className={`text-base font-bold ${ACCENT_TITLE[a]}`}>
                {fmt(market.rents[key])}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment standard note */}
      <div className="px-5 pb-4">
        <div className="p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl">
          <p className="text-[10px] text-slate-500 leading-relaxed">
            <span className="text-slate-400 font-semibold">Payment Standards</span> are set by the local PHA at 90–110% of FMR.
            Contact the housing authority for current standards.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function VoucherMapPage() {
  const [activeTab, setActiveTab] = useState(MAP_TABS[0].id);
  const [iframeError, setIframeError] = useState<Record<string, boolean>>({});

  const activeMap = MAP_TABS.find((t) => t.id === activeTab) ?? MAP_TABS[0];

  return (
    <div className="min-h-screen text-white">
      {/* Page header */}
      <header className="border-b border-slate-800 bg-[#080E1A]/90 backdrop-blur-sm sticky top-0 z-10 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-slate-500 hover:text-slate-300 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">Housing Choice Voucher &amp; LIHTC Map</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              FY 2026 Fair Market Rents · LIHTC property inventory · HCV payment standards
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">

        {/* ── Interactive Maps ── */}
        <section>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Interactive Maps</h2>
          <div className="bg-[#0F1729] border border-slate-800 rounded-2xl overflow-hidden">

            {/* Tab bar */}
            <div className="flex overflow-x-auto border-b border-slate-800 bg-[#080E1A]/60">
              {MAP_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "border-teal-500 text-teal-300 bg-teal-900/10"
                      : "border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/40"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Description + open link */}
            <div className="px-5 py-3 border-b border-slate-800/60 flex items-start justify-between gap-4">
              <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">{activeMap.description}</p>
              <a
                href={activeMap.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open in new tab
              </a>
            </div>

            {/* iframe */}
            <div className="relative h-[540px] bg-slate-900">
              {iframeError[activeTab] ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-300">Map cannot be embedded</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      This resource restricts iframe embedding. Open it directly in a new tab to view the map.
                    </p>
                  </div>
                  <a
                    href={activeMap.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-teal-700 text-white hover:bg-teal-600 transition-colors"
                  >
                    Open Map →
                  </a>
                </div>
              ) : (
                <iframe
                  key={activeTab}
                  src={activeMap.url}
                  className="w-full h-full border-0"
                  title={activeMap.label}
                  loading="lazy"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                  onError={() => setIframeError((prev) => ({ ...prev, [activeTab]: true }))}
                />
              )}
            </div>
          </div>
        </section>

        {/* ── FY 2026 FMR Reference Tables ── */}
        <section>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">FY 2026 Fair Market Rents</h2>
              <p className="text-xs text-slate-600 mt-1">
                40th percentile gross rents for recent movers in the private market · effective October 1, 2025
              </p>
            </div>
            <a
              href="https://www.huduser.gov/portal/datasets/fmr.html"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              HUD FMR Dataset
            </a>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {FMR_MARKETS.map((market) => (
              <FmrTable key={market.name} market={market} />
            ))}
          </div>
        </section>

        {/* ── Context Cards ── */}
        <section>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Program Reference</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {CONTEXT_CARDS.map((card) => (
              <div
                key={card.title}
                className={`bg-[#0F1729] border rounded-xl p-5 ${ACCENT_RING[card.accent]} ${ACCENT_BG[card.accent]}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${
                    card.accent === "teal"    ? "bg-teal-400" :
                    card.accent === "blue"    ? "bg-blue-400" :
                    card.accent === "emerald" ? "bg-emerald-400" :
                    card.accent === "amber"   ? "bg-amber-400" :
                                                "bg-purple-400"
                  }`} />
                  <h3 className={`text-sm font-bold leading-snug ${ACCENT_TITLE[card.accent]}`}>
                    {card.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pl-4">{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Quick Links ── */}
        <section>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="https://www.huduser.gov/portal/datasets/fmr/fmrs/FY2026_code/2026summary.odn"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#0F1729] border border-slate-800 rounded-xl p-4 flex items-center gap-3 hover:border-teal-700/50 hover:bg-teal-900/10 transition-colors group"
            >
              <div className="shrink-0 w-9 h-9 rounded-lg bg-teal-900/40 border border-teal-800/40 flex items-center justify-center">
                <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200 group-hover:text-teal-300 transition-colors">FY 2026 FMR Schedule</p>
                <p className="text-xs text-slate-500 truncate">HUD national FMR data file</p>
              </div>
            </a>

            <a
              href="https://www.hud.gov/program_offices/public_indian_housing/programs/hcv/phasearch"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#0F1729] border border-slate-800 rounded-xl p-4 flex items-center gap-3 hover:border-blue-700/50 hover:bg-blue-900/10 transition-colors group"
            >
              <div className="shrink-0 w-9 h-9 rounded-lg bg-blue-900/40 border border-blue-800/40 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200 group-hover:text-blue-300 transition-colors">PHA Contact Search</p>
                <p className="text-xs text-slate-500 truncate">Find local housing authorities</p>
              </div>
            </a>

            <a
              href="https://hudgis-hud.opendata.arcgis.com/maps/HUD::low-income-housing-tax-credit-properties-1"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#0F1729] border border-slate-800 rounded-xl p-4 flex items-center gap-3 hover:border-purple-700/50 hover:bg-purple-900/10 transition-colors group"
            >
              <div className="shrink-0 w-9 h-9 rounded-lg bg-purple-900/40 border border-purple-800/40 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200 group-hover:text-purple-300 transition-colors">HUD LIHTC Database</p>
                <p className="text-xs text-slate-500 truncate">All properties since 1987</p>
              </div>
            </a>
          </div>
        </section>

      </div>
    </div>
  );
}
