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

interface ChecklistItem {
  id: string;
  label: string;
  key: "inNRHistoricDistrict" | "individuallyListed" | "inDDD" | "inEDD" | "inCulturalDistrict" | "inOZ" | "is50PlusYears" | "isIncomeProducing" | "noRenoStarted";
}

interface EligibilityResult {
  program: string;
  eligible: boolean;
  reason: string;
  accent: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MAP_TABS: MapTab[] = [
  {
    id: "historic-cultural",
    label: "National Register & Cultural Districts",
    url: "https://www.crt.state.la.us/cultural-development/historic-preservation/tax-incentives/",
    description:
      "Louisiana Division of Historic Preservation map showing National Register Historic Districts, individually listed properties, and Cultural Districts. Properties in these areas may qualify for state and federal historic tax credits.",
  },
  {
    id: "nr-database",
    label: "National Register Database",
    url: "https://www.crt.state.la.us/cultural-development/historic-preservation/national-register/database/index",
    description:
      "Search the Louisiana National Register Database for individually listed properties and historic districts. Over 1,300 listings statewide.",
  },
  {
    id: "nola-historic",
    label: "NOLA Historic Districts",
    url: "https://data.nola.gov/dataset/Historic-Districts/9mpk-pnuh",
    description:
      "New Orleans historic district boundaries. Properties within these districts may qualify for RTA, state historic tax credits, and federal historic tax credits.",
  },
  {
    id: "opportunity-zones",
    label: "Opportunity Zones",
    url: "https://opportunityzones.hud.gov/resources/map",
    description:
      "HUD Opportunity Zone map. Properties in Opportunity Zones also qualify for the Restoration Tax Abatement program.",
  },
];

const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: "q1", label: "Is the property in a National Register Historic District?", key: "inNRHistoricDistrict" },
  { id: "q2", label: "Is the property individually listed on the National Register?", key: "individuallyListed" },
  { id: "q3", label: "Is the property in a Downtown Development District?", key: "inDDD" },
  { id: "q4", label: "Is the property in an Economic Development District?", key: "inEDD" },
  { id: "q5", label: "Is the property in a Cultural District?", key: "inCulturalDistrict" },
  { id: "q6", label: "Is the property in an Opportunity Zone?", key: "inOZ" },
  { id: "q7", label: "Is the property 50+ years old?", key: "is50PlusYears" },
  { id: "q8", label: "Is this an income-producing property?", key: "isIncomeProducing" },
  { id: "q9", label: "Has renovation NOT yet begun?", key: "noRenoStarted" },
];

type ChecklistState = Record<ChecklistItem["key"], boolean | null>;

const INITIAL_STATE: ChecklistState = {
  inNRHistoricDistrict: null,
  individuallyListed: null,
  inDDD: null,
  inEDD: null,
  inCulturalDistrict: null,
  inOZ: null,
  is50PlusYears: null,
  isIncomeProducing: null,
  noRenoStarted: null,
};

// ── Eligibility logic ─────────────────────────────────────────────────────────

