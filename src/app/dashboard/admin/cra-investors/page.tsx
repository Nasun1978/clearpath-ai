"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

type StateCode = "TX" | "LA" | "MS";
type InvestorType = "National Bank" | "Regional Bank" | "Community Bank" | "Syndicator" | "CDFI";
type ActivityLevel = "Very High" | "High" | "Medium" | "Active";

interface Investor {
  id: string;
  name: string;
  type: InvestorType;
  hq: string;
  states: StateCode[];
  activity: ActivityLevel;
  craFocus: string;
  recentActivity: string;
  contactRole: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website: string;
  notes: string;
}

// ── Curated investor data ─────────────────────────────────────────────────────
// Sources: FFIEC CRA performance evaluations, Novogradac LIHTC investor surveys,
// state HFA award lists (TDHCA, LHC, Mississippi Home Corp), and public CRA
// strategic plans. Contact roles are general — names should be verified before
// outreach.

const INVESTORS: Investor[] = [
  // ── Tier 1: National Banks (very high LIHTC volume, all 3 states) ──
  {
    id: "jpm",
    name: "JPMorgan Chase Community Development Banking",
    type: "National Bank",
    hq: "New York, NY",
    states: ["TX", "LA", "MS"],
    activity: "Very High",
    craFocus: "LIHTC equity, construction debt, perm debt, NMTC",
    recentActivity: "$1B+ annual LIHTC equity nationally; major TX presence post-Chase TX expansion",
    contactRole: "Community Development Banking — Affordable Housing",
    website: "https://www.jpmorgan.com/commercial-banking/community-development-banking",
    notes: "Largest LIHTC investor in U.S. by volume. Direct equity + warehouse lines. Texas regional team based in Houston/Dallas.",
  },
  {
    id: "bofa",
    name: "Bank of America Community Development Banking",
    type: "National Bank",
    hq: "Charlotte, NC",
    states: ["TX", "LA", "MS"],
    activity: "Very High",
    craFocus: "LIHTC equity, predevelopment, construction, perm",
    recentActivity: "$8B+ committed to affordable housing 2024; #1 or #2 LIHTC investor most years",
    contactRole: "CDB Production Officer — Southwest / Southeast region",
    website: "https://about.bankofamerica.com/en/making-an-impact/community-development-banking",
    notes: "Strong TX assessment area (Dallas, Houston, San Antonio). Active in MS through Hancock/regional banks via syndication.",
  },
  {
    id: "wells",
    name: "Wells Fargo Community Lending & Investment",
    type: "National Bank",
    hq: "San Francisco, CA",
    states: ["TX", "LA", "MS"],
    activity: "Very High",
    craFocus: "LIHTC equity (direct + multi-investor funds), construction, perm",
    recentActivity: "Top-3 LIHTC investor; large TX footprint. Funded over $9B in affordable housing 2023.",
    contactRole: "CLI Relationship Manager — Affordable Housing",
    website: "https://www.wellsfargo.com/com/financing/real-estate/community-lending-investment/",
    notes: "Has assessment areas in all three states. Frequent co-investor with Raymond James and NEF.",
  },
  {
    id: "citi",
    name: "Citi Community Capital",
    type: "National Bank",
    hq: "New York, NY",
    states: ["TX", "LA", "MS"],
    activity: "Very High",
    craFocus: "LIHTC equity, construction, perm, bond underwriting",
    recentActivity: "Largest affordable housing lender in the U.S. for 14 consecutive years per Affordable Housing Finance.",
    contactRole: "Originations — South Region",
    website: "https://www.citigroup.com/global/businesses/community-capital",
    notes: "Heavy on tax-exempt bond execution. Houston and Dallas teams. Strong with PHA/RAD conversions.",
  },
  {
    id: "usbank",
    name: "U.S. Bancorp Impact Finance (USBCDC)",
    type: "National Bank",
    hq: "St. Louis, MO",
    states: ["TX", "LA", "MS"],
    activity: "Very High",
    craFocus: "LIHTC equity (direct + proprietary funds), HTC, NMTC, renewable energy",
    recentActivity: "Among top-3 LIHTC equity investors; ~$1.5B annual LIHTC commitments",
    contactRole: "USBCDC Originator — South region",
    website: "https://www.usbank.com/corporate-and-commercial-banking/industry-expertise/affordable-housing-tax-credits.html",
    notes: "Manages $40B+ in tax credit investments. Active TX assessment area; uses regional funds for LA/MS.",
  },
  {
    id: "pnc",
    name: "PNC Real Estate — Tax Credit Capital",
    type: "National Bank",
    hq: "Pittsburgh, PA",
    states: ["TX", "LA", "MS"],
    activity: "High",
    craFocus: "LIHTC equity, construction, perm, agency lending (Fannie/Freddie/HUD)",
    recentActivity: "$1B+ annual LIHTC equity; expanded southern footprint after BBVA USA acquisition (2021)",
    contactRole: "TCC Originator — Texas / Gulf",
    website: "https://www.pnc.com/en/corporate-and-institutional/financing/lending-options/pnc-real-estate.html",
    notes: "BBVA acquisition gave strong TX assessment area. LA/MS via multi-investor funds.",
  },
  {
    id: "truist",
    name: "Truist Community Capital",
    type: "National Bank",
    hq: "Charlotte, NC",
    states: ["TX", "MS"],
    activity: "High",
    craFocus: "LIHTC equity, NMTC, HTC, construction debt",
    recentActivity: "$700M+ annual LIHTC; legacy SunTrust/BB&T southeast strength",
    contactRole: "TCC Senior Originator — Gulf South",
    website: "https://www.truist.com/commercial-corporate-institutional/community-capital",
    notes: "Strong MS assessment area via legacy BB&T branches. Limited LA presence. Active TX expansion.",
  },
  {
    id: "capitalone",
    name: "Capital One Community Finance",
    type: "National Bank",
    hq: "McLean, VA",
    states: ["TX", "LA"],
    activity: "Very High",
    craFocus: "LIHTC equity, construction, perm, agency lending",
    recentActivity: "Major LA presence (legacy Hibernia footprint); top affordable housing lender in LA",
    contactRole: "Originations Officer — Louisiana / Texas",
    website: "https://www.capitalone.com/commercial/industries/affordable-housing/",
    notes: "Strongest LA CRA assessment area of any national bank (from Hibernia acquisition). Big TX presence.",
  },
  {
    id: "regions",
    name: "Regions Affordable Housing",
    type: "Regional Bank",
    hq: "Birmingham, AL",
    states: ["TX", "LA", "MS"],
    activity: "Very High",
    craFocus: "LIHTC equity (direct + multi-investor), construction, perm, agency",
    recentActivity: "Top-10 LIHTC investor; 4-state Gulf assessment area is core CRA territory",
    contactRole: "Regions Affordable Housing Originator — MS/LA/TX",
    website: "https://www.regions.com/commercial-banking/specialty-industries/real-estate-banking/affordable-housing",
    notes: "MS HQ-adjacent (Birmingham AL). Largest CRA exposure in MS of any non-MS-HQ bank. Active LA + East TX.",
  },

  // ── Tier 2: Regional Banks with strong TX/LA/MS CRA footprint ──
  {
    id: "hancockwhitney",
    name: "Hancock Whitney Bank",
    type: "Regional Bank",
    hq: "Gulfport, MS",
    states: ["LA", "MS", "TX"],
    activity: "High",
    craFocus: "LIHTC equity (CRA-driven), construction, perm",
    recentActivity: "Primary LIHTC investor for many MS/LA Gulf Coast deals; Outstanding CRA rating",
    contactRole: "Community Development — Affordable Housing",
    website: "https://www.hancockwhitney.com/business/specialty-services/affordable-housing",
    notes: "MS HQ — required CRA investment in MS. Major LA presence (legacy Whitney). Houston/Beaumont TX coverage.",
  },
  {
    id: "cadence",
    name: "Cadence Bank",
    type: "Regional Bank",
    hq: "Tupelo, MS / Houston, TX",
    states: ["TX", "MS", "LA"],
    activity: "High",
    craFocus: "LIHTC equity, construction, perm",
    recentActivity: "Post-merger BancorpSouth + Cadence (2021) created major MS+TX CRA footprint",
    contactRole: "Community Reinvestment Officer",
    website: "https://cadencebank.com/business/community-development",
    notes: "Dual HQ MS/TX — heavy CRA pressure in both markets. Active in LA via legacy footprint.",
  },
  {
    id: "trustmark",
    name: "Trustmark National Bank",
    type: "Regional Bank",
    hq: "Jackson, MS",
    states: ["MS", "TX"],
    activity: "Medium",
    craFocus: "LIHTC equity, construction, community development lending",
    recentActivity: "Largest MS-headquartered bank; CRA investment heavily concentrated in MS",
    contactRole: "Community Development Officer",
    website: "https://www.trustmark.com/business/business-services/community-development",
    notes: "MS-HQ — primary CRA market is MS. Some TX exposure (Houston). Smaller LIHTC checks ($500K-$3M).",
  },
  {
    id: "origin",
    name: "Origin Bank",
    type: "Regional Bank",
    hq: "Ruston, LA",
    states: ["LA", "TX", "MS"],
    activity: "Medium",
    craFocus: "LIHTC equity, construction, CD loans",
    recentActivity: "Active in LA + East TX (Tyler, Houston) + MS Delta CRA assessment areas",
    contactRole: "Community Development Banker",
    website: "https://www.origin.bank/business/community-development",
    notes: "LA HQ. Strong relationships with LHC. Smaller checks; often co-invests with Hancock Whitney or Regions.",
  },
  {
    id: "bankplus",
    name: "BankPlus",
    type: "Community Bank",
    hq: "Belzoni, MS",
    states: ["MS"],
    activity: "Medium",
    craFocus: "LIHTC equity, construction, MS-only CRA",
    recentActivity: "Largest MS community bank; concentrated LIHTC investment in MS",
    contactRole: "Community Development Lending",
    website: "https://www.bankplus.net",
    notes: "100% MS focus. Smaller checks ($250K-$2M). Often participates in syndicated MS deals.",
  },
  {
    id: "renasant",
    name: "Renasant Bank",
    type: "Regional Bank",
    hq: "Tupelo, MS",
    states: ["MS", "TX"],
    activity: "Medium",
    craFocus: "LIHTC equity, construction, CD loans",
    recentActivity: "MS HQ with growing southeast footprint; active MS LIHTC investor",
    contactRole: "Community Development Officer",
    website: "https://www.renasantbank.com/personal/about-us/community",
    notes: "MS-HQ regional. CRA pressure in MS. Limited TX presence (Dallas).",
  },
  {
    id: "firsthorizon",
    name: "First Horizon Bank",
    type: "Regional Bank",
    hq: "Memphis, TN",
    states: ["TX", "LA", "MS"],
    activity: "High",
    craFocus: "LIHTC equity (post IBERIABANK merger), construction, perm",
    recentActivity: "IBERIABANK merger (2020) gave strong LA + TX footprint",
    contactRole: "Community Reinvestment / CDB",
    website: "https://www.firsthorizon.com/Commercial/Community-Reinvestment",
    notes: "Major LA presence from IBERIABANK. Houston + Dallas TX. North MS coverage.",
  },
  {
    id: "frost",
    name: "Frost Bank (Cullen/Frost Bankers)",
    type: "Regional Bank",
    hq: "San Antonio, TX",
    states: ["TX"],
    activity: "Medium",
    craFocus: "LIHTC equity, construction, CD loans",
    recentActivity: "TX-only bank with statewide CRA assessment area",
    contactRole: "Community Development Officer",
    website: "https://www.frostbank.com/business/specialty-banking/affordable-housing",
    notes: "TX-pure-play. Concentrated CRA investment in TX LIHTC. Often partners with TDHCA-allocated developers.",
  },
  {
    id: "txcap",
    name: "Texas Capital Bank",
    type: "Regional Bank",
    hq: "Dallas, TX",
    states: ["TX"],
    activity: "Medium",
    craFocus: "LIHTC equity, construction lending",
    recentActivity: "Growing affordable housing platform; TX-only CRA focus",
    contactRole: "Real Estate / Community Development",
    website: "https://www.texascapitalbank.com",
    notes: "TX statewide. Larger construction debt focus than equity. Equity check size growing.",
  },
  {
    id: "prosperity",
    name: "Prosperity Bank",
    type: "Regional Bank",
    hq: "Houston, TX",
    states: ["TX"],
    activity: "Medium",
    craFocus: "LIHTC equity, CD loans",
    recentActivity: "Largest TX-HQ bank by deposits; active LIHTC investor in TX assessment areas",
    contactRole: "Community Development Officer",
    website: "https://www.prosperitybankusa.com",
    notes: "TX-only CRA focus. Smaller-to-mid check sizes. Strong Houston/Gulf Coast relationships.",
  },
  {
    id: "comerica",
    name: "Comerica Bank",
    type: "Regional Bank",
    hq: "Dallas, TX",
    states: ["TX"],
    activity: "High",
    craFocus: "LIHTC equity, construction, perm",
    recentActivity: "TX HQ since 2007 relocation; major TX CRA commitment",
    contactRole: "Community Development Banking",
    website: "https://www.comerica.com",
    notes: "Dallas HQ. Concentrated TX CRA. Active equity investor mid-to-large deals.",
  },
  {
    id: "homebank",
    name: "Home Bank",
    type: "Community Bank",
    hq: "Lafayette, LA",
    states: ["LA", "MS"],
    activity: "Active",
    craFocus: "LIHTC equity, construction, CD loans",
    recentActivity: "LA community bank with growing MS footprint; CRA-driven LIHTC participation",
    contactRole: "Community Development Officer",
    website: "https://www.home24bank.com",
    notes: "Smaller checks ($250K-$1.5M). LA-focused. Co-invests with Hancock Whitney + Origin.",
  },
  {
    id: "bxs",
    name: "BancorpSouth (now Cadence)",
    type: "Regional Bank",
    hq: "Tupelo, MS",
    states: ["MS", "LA", "TX"],
    activity: "Medium",
    craFocus: "Merged into Cadence — historical LIHTC presence in MS/LA/TX",
    recentActivity: "See Cadence Bank entry post-2021 merger",
    contactRole: "See Cadence Bank",
    website: "https://cadencebank.com",
    notes: "Legacy entity — all CRA/LIHTC activity now under Cadence brand.",
  },

  // ── Tier 3: LIHTC Syndicators (route bank CRA capital) ──
  {
    id: "rjtcf",
    name: "Raymond James Tax Credit Funds (RJTCF)",
    type: "Syndicator",
    hq: "St. Petersburg, FL",
    states: ["TX", "LA", "MS"],
    activity: "Very High",
    craFocus: "Multi-investor LIHTC funds — places CRA capital from 50+ banks",
    recentActivity: "Top-3 LIHTC syndicator nationally; raised $1.5B+ in 2024",
    contactRole: "Acquisitions — South region",
    website: "https://www.rjtcf.com",
    notes: "Most efficient way for community banks to deploy CRA capital. Strong TDHCA/LHC/MS Home relationships.",
  },
  {
    id: "enterprise",
    name: "Enterprise Community Investment",
    type: "Syndicator",
    hq: "Columbia, MD",
    states: ["TX", "LA", "MS"],
    activity: "Very High",
    craFocus: "LIHTC equity funds, NMTC, predevelopment, mission lending",
    recentActivity: "$2B+ annual LIHTC; mission-driven (nonprofit parent)",
    contactRole: "Acquisitions — South region",
    website: "https://www.enterprisecommunity.org/financing-and-development",
    notes: "Mission-aligned — strong with PHAs, RAD conversions, supportive housing. Active all 3 states.",
  },
  {
    id: "nef",
    name: "National Equity Fund (NEF)",
    type: "Syndicator",
    hq: "Chicago, IL",
    states: ["TX", "LA", "MS"],
    activity: "Very High",
    craFocus: "LIHTC equity funds (LISC affiliate)",
    recentActivity: "$1.2B+ annual LIHTC; LISC mission alignment",
    contactRole: "Acquisitions Officer — South",
    website: "https://www.nefinc.org",
    notes: "LISC-affiliated nonprofit syndicator. Strong CRA fund placement with regional banks.",
  },
  {
    id: "hudson",
    name: "Hudson Housing Capital",
    type: "Syndicator",
    hq: "New York, NY",
    states: ["TX", "LA", "MS"],
    activity: "High",
    craFocus: "Multi-investor + proprietary LIHTC funds",
    recentActivity: "$700M+ annual; active TX deal flow",
    contactRole: "Acquisitions — Texas / Gulf",
    website: "https://www.hudsonhousing.com",
    notes: "Frequent partner with regional banks for CRA-targeted funds.",
  },
  {
    id: "r4",
    name: "R4 Capital",
    type: "Syndicator",
    hq: "New York, NY",
    states: ["TX", "LA", "MS"],
    activity: "High",
    craFocus: "Multi-investor + proprietary LIHTC funds",
    recentActivity: "$700M+ annual LIHTC equity; growing TX presence",
    contactRole: "Originations — South region",
    website: "https://www.r4cap.com",
    notes: "Newer syndicator (founded 2012) with aggressive growth. Active all 3 states.",
  },
  {
    id: "redstone",
    name: "Red Stone Equity Partners",
    type: "Syndicator",
    hq: "Cleveland, OH",
    states: ["TX", "LA", "MS"],
    activity: "High",
    craFocus: "LIHTC equity funds, predevelopment",
    recentActivity: "$600M+ annual; strong TX TDHCA relationship",
    contactRole: "Acquisitions — South region",
    website: "https://www.rsequity.com",
    notes: "Active with TDHCA 9% and 4% deals. CRA-investor placement strength.",
  },
  {
    id: "wnc",
    name: "WNC & Associates",
    type: "Syndicator",
    hq: "Irvine, CA",
    states: ["TX", "LA", "MS"],
    activity: "High",
    craFocus: "LIHTC equity (multi-investor)",
    recentActivity: "$500M+ annual LIHTC; 50-year track record",
    contactRole: "Acquisitions — South region",
    website: "https://www.wncinc.com",
    notes: "Long-tenured syndicator. Mid-size deals. Active in LA/MS small-market deals.",
  },
  {
    id: "boston",
    name: "Boston Capital (now BCP / Boston Financial Investment Mgmt)",
    type: "Syndicator",
    hq: "Boston, MA",
    states: ["TX", "LA", "MS"],
    activity: "Medium",
    craFocus: "LIHTC equity funds",
    recentActivity: "Acquired by ORIX in 2021; rebranded Boston Financial",
    contactRole: "Acquisitions",
    website: "https://www.bostonfinancialinv.com",
    notes: "Post-acquisition — still active but lower volume than peak years.",
  },
  {
    id: "stratford",
    name: "Stratford Capital Group",
    type: "Syndicator",
    hq: "Peabody, MA",
    states: ["TX", "LA", "MS"],
    activity: "Medium",
    craFocus: "LIHTC equity (mid-market focus)",
    recentActivity: "$300M+ annual; specializes in mid-size deals",
    contactRole: "Acquisitions Officer",
    website: "https://www.stratfordcapitalgroup.com",
    notes: "Good fit for sub-$10M equity raises. Active in rural LA/MS deals.",
  },
  {
    id: "alliant",
    name: "Alliant Capital (now Walker & Dunlop)",
    type: "Syndicator",
    hq: "Woodland Hills, CA",
    states: ["TX", "LA", "MS"],
    activity: "High",
    craFocus: "LIHTC equity, agency debt integration",
    recentActivity: "Acquired by Walker & Dunlop 2021; integrated equity + debt platform",
    contactRole: "Originations — South region",
    website: "https://www.walkerdunlop.com",
    notes: "Strength: bundled debt+equity execution. Active TX/LA via W&D platform.",
  },

  // ── Tier 4: CDFIs and specialty lenders ──
  {
    id: "lisc",
    name: "LISC (Local Initiatives Support Corporation)",
    type: "CDFI",
    hq: "New York, NY (Houston + LA offices)",
    states: ["TX", "LA"],
    activity: "High",
    craFocus: "Predevelopment, acquisition, NMTC, LIHTC equity (via NEF)",
    recentActivity: "Houston LISC office active in TX deals; New Orleans LISC active in LA",
    contactRole: "Local LISC Program Officer",
    website: "https://www.lisc.org",
    notes: "Critical predevelopment + acquisition lender. Local TX/LA offices — direct relationships.",
  },
  {
    id: "ldhc",
    name: "Louisiana Housing Corporation (CDFI partner)",
    type: "CDFI",
    hq: "Baton Rouge, LA",
    states: ["LA"],
    activity: "Medium",
    craFocus: "Soft loans, LIHTC allocations, gap financing",
    recentActivity: "State HFA — LIHTC allocator + gap funder",
    contactRole: "Multifamily Programs",
    website: "https://www.lhc.la.gov",
    notes: "Allocator (not investor) but key for LA deal stack. Pairs with bank CRA equity.",
  },
];

