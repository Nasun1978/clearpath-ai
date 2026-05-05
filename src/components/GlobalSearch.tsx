"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Deal, Project, CompanyDocument } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type ResultKind = "page" | "deal" | "project" | "document";

interface SearchResult {
  id: string;
  kind: ResultKind;
  label: string;
  sublabel?: string;
  href: string;
  badge?: string;
}

// ── Static nav entries ────────────────────────────────────────────────────────

const NAV_ENTRIES: SearchResult[] = [
  { id: "nav-dashboard",        kind: "page", label: "Dashboard",              href: "/dashboard",                       badge: "Overview" },
  { id: "nav-projects",         kind: "page", label: "Projects",               href: "/dashboard/projects",              badge: "Development" },
  { id: "nav-deals",            kind: "page", label: "Deal Pipeline",          href: "/dashboard/deals",                 badge: "Development" },
  { id: "nav-proposals",        kind: "page", label: "Proposals",              href: "/dashboard/proposals",             badge: "Development" },
  { id: "nav-lihtc-closing",    kind: "page", label: "LIHTC Closing",          href: "/dashboard/lihtc-closing",         badge: "Development" },
  { id: "nav-financial",        kind: "page", label: "Financial Analysis",     href: "/dashboard/financial",             badge: "Analysis" },
  { id: "nav-rent-roll",        kind: "page", label: "Rent Roll Analyzer",     href: "/dashboard/rent-roll",             badge: "Analysis" },
  { id: "nav-zoning",           kind: "page", label: "Zoning Lookup",          href: "/dashboard/zoning",                badge: "Analysis" },
  { id: "nav-checklist",        kind: "page", label: "LIHTC Checklist",        href: "/dashboard/checklist",             badge: "Analysis" },
  { id: "nav-pilot",            kind: "page", label: "PILOT Analysis",         href: "/dashboard/pilot-analysis",        badge: "Analysis" },
  { id: "nav-compliance",       kind: "page", label: "HOME Compliance",        href: "/dashboard/compliance",            badge: "Analysis" },
  { id: "nav-geomap",           kind: "page", label: "Geomap",                 href: "/dashboard/geomap",                badge: "Analysis" },
  { id: "nav-tax-incentive",    kind: "page", label: "Tax Incentive Districts",href: "/dashboard/tax-incentive-maps",    badge: "Analysis" },
  { id: "nav-voucher-map",      kind: "page", label: "Voucher & LIHTC Map",    href: "/dashboard/voucher-map",           badge: "Analysis" },
  { id: "nav-marketplace",      kind: "page", label: "Vendor Marketplace",     href: "/marketplace",                     badge: "Marketplace" },
  { id: "nav-documents",        kind: "page", label: "Documents",              href: "/dashboard/documents",             badge: "Marketplace" },
  { id: "nav-billing",          kind: "page", label: "Billing",                href: "/dashboard/billing",               badge: "Account" },
  { id: "nav-about",            kind: "page", label: "About",                  href: "/dashboard/about",                 badge: "Account" },
  { id: "nav-admin",            kind: "page", label: "Admin Panel",            href: "/dashboard/admin",                 badge: "Admin" },
  { id: "nav-lihtc-pipeline",   kind: "page", label: "LIHTC Pipeline",         href: "/dashboard/admin/lihtc-pipeline",  badge: "Admin" },
  { id: "nav-cra-investors",    kind: "page", label: "CRA Investors",          href: "/dashboard/admin/cra-investors",   badge: "Admin" },
];

const DEAL_STAGE_LABELS: Record<string, string> = {
  prospecting:     "Prospecting",
  due_diligence:   "Due Diligence",
  under_contract:  "Under Contract",
  closed:          "Closed",
};

const PROJECT_TYPE_LABELS: Record<string, string> = {
  lihtc_9pct:   "LIHTC 9%",
  lihtc_4pct:   "LIHTC 4%",
  home:         "HOME",
  htf:          "HTF",
  cdbg:         "CDBG",
  mixed_use:    "Mixed Use",
  market_rate:  "Market Rate",
  other:        "Other",
};

const KIND_LABELS: Record<ResultKind, string> = {
  page:     "Pages",
  deal:     "Deals",
  project:  "Projects",
  document: "Documents",
};

const KIND_ORDER: ResultKind[] = ["page", "project", "deal", "document"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function matches(query: string, ...fields: (string | null | undefined)[]): boolean {
  const q = query.toLowerCase();
  return fields.some((f) => f?.toLowerCase().includes(q));
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-teal-500/30 text-teal-200 rounded-sm">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function PageIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  );
}
function DealIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}
function ProjectIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

const KIND_ICON: Record<ResultKind, React.ReactNode> = {
  page:     <PageIcon />,
  deal:     <DealIcon />,
  project:  <ProjectIcon />,
  document: <DocIcon />,
};

const KIND_ICON_BG: Record<ResultKind, string> = {
  page:     "bg-slate-700 text-slate-300",
  deal:     "bg-teal-900/60 text-teal-400",
  project:  "bg-blue-900/60 text-blue-400",
  document: "bg-purple-900/60 text-purple-400",
};

