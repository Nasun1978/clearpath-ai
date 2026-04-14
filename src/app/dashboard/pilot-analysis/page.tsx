"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { formatCurrency } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PILOTMetrics {
  projectName:   string | null;
  projectLocation: string | null;

  // Agency Benefits Analysis — 10-year totals
  adjRentBenefit:         number | null;  // rent discount vs market
  originationFee:         number | null;  // Agency origination fee (yr 1)
  pilotPayments:          number | null;  // 10-yr PILOT total
  capitalEventsShare:     number | null;  // backend equity share to Agency
  annualComplianceFees:   number | null;  // asset/compliance fee 10-yr
  totalDirectBenefits:    number | null;  // subtotal of direct items
  totalPublicBenefit:     number | null;  // incl affordability savings
  totalPropertyTaxSavings: number | null;
  publicPrivateDiff:      number | null;  // positive = public > private
  publicPrivatePct:       number | null;  // as decimal, e.g. 0.91
  totalUnits:             number | null;

  // Sources & Uses
  totalProjectCost: number | null;
  loanAmount:       number | null;
  equityAmount:     number | null;

  // P&L
  totalIncome:           number | null;
  totalExpenses:         number | null;
  netOperatingIncome:    number | null;

  // Cash Flow + Debt
  dscr: number | null;

  // Year-by-year PILOT payments (Benefits Analysis, 10 years)
  pilotByYear: number[];
}

// ── Sheet helpers ─────────────────────────────────────────────────────────────

type Row = (string | number | boolean | null)[];
type Rows = Row[];

function readSheet(wb: XLSX.WorkBook, candidates: string[]): Rows | null {
  for (const name of candidates) {
    if (wb.Sheets[name]) {
      return XLSX.utils.sheet_to_json<Row>(wb.Sheets[name], { header: 1, defval: null });
    }
  }
  // fuzzy match
  for (const name of candidates) {
    const lc = name.toLowerCase();
    const key = wb.SheetNames.find((k) => k.toLowerCase().includes(lc));
    if (key) return XLSX.utils.sheet_to_json<Row>(wb.Sheets[key], { header: 1, defval: null });
  }
  return null;
}

// Find first row whose ANY cell contains the search string (case-insensitive)
function findRow(rows: Rows, label: string): number {
  const lc = label.toLowerCase();
  return rows.findIndex((row) =>
    row.some((c) => typeof c === "string" && c.trim().toLowerCase().includes(lc))
  );
}

// Value at a specific column index in a row
function col(row: Row, idx: number): number | null {
  const v = row?.[idx];
  return typeof v === "number" && isFinite(v) ? v : null;
}

// First numeric ≥ minAbs in row
function firstNum(row: Row, minAbs = 0): number | null {
  for (const c of row) {
    if (typeof c === "number" && isFinite(c) && Math.abs(c) >= minAbs && c !== 0) return c;
  }
  return null;
}

// Largest absolute value ≥ minAbs in row (picks aggregate totals when per-unit/% follow)
function maxNum(row: Row, minAbs = 1): number | null {
  let best: number | null = null;
  for (const c of row) {
    if (typeof c === "number" && isFinite(c) && Math.abs(c) >= minAbs) {
      if (best === null || Math.abs(c) > Math.abs(best)) best = c;
    }
  }
  return best;
}

// ── Parser ────────────────────────────────────────────────────────────────────