const STATE_LABELS: Record<StateCode, string> = {
  TX: "Texas",
  LA: "Louisiana",
  MS: "Mississippi",
};

const TYPE_COLORS: Record<InvestorType, string> = {
  "National Bank":  "bg-blue-900/40 text-blue-300 border-blue-700/50",
  "Regional Bank":  "bg-purple-900/40 text-purple-300 border-purple-700/50",
  "Community Bank": "bg-teal-900/40 text-teal-300 border-teal-700/50",
  "Syndicator":     "bg-amber-900/40 text-amber-300 border-amber-700/50",
  "CDFI":           "bg-emerald-900/40 text-emerald-300 border-emerald-700/50",
};

const ACTIVITY_COLORS: Record<ActivityLevel, string> = {
  "Very High": "text-red-400",
  "High":      "text-orange-400",
  "Medium":    "text-yellow-400",
  "Active":    "text-slate-400",
};

// ── Page ──────────────────────────────────────────────────────────────────────

type StateFilter = "all" | StateCode;
type TypeFilter = "all" | InvestorType;

export default function CRAInvestorsPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => setAuthorized(r.ok))
      .catch(() => setAuthorized(false));
  }, []);

  const filtered = useMemo(() => {
    return INVESTORS.filter((inv) => {
      if (stateFilter !== "all" && !inv.states.includes(stateFilter)) return false;
      if (typeFilter !== "all" && inv.type !== typeFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !inv.name.toLowerCase().includes(q) &&
          !inv.hq.toLowerCase().includes(q) &&
          !inv.notes.toLowerCase().includes(q) &&
          !inv.craFocus.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [stateFilter, typeFilter, search]);

  const counts = useMemo(() => ({
    all: INVESTORS.length,
    TX: INVESTORS.filter((i) => i.states.includes("TX")).length,
    LA: INVESTORS.filter((i) => i.states.includes("LA")).length,
    MS: INVESTORS.filter((i) => i.states.includes("MS")).length,
  }), []);

  if (authorized === null) {
    return <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">Loading…</div>;
  }
  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-400">Access Denied</h1>
          <p className="text-slate-400 text-sm">This page is restricted to authorized RipeSpot admin accounts.</p>
          <Link href="/dashboard" className="inline-block px-4 py-2 bg-slate-800 rounded-lg text-sm hover:bg-slate-700">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-[#080E1A]/90 backdrop-blur-sm sticky top-0 z-20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/admin" className="text-slate-400 hover:text-white text-sm">← Admin</Link>
            <h1 className="text-lg font-bold">
              <span className="text-amber-400">CRA</span> LIHTC Investors
              <span className="text-slate-500 text-sm font-normal ml-2">TX · LA · MS</span>
            </h1>
          </div>
          <div className="text-xs text-slate-500">
            {filtered.length} of {INVESTORS.length} investors
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Intro */}
        <div className="p-4 bg-amber-900/10 border border-amber-700/30 rounded-xl text-sm text-amber-100/80">
          <p className="font-semibold text-amber-300 mb-1">Curated CRA Investor Directory</p>
          <p className="text-amber-100/70 leading-relaxed">
            Financial institutions and LIHTC syndicators with active Community Reinvestment Act (CRA)
            assessment areas in Texas, Louisiana, and Mississippi. Use this list to source equity for
            developments in the LIHTC pipeline. Sourced from FFIEC CRA performance evaluations,
            Novogradac investor surveys, and state HFA award lists.
          </p>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide mr-1">State</span>
            {(["all", "TX", "LA", "MS"] as StateFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStateFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  stateFilter === s
                    ? "bg-amber-500 text-slate-950 border-amber-400"
                    : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                }`}
              >
                {s === "all" ? `All (${counts.all})` : `${STATE_LABELS[s]} (${counts[s]})`}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wide mr-1">Type</span>
            {(["all", "National Bank", "Regional Bank", "Community Bank", "Syndicator", "CDFI"] as TypeFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  typeFilter === t
                    ? "bg-amber-500 text-slate-950 border-amber-400"
                    : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700"
                }`}
              >
                {t === "all" ? "All Types" : t}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, HQ, focus, or notes…"
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-600"
          />
        </div>

        {/* Investor table */}
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Institution</th>
                <th className="text-left px-3 py-3 font-semibold">Type</th>
                <th className="text-left px-3 py-3 font-semibold">HQ</th>
                <th className="text-left px-3 py-3 font-semibold">States</th>
                <th className="text-left px-3 py-3 font-semibold">Activity</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((inv) => (
                <Fragment key={inv.id}>
                  <tr
                    onClick={() => setExpanded(expanded === inv.id ? null : inv.id)}
                    className="hover:bg-slate-900/50 cursor-pointer transition"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-100">{inv.name}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${TYPE_COLORS[inv.type]}`}>
                        {inv.type}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-400 text-xs">{inv.hq}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        {inv.states.map((s) => (
                          <span key={s} className="inline-block px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className={`px-3 py-3 text-xs font-semibold ${ACTIVITY_COLORS[inv.activity]}`}>
                      {inv.activity}
                    </td>
                    <td className="px-3 py-3 text-slate-500 text-xs">
                      {expanded === inv.id ? "▲" : "▼"}
                    </td>
                  </tr>
                  {expanded === inv.id && (
                    <tr className="bg-slate-900/30">
                      <td colSpan={6} className="px-6 py-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-slate-500 uppercase tracking-wide font-semibold mb-1">CRA Focus</p>
                            <p className="text-slate-200">{inv.craFocus}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 uppercase tracking-wide font-semibold mb-1">Recent Activity</p>
                            <p className="text-slate-200">{inv.recentActivity}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 uppercase tracking-wide font-semibold mb-1">Contact Role</p>
                            <p className="text-slate-200">{inv.contactRole}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 uppercase tracking-wide font-semibold mb-1">Website</p>
                            <a
                              href={inv.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-400 hover:text-amber-300 underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {inv.website.replace(/^https?:\/\//, "")}
                            </a>
                          </div>
                        </div>
                        <div>
                          <p className="text-slate-500 uppercase tracking-wide font-semibold mb-1 text-xs">Notes</p>
                          <p className="text-slate-300 text-xs leading-relaxed">{inv.notes}</p>
                        </div>
                        <div className="pt-2 border-t border-slate-800 flex gap-2">
                          <a
                            href={`mailto:?subject=LIHTC%20Equity%20Inquiry%20-%20RipeSpot&body=Hello%2C%0A%0AI'm%20reaching%20out%20regarding%20a%20LIHTC%20equity%20opportunity%20in%20${encodeURIComponent(inv.states.map(s => STATE_LABELS[s]).join("%2C%20"))}.%0A%0A`}
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 rounded text-xs font-semibold text-slate-950"
                          >
                            Draft Outreach Email
                          </a>
                          <a
                            href={inv.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-xs font-semibold text-slate-200"
                          >
                            Visit Website
                          </a>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">No investors match the current filters.</div>
          )}
        </div>

        <p className="text-xs text-slate-600 italic">
          Disclaimer: CRA assessment areas and investment activity change over time. Verify current
          status via FFIEC.gov before outreach. Contact names and emails are not provided here —
          use each institution&apos;s public CRA officer directory or LinkedIn to identify current
          decision-makers.
        </p>
      </main>
    </div>
  );
}