// ── Main component ────────────────────────────────────────────────────────────

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);

  // data cache — fetched once per mount
  const [deals, setDeals] = useState<Deal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  // fetch data when first opened
  useEffect(() => {
    if (!open || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);

    Promise.allSettled([
      fetch("/api/deals").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/documents").then((r) => r.json()),
    ]).then(([d, p, doc]) => {
      if (d.status === "fulfilled" && d.value.deals) setDeals(d.value.deals as Deal[]);
      if (p.status === "fulfilled" && p.value.projects) setProjects(p.value.projects as Project[]);
      if (doc.status === "fulfilled" && doc.value.documents) setDocuments(doc.value.documents as CompanyDocument[]);
      setLoading(false);
    });
  }, [open]);

  // focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // build results
  const results: SearchResult[] = (() => {
    const q = query.trim();

    const pages = q
      ? NAV_ENTRIES.filter((e) => matches(q, e.label, e.badge))
      : NAV_ENTRIES;

    const dealResults: SearchResult[] = (q ? deals.filter((d) => matches(q, d.address, d.stage, d.notes)) : deals)
      .map((d) => ({
        id: `deal-${d.id}`,
        kind: "deal" as ResultKind,
        label: d.address,
        sublabel: DEAL_STAGE_LABELS[d.stage] ?? d.stage,
        href: "/dashboard/deals",
        badge: DEAL_STAGE_LABELS[d.stage],
      }));

    const projectResults: SearchResult[] = (q ? projects.filter((p) => matches(q, p.name, p.address, p.type, p.notes)) : projects)
      .map((p) => ({
        id: `proj-${p.id}`,
        kind: "project" as ResultKind,
        label: p.name,
        sublabel: [PROJECT_TYPE_LABELS[p.type] ?? p.type, p.address].filter(Boolean).join(" · "),
        href: `/dashboard/projects`,
        badge: PROJECT_TYPE_LABELS[p.type],
      }));

    const docResults: SearchResult[] = (q ? documents.filter((d) => matches(q, d.document_name, d.document_type, d.notes)) : documents)
      .map((d) => ({
        id: `doc-${d.id}`,
        kind: "document" as ResultKind,
        label: d.document_name,
        sublabel: d.document_type.replace(/_/g, " "),
        href: "/dashboard/documents",
        badge: d.document_type.replace(/_/g, " "),
      }));

    return [...pages, ...projectResults, ...dealResults, ...docResults];
  })();

  // group results
  const grouped = KIND_ORDER.reduce<Record<string, SearchResult[]>>((acc, kind) => {
    const items = results.filter((r) => r.kind === kind);
    if (items.length) acc[kind] = items;
    return acc;
  }, {});

  const flat = KIND_ORDER.flatMap((k) => grouped[k] ?? []);

  // clamp activeIdx when results change
  useEffect(() => {
    setActiveIdx((i) => Math.min(i, Math.max(flat.length - 1, 0)));
  }, [flat.length]);

  const navigate = useCallback((result: SearchResult) => {
    router.push(result.href);
    onClose();
  }, [router, onClose]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flat[activeIdx]) navigate(flat[activeIdx]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  if (!open) return null;

  const isEmpty = flat.length === 0;
  let absoluteIdx = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Palette */}
      <div className="relative w-full max-w-2xl bg-[#0B1120] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">

        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800">
          <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, projects, deals, documents…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
          />
          {loading && (
            <svg className="w-4 h-4 text-slate-600 shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-slate-700 text-[10px] text-slate-500 font-mono shrink-0">
            esc
          </kbd>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg className="w-8 h-8 text-slate-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-sm text-slate-500">No results for &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            <div className="py-2">
              {KIND_ORDER.map((kind) => {
                const items = grouped[kind];
                if (!items) return null;
                return (
                  <div key={kind}>
                    <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
                      {KIND_LABELS[kind]}
                    </p>
                    {items.map((result) => {
                      const idx = absoluteIdx++;
                      const isActive = idx === activeIdx;
                      return (
                        <button
                          key={result.id}
                          type="button"
                          onMouseEnter={() => setActiveIdx(idx)}
                          onClick={() => navigate(result)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                            isActive ? "bg-teal-900/30" : "hover:bg-slate-800/40"
                          }`}
                        >
                          <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${KIND_ICON_BG[result.kind]}`}>
                            {KIND_ICON[result.kind]}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-medium text-slate-200 truncate">
                              {highlight(result.label, query.trim())}
                            </span>
                            {result.sublabel && (
                              <span className="block text-xs text-slate-500 truncate mt-0.5">
                                {highlight(result.sublabel, query.trim())}
                              </span>
                            )}
                          </span>
                          {isActive && (
                            <kbd className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-slate-700 text-[10px] text-slate-500 font-mono">
                              ↵
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-slate-800 px-4 py-2 flex items-center gap-4">
          <span className="flex items-center gap-1 text-[10px] text-slate-600">
            <kbd className="px-1 py-0.5 rounded border border-slate-700 font-mono">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1 text-[10px] text-slate-600">
            <kbd className="px-1 py-0.5 rounded border border-slate-700 font-mono">↵</kbd>
            open
          </span>
          <span className="flex items-center gap-1 text-[10px] text-slate-600">
            <kbd className="px-1 py-0.5 rounded border border-slate-700 font-mono">esc</kbd>
            close
          </span>
          <span className="ml-auto text-[10px] text-slate-700">
            {flat.length} result{flat.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