function parse(wb: XLSX.WorkBook): PILOTMetrics {
  const m: PILOTMetrics = {
    projectName: null, projectLocation: null,
    adjRentBenefit: null, originationFee: null, pilotPayments: null,
    capitalEventsShare: null, annualComplianceFees: null,
    totalDirectBenefits: null, totalPublicBenefit: null,
    totalPropertyTaxSavings: null, publicPrivateDiff: null,
    publicPrivatePct: null, totalUnits: null,
    totalProjectCost: null, loanAmount: null, equityAmount: null,
    totalIncome: null, totalExpenses: null, netOperatingIncome: null,
    dscr: null, pilotByYear: [],
  };

  // ── Agency Benefits Analysis ──────────────────────────────────────────────
  // Layout (col letters → 0-based index):
  //   A(0) = label  C(2) = rate/yr1  D(3) = description  F(5) = item total
  //   G(6) = /unit  H(7) = %age      I(8) = summary totals
  const agencySheet = readSheet(wb, ["HHA Benefits Analysis", "Agency Benefits Analysis", "Municipality Benefits Analysis"]);
  if (agencySheet) {
    // Project metadata (rows 0–2)
    const nameStr = agencySheet[0]?.find((c) => typeof c === "string" && c.trim().length > 2);
    if (typeof nameStr === "string") m.projectName = nameStr.trim();
    const locStr  = agencySheet[1]?.find((c) => typeof c === "string" && c.trim().length > 2);
    if (typeof locStr  === "string") m.projectLocation = locStr.trim();

    // Adj Rent — col I (idx 8) holds the 10-yr summary
    const adjRentRi = findRow(agencySheet, "adj rent");
    if (adjRentRi >= 0) m.adjRentBenefit = col(agencySheet[adjRentRi], 8) ?? maxNum(agencySheet[adjRentRi], 1000);

    // Origination Fee — col F (idx 5)
    const origRi = findRow(agencySheet, "origination fee");
    if (origRi >= 0) m.originationFee = col(agencySheet[origRi], 5) ?? maxNum(agencySheet[origRi], 100);

    // PILOT — label "PILOT Fee" lives in col D; findRow picks the row because it scans all cells
    const pilotRi = findRow(agencySheet, "pilot fee");
    if (pilotRi >= 0) m.pilotPayments = col(agencySheet[pilotRi], 5) ?? maxNum(agencySheet[pilotRi], 100);

    // Capital Events — col F (idx 5)
    const capRi = findRow(agencySheet, "capital event");
    if (capRi >= 0) m.capitalEventsShare = col(agencySheet[capRi], 5) ?? maxNum(agencySheet[capRi], 100);

    // Annual Compliance / Asset & Compliance — col F (idx 5)
    const compRi = findRow(agencySheet, "compliance fee") >= 0
      ? findRow(agencySheet, "compliance fee")
      : findRow(agencySheet, "asset & compliance");
    if (compRi >= 0) m.annualComplianceFees = col(agencySheet[compRi], 5) ?? maxNum(agencySheet[compRi], 100);

    // Total Direct Benefits — col I (idx 8)
    const tdbRi = findRow(agencySheet, "total direct");
    if (tdbRi >= 0) m.totalDirectBenefits = col(agencySheet[tdbRi], 8) ?? maxNum(agencySheet[tdbRi], 1000);

    // Total Public Benefit — col I (idx 8)
    const tpbRi = findRow(agencySheet, "total public benefit");
    if (tpbRi >= 0) m.totalPublicBenefit = col(agencySheet[tpbRi], 8) ?? maxNum(agencySheet[tpbRi], 1000);

    // Total Property Tax Savings — col I (idx 8)
    const taxRi = findRow(agencySheet, "total est property tax");
    if (taxRi >= 0) m.totalPropertyTaxSavings = col(agencySheet[taxRi], 8) ?? maxNum(agencySheet[taxRi], 1000);

    // Public vs Private Difference — col I (can be negative)
    const diffRi = findRow(agencySheet, "difference");
    if (diffRi >= 0) m.publicPrivateDiff = col(agencySheet[diffRi], 8) ?? maxNum(agencySheet[diffRi], 1);

    // Public/Private Percentage — col I, value is 0–1
    const pctRi = findRow(agencySheet, "percentage");
    if (pctRi >= 0) {
      const v = col(agencySheet[pctRi], 8) ?? firstNum(agencySheet[pctRi], 0);
      if (v !== null && Math.abs(v) <= 1) m.publicPrivatePct = v;
    }

    // Number of Units — col I (idx 8)
    const unitsRi = findRow(agencySheet, "number of units");
    if (unitsRi >= 0) m.totalUnits = col(agencySheet[unitsRi], 8) ?? firstNum(agencySheet[unitsRi], 1);
  }

  // ── Benefits Analysis — year-by-year PILOT payments ──────────────────────
  // Cols C–L (idx 2–11) = years 1–10; col O (idx 14) = 10-yr total
  const benef = readSheet(wb, ["Benefits Analysis"]);
  if (benef) {
    const pilotRi = findRow(benef, "pilot fee");
    if (pilotRi >= 0) {
      const years: number[] = [];
      for (let y = 0; y < 10; y++) {
        const v = col(benef[pilotRi], y + 2);
        years.push(v ?? 0);
      }
      if (years.some((v) => v !== 0)) m.pilotByYear = years;

      // Prefer the 10-yr total from col O over the Agency sheet value
      const total = col(benef[pilotRi], 14) ?? maxNum(benef[pilotRi], 1000);
      if (total) m.pilotPayments = total;
    }

    // Back-fill any missing origination fee from row here
    if (!m.originationFee) {
      const origRi = findRow(benef, "origination fee");
      if (origRi >= 0) m.originationFee = col(benef[origRi], 14) ?? maxNum(benef[origRi], 100);
    }
  }

  // ── Sources & Uses ────────────────────────────────────────────────────────
  // Uses col G (idx 6) for dollar totals; col E (idx 4) for unit count
  const su = readSheet(wb, ["SOURCES and USES of FUNDS", "Sources and Uses"]);
  if (su) {
    // "Project Cost + Agency/HHA Acquisition Fee" = true TDC incl all closing costs
    const tdcRi = findRow(su, "project cost + hha");
    if (tdcRi >= 0) m.totalProjectCost = col(su[tdcRi], 6) ?? maxNum(su[tdcRi], 1000);
    // fallback to "total project cost" line
    if (!m.totalProjectCost) {
      const ri = findRow(su, "total project cost");
      if (ri >= 0) m.totalProjectCost = col(su[ri], 6) ?? maxNum(su[ri], 1000);
    }

    const loanRi = findRow(su, "loan");
    if (loanRi >= 0) m.loanAmount = col(su[loanRi], 6) ?? maxNum(su[loanRi], 1000);

    const equityRi = findRow(su, "equity");
    if (equityRi >= 0) m.equityAmount = col(su[equityRi], 6) ?? maxNum(su[equityRi], 1000);

    if (!m.totalUnits) {
      const unitsRi = findRow(su, "number of units");
      if (unitsRi >= 0) m.totalUnits = col(su[unitsRi], 4) ?? firstNum(su[unitsRi], 1);
    }
  }

  // ── P&L ──────────────────────────────────────────────────────────────────
  // Dollar values are in col D (idx 3)
  const pl = readSheet(wb, ["P&L", "P & L", "Profit & Loss"]);
  if (pl) {
    const incomeRi = findRow(pl, "total income");
    if (incomeRi >= 0) m.totalIncome = col(pl[incomeRi], 3) ?? firstNum(pl[incomeRi], 100);

    const expRi = findRow(pl, "total expenses");
    if (expRi >= 0) m.totalExpenses = col(pl[expRi], 3) ?? firstNum(pl[expRi], 100);

    const noiRi = findRow(pl, "net operating income");
    if (noiRi >= 0) m.netOperatingIncome = col(pl[noiRi], 3) ?? firstNum(pl[noiRi], 1);

    if (!m.totalUnits) {
      const unitsRi = findRow(pl, "number of units");
      if (unitsRi >= 0) m.totalUnits = col(pl[unitsRi], 3) ?? firstNum(pl[unitsRi], 1);
    }
  }

  // ── Cash Flow + Debt ──────────────────────────────────────────────────────
  // DSCR is in col D (idx 3); label = "Debt Service Coverage (P+I)"
  const cf = readSheet(wb, ["Cash Flow + Debt", "Cash Flow"]);
  if (cf) {
    const dscrRi = findRow(cf, "debt service coverage");
    if (dscrRi >= 0) {
      const v = col(cf[dscrRi], 3) ?? firstNum(cf[dscrRi], 0);
      if (v !== null && v > 0 && v < 20) m.dscr = v;
    }
    // Back-fill loan if S&U didn't have it
    if (!m.loanAmount) {
      const loanRi = findRow(cf, "loan amount");
      if (loanRi >= 0) m.loanAmount = col(cf[loanRi], 3) ?? firstNum(cf[loanRi], 1000);
    }
  }

  return m;
}

