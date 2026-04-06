"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { formatCurrency } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface PILOTMetrics {
  // Project basics
  totalUnits: number | null;
  totalProjectCost: number | null;
  loanAmount: number | null;
  equityAmount: number | null;

  // Public benefit headline figures (10-year totals from Municipality Benefits Analysis)
  totalPublicBenefit: number | null;
  totalPropertyTaxSavings: number | null;
  publicPrivateDifference: number | null;
  publicPrivatePct: number | null;

  // Individual benefit components (10-year totals)
  adjRentBenefit: number | null;     // rent discount vs market
  originationFee: number | null;
  cashFlowShare: number | null;
  pilotPayments: number | null;
  capitalEventShare: number | null;
  assetComplianceFees: number | null;

  // Operating metrics
  totalIncome: number | null;
  netOperatingIncome: number | null;
  totalExpenses: number | null;
  dscr: number | null;

  // Rent mix (unit counts)
  marketRateUnits: number | null;
  ami80Units: number | null;
  ami60Units: number | null;

  // Year-by-year benefit detail (Benefits Analysis sheet)
  yearlyBenefits: YearlyBenefit[];
}

interface YearlyBenefit {
  year: number;
  assetFees: number;
  pilot: number;
  cashFlow: number;
  origFee: number;
}

// ── Sheet helpers (identical pattern to /dashboard/financial) ─────────────────

type SheetRows = (string | number | boolean | null)[][];

function readSheet(wb: XLSX.WorkBook, names: string[]): SheetRows | null {
  for (const name of names) {
    const s = wb.Sheets[name];
    if (s) return XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(s, { header: 1, defval: null });
  }
  for (const name of names) {
    const lc = name.toLowerCase();
    const key = wb.SheetNames.find((k) => k.toLowerCase().includes(lc));
    if (key) return XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(wb.Sheets[key], { header: 1, defval: null });
  }
  return null;
}

function findRow(rows: SheetRows, label: string): number {
  const lc = label.toLowerCase();
  return rows.findIndex((row) =>
    row.some((cell) => typeof cell === "string" && cell.trim().toLowerCase().includes(lc))
  );
}

// Return the last numeric value in a row (totals are typically in the rightmost columns)
function lastNumeric(row: (string | number | boolean | null)[], minAbs = 0): number | null {
  for (let i = row.length - 1; i >= 0; i--) {
    const c = row[i];
    if (typeof c === "number" && Math.abs(c) >= minAbs && c !== 0) return c;
  }
  return null;
}

// Return the first numeric value in a row at or after `fromCol`
function numericFrom(row: (string | number | boolean | null)[], fromCol: number, minAbs = 0): number | null {
  for (let i = fromCol; i < row.length; i++) {
    const c = row[i];
    if (typeof c === "number" && Math.abs(c) >= minAbs) return c;
  }
  return null;
}

function firstNumeric(row: (string | number | boolean | null)[], minAbs = 0): number | null {
  for (const c of row) {
    if (typeof c === "number" && Math.abs(c) >= minAbs && c !== 0) return c;
  }
  return null;
}

// ── Parser ────────────────────────────────────────────────────────────────────