function computeEligibility(s: ChecklistState): EligibilityResult[] {
  const answered = Object.values(s).every((v) => v !== null);
  if (!answered) return [];

  const inHistoricArea = s.inNRHistoricDistrict || s.individuallyListed || s.inCulturalDistrict;
  const inRTAArea = s.inNRHistoricDistrict || s.inDDD || s.inEDD || s.inOZ;

  // RTA
  const rtaEligible = !!(inRTAArea && s.noRenoStarted);
  const rtaReason = !inRTAArea
    ? "Property must be in a Historic District, DDD, EDD, or Opportunity Zone."
    : !s.noRenoStarted
    ? "Advance Notification must be filed BEFORE construction begins."
    : "Property appears eligible. File Advance Notification on LED FastLane before starting construction.";

  // Federal 20% HTC
  const fedEligible = !!((s.inNRHistoricDistrict || s.individuallyListed) && s.isIncomeProducing && s.is50PlusYears);
  const fedReason = !(s.inNRHistoricDistrict || s.individuallyListed)
    ? "Property must be listed on or in a National Register Historic District."
    : !s.isIncomeProducing
    ? "Federal credit is only available for income-producing properties."
    : !s.is50PlusYears
    ? "Property must be 50+ years old."
    : "Property appears eligible for the federal 20% Historic Tax Credit.";

  // State 25% HTC (standard)
  const stateEligible = !!(inHistoricArea && s.is50PlusYears);
  const stateReason = !inHistoricArea
    ? "Property must be in a National Register District, individually listed, or in a Cultural District."
    : !s.is50PlusYears
    ? "Property must be 50+ years old."
    : "Property appears eligible for the Louisiana 25% Historic Tax Credit (program sunsets Dec 31, 2028).";

  // Rural 35% HTC — requires Cultural District AND outside metro (we approximate with Cultural District as proxy)
  // Note: actual rural determination is geographic; we flag it as "may qualify" if in Cultural District
  const ruralEligible = !!(s.inCulturalDistrict && s.is50PlusYears);
  const ruralReason = !s.inCulturalDistrict
    ? "Rural 35% credit applies in Cultural Districts outside major metro areas."
    : !s.is50PlusYears
    ? "Property must be 50+ years old."
    : "Property may qualify for the 35% rural rate — confirm location is outside a major metropolitan area with LDHP.";

  return [
    {
      program: "Restoration Tax Abatement (RTA)",
      eligible: rtaEligible,
      reason: rtaReason,
      accent: "teal",
    },
    {
      program: "Federal Historic Tax Credit (20%)",
      eligible: fedEligible,
      reason: fedReason,
      accent: "blue",
    },
    {
      program: "State Historic Tax Credit (25%)",
      eligible: stateEligible,
      reason: stateReason,
      accent: "emerald",
    },
    {
      program: "State Rural Historic Tax Credit (35%)",
      eligible: ruralEligible,
      reason: ruralReason,
      accent: "amber",
    },
  ];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function YesNoToggle({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-3 py-1 rounded-l-lg text-xs font-semibold border transition-colors ${
          value === true
            ? "bg-teal-700 text-white border-teal-600"
            : "bg-slate-800 text-slate-400 border-slate-700 hover:border-teal-700 hover:text-teal-300"
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-3 py-1 rounded-r-lg text-xs font-semibold border transition-colors ${
          value === false
            ? "bg-slate-600 text-white border-slate-500"
            : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600 hover:text-slate-300"
        }`}
      >
        No
      </button>
    </div>
  );
}

function ResultCard({ result }: { result: EligibilityResult }) {
  const accentMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    teal:    { bg: "bg-teal-900/20",    border: "border-teal-800/50",    text: "text-teal-300",    badge: "bg-teal-800/50 text-teal-300 border-teal-700/50" },
    blue:    { bg: "bg-blue-900/20",    border: "border-blue-800/50",    text: "text-blue-300",    badge: "bg-blue-800/50 text-blue-300 border-blue-700/50" },
    emerald: { bg: "bg-emerald-900/20", border: "border-emerald-800/50", text: "text-emerald-300", badge: "bg-emerald-800/50 text-emerald-300 border-emerald-700/50" },
    amber:   { bg: "bg-amber-900/20",   border: "border-amber-800/50",   text: "text-amber-300",   badge: "bg-amber-800/50 text-amber-300 border-amber-700/50" },
  };
  const a = accentMap[result.accent] ?? accentMap.teal;

  return (
    <div className={`rounded-xl border p-4 ${result.eligible ? `${a.bg} ${a.border}` : "bg-slate-900/40 border-slate-800"}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className={`text-sm font-semibold ${result.eligible ? a.text : "text-slate-400"}`}>
          {result.program}
        </h4>
        <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
          result.eligible
            ? a.badge
            : "bg-slate-800 text-slate-500 border-slate-700"
        }`}>
          {result.eligible ? "MAY QUALIFY" : "UNLIKELY"}
        </span>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{result.reason}</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TaxIncentiveMapPage() {
  const [activeTab, setActiveTab] = useState(MAP_TABS[0].id);
  const [iframeError, setIframeError] = useState<Record<string, boolean>>({});
  const [checklist, setChecklist] = useState<ChecklistState>(INITIAL_STATE);

  const activeMap = MAP_TABS.find((t) => t.id === activeTab) ?? MAP_TABS[0];
  const eligibilityResults = computeEligibility(checklist);
  const answeredCount = Object.values(checklist).filter((v) => v !== null).length;
  const totalQuestions = CHECKLIST_ITEMS.length;

  function setAnswer(key: ChecklistItem["key"], value: boolean) {
    setChecklist((prev) => ({ ...prev, [key]: value }));
  }

  function resetChecklist() {
    setChecklist(INITIAL_STATE);
  }

  const qualifyingCount = eligibilityResults.filter((r) => r.eligible).length;

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
            <h1 className="text-lg font-bold text-white">Louisiana Tax Incentive Districts</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Identify properties eligible for the Restoration Tax Abatement and Historic Tax Credit programs
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">

        {/* ── Program Overview ── */}
        <section>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Program Overview</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* RTA Card */}
            <div className="bg-[#0F1729] border border-teal-800/40 rounded-2xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="shrink-0 w-9 h-9 rounded-xl bg-teal-900/50 border border-teal-700/40 flex items-center justify-center">
                  <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-teal-300">Restoration Tax Abatement (RTA)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Louisiana Economic Development</p>
                </div>
              </div>
              <ul className="space-y-2.5 mb-5">
                {[
                  "Up to 10-year property tax abatement on improvements",
                  "5-year contract with 5-year renewal option",
                  "Available in Historic Districts, Downtown Development Districts, Economic Development Districts, and Opportunity Zones",
                  "Administered by Louisiana Economic Development",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <svg className="w-4 h-4 text-teal-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="p-3 bg-amber-900/20 border border-amber-700/30 rounded-xl mb-4">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-xs text-amber-300 leading-relaxed">
                    <span className="font-bold">File BEFORE construction begins.</span>{" "}
                    Submit Advance Notification + $250 fee on LED FastLane prior to starting any renovation work.
                  </p>
                </div>
              </div>
              <a
                href="tel:2253424710"
                className="text-xs text-slate-500 hover:text-teal-400 transition-colors"
              >
                Louisiana Economic Development · (225) 342-4710
              </a>
            </div>

            {/* HTC Card */}
            <div className="bg-[#0F1729] border border-emerald-800/40 rounded-2xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="shrink-0 w-9 h-9 rounded-xl bg-emerald-900/50 border border-emerald-700/40 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                      d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-emerald-300">Historic Tax Credits</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Federal & Louisiana State Programs</p>
                </div>
              </div>
              <div className="space-y-3 mb-5">
                <div className="p-3 bg-blue-900/20 border border-blue-800/30 rounded-xl">
                  <p className="text-xs font-bold text-blue-300 mb-1">Federal — 20% Credit</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    For National Register listed buildings used as income-producing property. Must meet the Secretary of the Interior's Standards for Rehabilitation.
                  </p>
                </div>
                <div className="p-3 bg-emerald-900/20 border border-emerald-800/30 rounded-xl">
                  <p className="text-xs font-bold text-emerald-300 mb-1">State — 25% Credit (35% in rural areas)</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    For National Register or Cultural District buildings. The 35% rate applies in areas outside major metropolitan areas.{" "}
                    <span className="text-amber-400 font-semibold">Program sunsets December 31, 2028.</span>
                  </p>
                </div>
              </div>
              <ul className="space-y-2 mb-4">
                {[
                  "Must meet Secretary of Interior's Standards for Rehabilitation",
                  "Administered by Louisiana Division of Historic Preservation",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <svg className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="tel:2253428200"
                className="text-xs text-slate-500 hover:text-emerald-400 transition-colors"
              >
                Louisiana Division of Historic Preservation · (225) 342-8200
              </a>
            </div>
          </div>
        </section>

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

            {/* Description */}
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
            <div className="relative h-[520px] bg-slate-900">
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

        {/* ── Eligibility Checklist ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Eligibility Checklist</h2>
              <p className="text-xs text-slate-600 mt-1">
                Answer all {totalQuestions} questions to see which programs this property may qualify for.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {answeredCount > 0 && (
                <span className="text-xs text-slate-500">
                  {answeredCount}/{totalQuestions} answered
                </span>
              )}
              <button
                onClick={resetChecklist}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300 border border-slate-700 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Questions */}
            <div className="bg-[#0F1729] border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-800 bg-[#080E1A]/60">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Property Questions</p>
              </div>
              <div className="divide-y divide-slate-800/60">
                {CHECKLIST_ITEMS.map((item, i) => (
                  <div
                    key={item.id}
                    className={`px-5 py-4 flex items-center gap-4 transition-colors ${
                      checklist[item.key] === true
                        ? "bg-teal-900/10"
                        : checklist[item.key] === false
                        ? "bg-slate-900/30"
                        : ""
                    }`}
                  >
                    <span className="shrink-0 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-500 flex items-center justify-center">
                      {i + 1}
                    </span>
                    <p className="flex-1 text-sm text-slate-200 leading-snug">{item.label}</p>
                    <YesNoToggle
                      value={checklist[item.key]}
                      onChange={(v) => setAnswer(item.key, v)}
                    />
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="px-5 py-3 border-t border-slate-800 bg-[#080E1A]/40">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-600 to-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {answeredCount}/{totalQuestions}
                  </span>
                </div>
              </div>
            </div>

            {/* Results */}
            <div>
              {eligibilityResults.length === 0 ? (
                <div className="bg-[#0F1729] border border-slate-800 rounded-2xl h-full flex flex-col items-center justify-center px-6 py-12 text-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-400">Answer all questions to see results</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {answeredCount === 0
                      ? "Use the Yes/No toggles to assess this property."
                      : `${totalQuestions - answeredCount} question${totalQuestions - answeredCount !== 1 ? "s" : ""} remaining.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Summary banner */}
                  <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                    qualifyingCount > 0
                      ? "bg-amber-900/20 border-amber-700/40"
                      : "bg-slate-800/60 border-slate-700"
                  }`}>
                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                      qualifyingCount > 0 ? "bg-amber-900/50 border border-amber-700/50" : "bg-slate-700 border border-slate-600"
                    }`}>
                      <svg className={`w-5 h-5 ${qualifyingCount > 0 ? "text-amber-400" : "text-slate-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${qualifyingCount > 0 ? "text-amber-300" : "text-slate-400"}`}>
                        {qualifyingCount > 0
                          ? `This property may qualify for ${qualifyingCount} program${qualifyingCount !== 1 ? "s" : ""}`
                          : "This property does not appear to qualify for any programs"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {qualifyingCount > 0
                          ? "Results are preliminary — consult LED and LDHP to confirm eligibility."
                          : "Review the district maps above to verify your location answers."}
                      </p>
                    </div>
                  </div>

                  {/* Individual results */}
                  {eligibilityResults.map((result) => (
                    <ResultCard key={result.program} result={result} />
                  ))}

                  {/* Disclaimer */}
                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <p className="text-[10px] text-slate-600 leading-relaxed">
                      <span className="font-semibold text-slate-500">Disclaimer:</span>{" "}
                      This checklist provides a preliminary eligibility assessment only and does not constitute legal or tax advice. Eligibility determinations are made by Louisiana Economic Development (RTA) and the Louisiana Division of Historic Preservation (HTC). Always consult these agencies and a qualified tax professional before relying on this analysis.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Quick Reference ── */}
        <section>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Quick Reference</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0F1729] border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wide mb-3">RTA Key Steps</h4>
              <ol className="space-y-2">
                {[
                  "Confirm property is in an eligible district",
                  "File Advance Notification on LED FastLane",
                  "Pay $250 filing fee",
                  "Receive approval BEFORE starting construction",
                  "Complete renovation within 5-year contract",
                  "Apply for renewal if needed",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="shrink-0 font-bold text-teal-600 mt-0.5">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <div className="bg-[#0F1729] border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wide mb-3">HTC Key Steps</h4>
              <ol className="space-y-2">
                {[
                  "Confirm listing on National Register or Cultural District",
                  "Submit Part 1 application (certification of significance)",
                  "Submit Part 2 (description of proposed work)",
                  "Obtain LDHP approval before construction",
                  "Complete qualified rehabilitation expenditures",
                  "Submit Part 3 (request for certification of completed work)",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="shrink-0 font-bold text-emerald-600 mt-0.5">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <div className="bg-[#0F1729] border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Key Contacts</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-white mb-0.5">Louisiana Economic Development</p>
                  <p className="text-xs text-slate-500">Restoration Tax Abatement Program</p>
                  <a href="tel:2253424710" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">(225) 342-4710</a>
                </div>
                <div>
                  <p className="text-xs font-semibold text-white mb-0.5">LA Division of Historic Preservation</p>
                  <p className="text-xs text-slate-500">State & Federal Historic Tax Credits</p>
                  <a href="tel:2253428200" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">(225) 342-8200</a>
                </div>
                <div>
                  <p className="text-xs font-semibold text-white mb-0.5">LED FastLane Portal</p>
                  <p className="text-xs text-slate-500">RTA online application system</p>
                  <a
                    href="https://fastlaneprod.la.gov"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    fastlaneprod.la.gov →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