// ── Formatting helpers ────────────────────────────────────────────────────────

function fmtCur(v: number | null): string {
  if (v === null) return "—";
  return formatCurrency(Math.abs(v));
}

function fmtPct(v: number | null): string {
  if (v === null) return "—";
  return `${(Math.abs(v) * 100).toFixed(1)}%`;
}

function fmtNum(v: number | null, decimals = 2): string {
  if (v === null) return "—";
  return v.toFixed(decimals);
}

// ── Sub-components ────────────────────────────────────────────────────────────

type Status = "good" | "warn" | "bad" | "neutral" | "purple";

function Metric({ label, value, sub, status = "neutral" }: {
  label: string; value: string; sub?: string; status?: Status;
}) {
  const col =
    status === "good"   ? "text-emerald-400" :
    status === "warn"   ? "text-amber-400" :
    status === "bad"    ? "text-red-400" :
    status === "purple" ? "text-purple-300" :
                          "text-white";
  const border =
    status === "purple" ? "border-purple-800/50" : "border-slate-800";
  return (
    <div className={`bg-[#0F1729] border ${border} rounded-xl p-5`}>
      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold font-serif ${col}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function SectionHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-6 h-6 rounded bg-purple-900/40 border border-purple-700/40 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">{title}</h3>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PILOTAnalysisPage() {
  const [metrics, setMetrics] = useState<PILOTMetrics | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing]   = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setParsing(true);
    setParseError(null);
    setMetrics(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb   = XLSX.read(data, { type: "array" });
        setMetrics(parse(wb));
        setFileName(file.name);
      } catch (err) {
        setParseError(err instanceof Error ? err.message : "Failed to parse file");
      } finally {
        setParsing(false);
      }
    };
    reader.onerror = () => { setParseError("Failed to read file"); setParsing(false); };
    reader.readAsArrayBuffer(file);
  }

  const m = metrics;
  const hasResults = m !== null;

  // Determine public/private ratio status
  const diffStatus: Status =
    m == null || m.publicPrivateDiff === null ? "neutral" :
    m.publicPrivateDiff >= 0 ? "good" : "warn";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#080E1A]/90 backdrop-blur-sm sticky top-0 z-20 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm">Back</Link>
            <h1 className="text-lg font-bold">
              <span className="text-purple-400">PILOT</span> Public Benefit Analysis
            </h1>
            <span className="text-xs text-slate-500 hidden sm:inline">Government Customer Tool</span>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-purple-500 border border-purple-900/50 bg-purple-950/30 px-2 py-0.5 rounded font-semibold">
            Gov
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* Context banner */}
        <div className="bg-purple-950/20 border border-purple-800/30 rounded-2xl px-6 py-5 flex gap-4">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-700/40 flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-purple-200 mb-1">
              Evaluating a PILOT (Payment In Lieu of Taxes) Request
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              For housing authority and municipal finance staff reviewing PILOT agreements.
              Upload the developer&apos;s completed workbook to instantly surface tax impact,
              affordability commitments, agency income streams, and the public-vs-private benefit ratio.
              Parsing runs entirely in your browser — no data leaves your device.
            </p>
          </div>
        </div>

        {/* Upload */}
        <section className="bg-[#0F1729] border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-bold text-white">Upload Completed Workbook</h2>
          </div>
          <div
            className="border-2 border-dashed border-slate-700 rounded-xl p-10 text-center cursor-pointer hover:border-purple-700/60 transition-colors flex flex-col items-center justify-center gap-2"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xlsm,.xls"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
            />
            {parsing ? (
              <p className="text-slate-400 text-sm">Parsing workbook…</p>
            ) : fileName ? (
              <>
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-purple-300 text-sm font-semibold">{fileName}</p>
                <p className="text-slate-500 text-xs">Click or drop to replace</p>
              </>
            ) : (
              <>
                <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-slate-400 text-sm">Drop .xlsm / .xlsx here</p>
                <p className="text-slate-600 text-xs">or click to browse</p>
              </>
            )}
          </div>
          {parseError && (
            <p className="mt-3 text-xs text-red-400 bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-2">
              {parseError}
            </p>
          )}
        </section>

        {/* ── Results ─────────────────────────────────────────────────────── */}
        {hasResults && m && (
          <div className="space-y-8">

            {/* Project identity */}
            {(m.projectName || m.projectLocation) && (
              <div className="border-l-2 border-purple-700 pl-4">
                {m.projectName && <p className="text-lg font-bold font-serif text-white">{m.projectName}</p>}
                {m.projectLocation && <p className="text-sm text-slate-400">{m.projectLocation}</p>}
              </div>
            )}

            {/* Headline metrics */}
            <section>
              <SectionHeader
                title="Public Benefit Summary (10-Year)"
                icon={<svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Metric
                  label="Total Public Benefit"
                  value={fmtCur(m.totalPublicBenefit)}
                  sub="10-yr incl affordability"
                  status="purple"
                />
                <Metric
                  label="Property Tax Savings"
                  value={fmtCur(m.totalPropertyTaxSavings)}
                  sub="Est. 10-yr avoided taxes"
                  status="purple"
                />
                <Metric
                  label="Public vs. Private"
                  value={fmtPct(m.publicPrivatePct)}
                  sub={m.publicPrivateDiff !== null
                    ? `${(m.publicPrivateDiff ?? 0) >= 0 ? "Public leads by " : "Private leads by "}${fmtCur(m.publicPrivateDiff)}`
                    : undefined}
                  status={diffStatus}
                />
                <Metric
                  label="Total Units"
                  value={m.totalUnits?.toString() ?? "—"}
                  sub="Affordable + market rate"
                />
              </div>
            </section>

            {/* Benefit components */}
            <section>
              <SectionHeader
                title="Agency Benefit Components (10-Year Totals)"
                icon={<svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
              />
              <div className="bg-[#0F1729] border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Benefit Stream</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">10-Yr Total</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">% of Public Benefit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "Adj Rent (Affordability Savings)",  value: m.adjRentBenefit,       note: "Rent discount vs. market" },
                      { label: "PILOT Payments",                    value: m.pilotPayments,         note: "Annual in-lieu-of-tax payments" },
                      { label: "Origination Fee",                   value: m.originationFee,        note: "Upfront fee on TDC" },
                      { label: "Capital Events Share",              value: m.capitalEventsShare,    note: "Back-end equity share" },
                      { label: "Annual Compliance / Asset Mgmt Fee",value: m.annualComplianceFees,  note: "Recurring oversight fee" },
                    ].map((row, i) => {
                      const pct = m.totalPublicBenefit && row.value
                        ? (Math.abs(row.value) / m.totalPublicBenefit) * 100
                        : null;
                      return (
                        <tr key={i} className={`border-b border-slate-800/50 ${i % 2 === 0 ? "bg-slate-900/20" : ""}`}>
                          <td className="px-5 py-3">
                            <p className="text-sm text-slate-200">{row.label}</p>
                            <p className="text-xs text-slate-500">{row.note}</p>
                          </td>
                          <td className="px-5 py-3 text-right font-semibold text-white">
                            {fmtCur(row.value)}
                          </td>
                          <td className="px-5 py-3 text-right text-slate-400 hidden sm:table-cell">
                            {pct !== null ? `${pct.toFixed(1)}%` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                    {m.totalDirectBenefits !== null && (
                      <tr className="bg-purple-950/20 border-t border-purple-800/30">
                        <td className="px-5 py-3 text-sm font-bold text-purple-300">Total Direct Benefits</td>
                        <td className="px-5 py-3 text-right font-bold text-purple-300">{fmtCur(m.totalDirectBenefits)}</td>
                        <td className="px-5 py-3 hidden sm:table-cell" />
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 10-year PILOT chart */}
            {m.pilotByYear.length > 0 && (
              <section>
                <SectionHeader
                  title="PILOT Payments — Year by Year"
                  icon={<svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>}
                />
                <div className="bg-[#0F1729] border border-slate-800 rounded-xl p-5">
                  <div className="flex items-end gap-2 h-32">
                    {(() => {
                      const maxVal = Math.max(...m.pilotByYear.map(Math.abs), 1);
                      return m.pilotByYear.map((v, i) => {
                        const pct = (Math.abs(v) / maxVal) * 100;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[9px] text-slate-500 font-mono">
                              {v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v.toFixed(0)}`}
                            </span>
                            <div
                              className="w-full rounded-t bg-purple-700/60 hover:bg-purple-600/80 transition-colors"
                              style={{ height: `${pct}%`, minHeight: "4px" }}
                            />
                            <span className="text-[10px] text-slate-600">Yr {i + 1}</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <p className="text-xs text-slate-600 text-right mt-2">
                    10-yr total: <span className="text-slate-400 font-semibold">{fmtCur(m.pilotPayments)}</span>
                  </p>
                </div>
              </section>
            )}

            {/* Financial metrics */}
            <section>
              <SectionHeader
                title="Project Financials"
                icon={<svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <Metric label="Total Project Cost" value={fmtCur(m.totalProjectCost)} sub="Sources & Uses" />
                <Metric label="Loan" value={fmtCur(m.loanAmount)} sub={m.totalProjectCost && m.loanAmount ? `${((m.loanAmount / m.totalProjectCost) * 100).toFixed(0)}% LTC` : undefined} />
                <Metric label="Equity" value={fmtCur(m.equityAmount)} sub={m.totalProjectCost && m.equityAmount ? `${((m.equityAmount / m.totalProjectCost) * 100).toFixed(0)}% of TPC` : undefined} />
                <Metric
                  label="Net Operating Income"
                  value={fmtCur(m.netOperatingIncome)}
                  sub="Year 1 stabilized"
                  status={m.netOperatingIncome !== null ? (m.netOperatingIncome > 0 ? "good" : "bad") : "neutral"}
                />
                <Metric
                  label="DSCR"
                  value={m.dscr !== null ? `${fmtNum(m.dscr, 2)}x` : "—"}
                  sub="Debt service coverage"
                  status={m.dscr === null ? "neutral" : m.dscr >= 1.15 ? "good" : m.dscr >= 1.0 ? "warn" : "bad"}
                />
              </div>
            </section>

          </div>
        )}
      </main>
    </div>
  );
}