function extractPILOT(wb: XLSX.WorkBook): PILOTMetrics {
  const m: PILOTMetrics = {
    totalUnits: null,
    totalProjectCost: null,
    loanAmount: null,
    equityAmount: null,
    totalPublicBenefit: null,
    totalPropertyTaxSavings: null,
    publicPrivateDifference: null,
    publicPrivatePct: null,
    adjRentBenefit: null,
    originationFee: null,
    cashFlowShare: null,
    pilotPayments: null,
    capitalEventShare: null,
    assetComplianceFees: null,
    totalIncome: null,
    netOperatingIncome: null,
    totalExpenses: null,
    dscr: null,
    marketRateUnits: null,
    ami80Units: null,
    ami60Units: null,
    yearlyBenefits: [],
  };

  // ── Municipality Benefits Analysis ───────────────────────────────────────────
  // This is the government-facing benefits summary sheet.
  const muni = readSheet(wb, ["Municipality Benefits Analysis"]);
  if (muni) {
    const adjRentRi = findRow(muni, "adj rent");
    if (adjRentRi >= 0) m.adjRentBenefit = lastNumeric(muni[adjRentRi], 1) ?? null;

    const origRi = findRow(muni, "origination fee");
    if (origRi >= 0) m.originationFee = lastNumeric(muni[origRi], 1) ?? null;

    const cfRi = findRow(muni, "cash flow");
    if (cfRi >= 0) m.cashFlowShare = lastNumeric(muni[cfRi], 1) ?? null;

    const pilotRi = findRow(muni, "pilot");
    if (pilotRi >= 0) m.pilotPayments = lastNumeric(muni[pilotRi], 1) ?? null;

    const capRi = findRow(muni, "capital event");
    if (capRi >= 0) m.capitalEventShare = lastNumeric(muni[capRi], 1) ?? null;

    const assetRi = findRow(muni, "asset & compliance");
    if (assetRi >= 0) m.assetComplianceFees = firstNumeric(muni[assetRi], 1) ?? null;

    // "Total Public Benefit" row
    const tpbRi = findRow(muni, "total public benefit");
    if (tpbRi >= 0) m.totalPublicBenefit = firstNumeric(muni[tpbRi], 1) ?? null;

    // "Total Est Property Tax Savings"
    const taxRi = findRow(muni, "total est property tax");
    if (taxRi >= 0) m.totalPropertyTaxSavings = firstNumeric(muni[taxRi], 1) ?? null;

    // "Difference" (public vs private benefit gap)
    const diffRi = findRow(muni, "difference");
    if (diffRi >= 0) m.publicPrivateDifference = firstNumeric(muni[diffRi], 1) ?? null;

    // "Percentage"
    const pctRi = findRow(muni, "percentage");
    if (pctRi >= 0) {
      const v = firstNumeric(muni[pctRi], 0);
      if (v !== null && v > 0 && v <= 1) m.publicPrivatePct = v;
    }

    // Number of units
    const unitsRi = findRow(muni, "number of units");
    if (unitsRi >= 0) m.totalUnits = firstNumeric(muni[unitsRi], 1) ?? null;
  }

  // ── Summary Page: fallback for benefit components if muni sheet was empty ────
  const summary = readSheet(wb, ["Summary Page", "Summary"]);
  if (summary) {
    if (!m.totalPublicBenefit) {
      const ri = findRow(summary, "total public benefit");
      if (ri >= 0) m.totalPublicBenefit = lastNumeric(summary[ri], 1) ?? null;
    }
    if (!m.assetComplianceFees) {
      const ri = findRow(summary, "asset & compliance");
      if (ri >= 0) m.assetComplianceFees = lastNumeric(summary[ri], 1) ?? null;
    }
    if (!m.pilotPayments) {
      const ri = findRow(summary, "pilot");
      if (ri >= 0) m.pilotPayments = lastNumeric(summary[ri], 1) ?? null;
    }
    if (!m.originationFee) {
      const ri = findRow(summary, "issuer origination fee");
      if (ri >= 0) m.originationFee = lastNumeric(summary[ri], 1) ?? null;
    }
    if (!m.adjRentBenefit) {
      const ri = findRow(summary, "adj rent");
      if (ri >= 0) m.adjRentBenefit = lastNumeric(summary[ri], 1) ?? null;
    }
    if (!m.cashFlowShare) {
      const ri = findRow(summary, "cash flow share");
      if (ri >= 0) m.cashFlowShare = lastNumeric(summary[ri], 1) ?? null;
    }
    if (!m.capitalEventShare) {
      const ri = findRow(summary, "capital event share");
      if (ri >= 0) m.capitalEventShare = lastNumeric(summary[ri], 1) ?? null;
    }
  }

  // ── Benefits Analysis: year-by-year detail ────────────────────────────────────
  // Columns C–L = Years 1–10 (0-indexed cols 2–11)
  // Column N = 10-year Sponsor total; col O = 10-year municipality total / %age
  const benef = readSheet(wb, ["Benefits Analysis"]);
  if (benef) {
    const assetRi = findRow(benef, "asset");
    const pilotRi = findRow(benef, "pilot");
    const cfRi    = findRow(benef, "cash flow");
    const origRi  = findRow(benef, "origination fee");

    // Build year-by-year array (cols 2–11 = years 1–10)
    const yearly: YearlyBenefit[] = [];
    for (let y = 0; y < 10; y++) {
      const col = y + 2;
      const getVal = (ri: number) =>
        ri >= 0 ? (typeof benef[ri]?.[col] === "number" ? (benef[ri][col] as number) : 0) : 0;
      yearly.push({
        year: y + 1,
        assetFees: getVal(assetRi),
        pilot: getVal(pilotRi),
        cashFlow: getVal(cfRi),
        origFee: y === 0 ? getVal(origRi) : 0, // origination is year 1 only
      });
    }
    if (yearly.some((y) => y.assetFees !== 0 || y.pilot !== 0 || y.cashFlow !== 0)) {
      m.yearlyBenefits = yearly;
    }

    // Overwrite 10-year totals from "Total" column (col index ~14 = col O)
    if (assetRi >= 0) {
      const total = lastNumeric(benef[assetRi], 1);
      if (total) m.assetComplianceFees = total;
    }
    if (pilotRi >= 0) {
      const total = lastNumeric(benef[pilotRi], 1);
      if (total) m.pilotPayments = total;
    }
  }

  // ── Sources & Uses ────────────────────────────────────────────────────────────
  const su = readSheet(wb, ["SOURCES and USES of FUNDS", "Sources and Uses", "SOURCES"]);
  if (su) {
    const tpcRi = findRow(su, "total project cost");
    if (tpcRi >= 0) m.totalProjectCost = lastNumeric(su[tpcRi], 1000) ?? null;

    const loanRi = findRow(su, "loan");
    if (loanRi >= 0) m.loanAmount = lastNumeric(su[loanRi], 1000) ?? null;

    const equityRi = findRow(su, "equity");
    if (equityRi >= 0) m.equityAmount = lastNumeric(su[equityRi], 1000) ?? null;

    if (!m.totalUnits) {
      const unitsRi = findRow(su, "number of units");
      if (unitsRi >= 0) m.totalUnits = firstNumeric(su[unitsRi], 1) ?? null;
    }
  }

  // ── P&L: operating metrics ────────────────────────────────────────────────────
  const pl = readSheet(wb, ["P&L", "P & L", "Profit & Loss"]);
  if (pl) {
    const incomeRi = findRow(pl, "total income");
    if (incomeRi >= 0) m.totalIncome = firstNumeric(pl[incomeRi], 100) ?? null;

    const expRi = findRow(pl, "total expenses");
    if (expRi >= 0) m.totalExpenses = firstNumeric(pl[expRi], 100) ?? null;

    const noiRi = findRow(pl, "net operating income");
    if (noiRi >= 0) m.netOperatingIncome = firstNumeric(pl[noiRi], 1) ?? null;

    if (!m.totalUnits) {
      const unitsRi = findRow(pl, "number of units");
      if (unitsRi >= 0) m.totalUnits = firstNumeric(pl[unitsRi], 1) ?? null;
    }
  }

  // ── Cash Flow + Debt: DSCR ───────────────────────────────────────────────────
  const cf = readSheet(wb, ["Cash Flow + Debt", "Cash Flow", "Debt"]);
  if (cf) {
    const dscrRi = findRow(cf, "debt service coverage");
    if (dscrRi >= 0) {
      const v = firstNumeric(cf[dscrRi], 0);
      if (v !== null && v > 0 && v < 20) m.dscr = v;
    }
  }

  // ── Mixed Rent: unit mix ──────────────────────────────────────────────────────
  const mr = readSheet(wb, ["Mixed Rent", "Mixed Income"]);
  if (mr) {
    const mktRi = findRow(mr, "market rate");
    if (mktRi >= 0) m.marketRateUnits = firstNumeric(mr[mktRi], 0) ?? null;
    const ami80Ri = findRow(mr, "80% ami");
    if (ami80Ri >= 0) m.ami80Units = firstNumeric(mr[ami80Ri], 0) ?? null;
    const ami60Ri = findRow(mr, "60% ami");
    if (ami60Ri >= 0) m.ami60Units = firstNumeric(mr[ami60Ri], 0) ?? null;
  }

  return m;
}

// ── UI helpers ────────────────────────────────────────────────────────────────

type StatusColor = "good" | "warn" | "bad" | "neutral";

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  status?: StatusColor;
  accent?: boolean;
}

function MetricCard({ label, value, sub, status = "neutral", accent }: MetricCardProps) {
  const valueColor =
    accent          ? "text-purple-300" :
    status === "good" ? "text-emerald-400" :
    status === "warn" ? "text-amber-400" :
    status === "bad"  ? "text-red-400" :
                        "text-white";
  return (
    <div className={`bg-[#0F1729] border rounded-xl p-5 ${accent ? "border-purple-800/50" : "border-slate-800"}`}>
      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold font-serif ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function fmtCur(v: number | null): string {
  if (v === null) return "—";
  return formatCurrency(v);
}

function fmtPct(v: number | null): string {
  if (v === null) return "—";
  return `${(v * 100).toFixed(1)}%`;
}

function fmtDscr(v: number | null): string {
  if (v === null) return "—";
  return `${v.toFixed(2)}x`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PILOTAnalysisPage() {
  const [metrics, setMetrics] = useState<PILOTMetrics | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
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
        const wb = XLSX.read(data, { type: "array" });
        const result = extractPILOT(wb);
        setMetrics(result);
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

  // Compute 10-year total public benefit for the header if not parsed directly
  const computedTotalBenefit = metrics
    ? (metrics.totalPublicBenefit ??
        [
          metrics.adjRentBenefit,
          metrics.originationFee,
          metrics.cashFlowShare,
          metrics.pilotPayments,
          metrics.capitalEventShare,
          metrics.assetComplianceFees,
        ]
          .filter((v): v is number => v !== null)
          .reduce((sum, v) => sum + v, 0) || null)
    : null;

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
          <span className="text-[10px] uppercase tracking-widest text-purple-600 border border-purple-900/50 bg-purple-950/30 px-2 py-0.5 rounded font-semibold">
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
              This tool is for housing authority and municipal finance staff reviewing PILOT agreements for affordable
              housing developments. Upload the developer&apos;s completed Public Benefit Analysis workbook to
              instantly surface the key public benefit metrics your agency cares about — tax revenue impact,
              affordability commitments, agency income streams, and the public-vs-private benefit ratio.
            </p>
          </div>
        </div>

        {/* Step 1: Download template */}
        <section className="bg-[#0F1729] border border-slate-800 rounded-2xl p-6">
          <h2 className="text-base font-bold text-white mb-1">Step 1 — Download the Analysis Template</h2>
          <p className="text-sm text-slate-400 mb-4">
            Share this workbook with the developer applicant. They fill in the yellow input cells; all
            public benefit calculations populate automatically across the{" "}
            <span className="text-slate-300 font-mono text-xs">Benefits Analysis</span> and{" "}
            <span className="text-slate-300 font-mono text-xs">Municipality Benefits Analysis</span> sheets.
          </p>
          <a
            href="/templates/Public%20Benefit%20Analysis%20(Government%20Customer).xlsm"
            download
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Template (.xlsm)
          </a>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { sheet: "Summary Page",                  desc: "Project inputs and key ratios" },
              { sheet: "Municipality Benefits Analysis", desc: "Government-facing benefit summary" },
              { sheet: "Benefits Analysis",             desc: "10-year benefit breakdown by stream" },
              { sheet: "10 Years Mixed",                desc: "Income & expense pro forma" },
            ].map((s) => (
              <div key={s.sheet} className="bg-slate-900/60 rounded-lg px-3 py-2.5">
                <p className="text-xs font-semibold text-purple-400">{s.sheet}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Step 2: Upload */}
        <section className="bg-[#0F1729] border border-slate-800 rounded-2xl p-6">
          <h2 className="text-base font-bold text-white mb-1">Step 2 — Upload the Completed Workbook</h2>
          <p className="text-sm text-slate-400 mb-4">
            Upload the developer&apos;s completed .xlsm or .xlsx file. All parsing runs in your browser —
            no data leaves your device.
          </p>
          <div
            className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-purple-700/60 transition-colors"
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
              <div>
                <p className="text-purple-400 text-sm font-semibold">{fileName}</p>
                <p className="text-slate-500 text-xs mt-1">Click or drop to replace</p>
              </div>
            ) : (
              <div>
                <svg className="w-8 h-8 text-slate-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-slate-400 text-sm">Drop .xlsm / .xlsx file here or click to browse</p>
              </div>
            )}
          </div>
          {parseError && (
            <p className="mt-3 text-xs text-red-400 bg-red-900/20 border border-red-700/30 rounded px-3 py-2">
              {parseError}
            </p>
          )}
        </section>

        {/* Results */}
        {metrics && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Public Benefit Analysis Results</h2>
                {metrics.totalUnits && (
                  <p className="text-xs text-slate-500 mt-0.5">{metrics.totalUnits} total units</p>
                )}
              </div>
              <span className="text-xs text-slate-500 italic">{fileName}</span>
            </div>

            {/* Headline public benefit numbers */}
            <div>
              <p className="text-xs font-semibold text-purple-400 uppercase tracking-wide mb-3">
                Public Benefit — 10-Year Summary
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <MetricCard
                  label="Total Public Benefit (10 yr)"
                  value={fmtCur(computedTotalBenefit)}
                  sub={metrics.totalUnits ? `${fmtCur(computedTotalBenefit && metrics.totalUnits ? computedTotalBenefit / metrics.totalUnits : null)} / unit` : undefined}
                  accent
                />
                <MetricCard
                  label="Est. Property Tax Savings"
                  value={fmtCur(metrics.totalPropertyTaxSavings)}
                  sub="Tax exemption value granted to developer"
                />
                <MetricCard
                  label="Public Benefit Ratio"
                  value={metrics.publicPrivatePct !== null ? fmtPct(metrics.publicPrivatePct) : (
                    computedTotalBenefit && metrics.totalPropertyTaxSavings && metrics.totalPropertyTaxSavings > 0
                      ? fmtPct(computedTotalBenefit / metrics.totalPropertyTaxSavings)
                      : "—"
                  )}
                  sub="Public benefit as % of tax exemption value"
                  status={
                    metrics.publicPrivatePct === null ? "neutral" :
                    metrics.publicPrivatePct >= 1.0 ? "good" :
                    metrics.publicPrivatePct >= 0.7 ? "warn" : "bad"
                  }
                />
              </div>
            </div>

            {/* Benefit components */}
            <div>
              <p className="text-xs font-semibold text-purple-400 uppercase tracking-wide mb-3">
                Benefit Components — Agency Revenue &amp; Affordability (10 yr)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <MetricCard
                  label="Asset & Compliance Fees"
                  value={fmtCur(metrics.assetComplianceFees)}
                  sub="Annual monitoring fees to agency"
                  status="good"
                />
                <MetricCard
                  label="PILOT Payments"
                  value={fmtCur(metrics.pilotPayments)}
                  sub="Payments in lieu of real estate taxes"
                />
                <MetricCard
                  label="Adjusted Rent Benefit"
                  value={fmtCur(metrics.adjRentBenefit)}
                  sub="Rent discount vs. market (affordability value)"
                  status={metrics.adjRentBenefit !== null && metrics.adjRentBenefit > 0 ? "good" : "neutral"}
                />
                <MetricCard
                  label="Issuer Origination Fee"
                  value={fmtCur(metrics.originationFee)}
                  sub="One-time fee at closing"
                />
                <MetricCard
                  label="Cash Flow Share"
                  value={fmtCur(metrics.cashFlowShare)}
                  sub="Agency share of operating surplus"
                />
                <MetricCard
                  label="Capital Event Share"
                  value={fmtCur(metrics.capitalEventShare)}
                  sub="Agency share of sale / refinance proceeds"
                />
              </div>
            </div>

            {/* Project financing */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Project Financing
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <MetricCard
                  label="Total Project Cost"
                  value={fmtCur(metrics.totalProjectCost)}
                  sub={metrics.totalUnits ? `${fmtCur(metrics.totalProjectCost && metrics.totalUnits ? metrics.totalProjectCost / metrics.totalUnits : null)} / unit` : undefined}
                />
                <MetricCard
                  label="Loan Amount"
                  value={fmtCur(metrics.loanAmount)}
                  sub={metrics.totalProjectCost && metrics.loanAmount
                    ? `${((metrics.loanAmount / metrics.totalProjectCost) * 100).toFixed(0)}% LTV`
                    : undefined}
                />
                <MetricCard
                  label="Equity"
                  value={fmtCur(metrics.equityAmount)}
                />
                <MetricCard
                  label="DSCR"
                  value={fmtDscr(metrics.dscr)}
                  sub={
                    metrics.dscr == null ? undefined :
                    metrics.dscr >= 1.25 ? "Strong — project financially viable" :
                    metrics.dscr >= 1.0  ? "Adequate — monitor closely" :
                    "Below 1.0x — financial risk"
                  }
                  status={
                    metrics.dscr == null ? "neutral" :
                    metrics.dscr >= 1.25 ? "good" :
                    metrics.dscr >= 1.0  ? "warn" : "bad"
                  }
                />
              </div>
            </div>

            {/* Operating metrics */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Operating Performance (Year 1)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <MetricCard
                  label="Total Income"
                  value={fmtCur(metrics.totalIncome)}
                  sub="Effective gross income"
                />
                <MetricCard
                  label="Total Expenses"
                  value={fmtCur(metrics.totalExpenses)}
                  sub={metrics.totalIncome && metrics.totalExpenses
                    ? `Expense ratio: ${((metrics.totalExpenses / metrics.totalIncome) * 100).toFixed(0)}%`
                    : undefined}
                />
                <MetricCard
                  label="Net Operating Income"
                  value={fmtCur(metrics.netOperatingIncome)}
                  status={metrics.netOperatingIncome !== null
                    ? metrics.netOperatingIncome > 0 ? "good" : "bad"
                    : "neutral"}
                />
              </div>
            </div>

            {/* Unit mix */}
            {(metrics.marketRateUnits !== null || metrics.ami80Units !== null || metrics.ami60Units !== null) && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  Unit Mix
                </p>
                <div className="bg-[#0F1729] border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-purple-400 uppercase tracking-wider">Income Tier</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-purple-400 uppercase tracking-wider">Units</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-purple-400 uppercase tracking-wider">% of Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {[
                        { label: "Market Rate", count: metrics.marketRateUnits },
                        { label: "80% AMI", count: metrics.ami80Units },
                        { label: "60% AMI", count: metrics.ami60Units },
                      ]
                        .filter((r) => r.count !== null)
                        .map((r) => (
                          <tr key={r.label}>
                            <td className="px-5 py-3 text-slate-300">{r.label}</td>
                            <td className="px-5 py-3 text-right text-white font-semibold">{r.count}</td>
                            <td className="px-5 py-3 text-right text-slate-400">
                              {metrics.totalUnits && r.count !== null
                                ? `${((r.count / metrics.totalUnits) * 100).toFixed(0)}%`
                                : "—"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Year-by-year benefit table */}
            {metrics.yearlyBenefits.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-purple-400 uppercase tracking-wide mb-3">
                  10-Year Benefit Stream — Agency Receipts
                </p>
                <div className="bg-[#0F1729] border border-slate-800 rounded-xl overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left px-4 py-3 text-slate-400 font-semibold">Year</th>
                        <th className="text-right px-4 py-3 text-slate-400 font-semibold">Asset / Compliance</th>
                        <th className="text-right px-4 py-3 text-slate-400 font-semibold">PILOT</th>
                        <th className="text-right px-4 py-3 text-slate-400 font-semibold">Cash Flow</th>
                        <th className="text-right px-4 py-3 text-slate-400 font-semibold">Orig. Fee</th>
                        <th className="text-right px-4 py-3 text-purple-400 font-semibold">Year Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {metrics.yearlyBenefits.map((y) => {
                        const yearTotal = y.assetFees + y.pilot + y.cashFlow + y.origFee;
                        return (
                          <tr key={y.year} className="hover:bg-slate-800/30">
                            <td className="px-4 py-2.5 text-slate-400">Year {y.year}</td>
                            <td className="px-4 py-2.5 text-right text-slate-300">{y.assetFees ? fmtCur(y.assetFees) : "—"}</td>
                            <td className="px-4 py-2.5 text-right text-slate-300">{y.pilot ? fmtCur(y.pilot) : "—"}</td>
                            <td className="px-4 py-2.5 text-right text-slate-300">{y.cashFlow ? fmtCur(y.cashFlow) : "—"}</td>
                            <td className="px-4 py-2.5 text-right text-slate-300">{y.origFee ? fmtCur(y.origFee) : "—"}</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-purple-300">{yearTotal ? fmtCur(yearTotal) : "—"}</td>
                          </tr>
                        );
                      })}
                      {/* Totals row */}
                      <tr className="border-t border-purple-900/40 bg-purple-950/20">
                        <td className="px-4 py-2.5 text-purple-300 font-bold">10-Year Total</td>
                        <td className="px-4 py-2.5 text-right text-slate-300 font-semibold">
                          {fmtCur(metrics.yearlyBenefits.reduce((s, y) => s + y.assetFees, 0))}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-300 font-semibold">
                          {fmtCur(metrics.yearlyBenefits.reduce((s, y) => s + y.pilot, 0))}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-300 font-semibold">
                          {fmtCur(metrics.yearlyBenefits.reduce((s, y) => s + y.cashFlow, 0))}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-300 font-semibold">
                          {fmtCur(metrics.yearlyBenefits.reduce((s, y) => s + y.origFee, 0))}
                        </td>
                        <td className="px-4 py-2.5 text-right text-purple-300 font-bold">
                          {fmtCur(metrics.yearlyBenefits.reduce(
                            (s, y) => s + y.assetFees + y.pilot + y.cashFlow + y.origFee, 0
                          ))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Evaluation guidance */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Evaluation Guidance
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                {[
                  {
                    metric: "Public Benefit Ratio",
                    good: "≥ 100% (benefit ≥ tax exemption)",
                    warn: "70–99% (partial offset)",
                    bad: "< 70% (minimal community return)",
                  },
                  {
                    metric: "Affordability Mix",
                    good: "≥ 20% at 60% AMI",
                    warn: "10–19% at 60% AMI",
                    bad: "< 10% affordable units",
                  },
                  {
                    metric: "DSCR",
                    good: "≥ 1.25x (viable project)",
                    warn: "1.00–1.24x (monitor)",
                    bad: "< 1.00x (subsidy risk)",
                  },
                ].map((b) => (
                  <div key={b.metric} className="space-y-1">
                    <p className="text-slate-300 font-semibold">{b.metric}</p>
                    <p><span className="text-emerald-400">●</span> <span className="text-slate-400"> Approve: {b.good}</span></p>
                    <p><span className="text-amber-400">●</span> <span className="text-slate-400"> Negotiate: {b.warn}</span></p>
                    <p><span className="text-red-400">●</span> <span className="text-slate-400"> Flag: {b.bad}</span></p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
