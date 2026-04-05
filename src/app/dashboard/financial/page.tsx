"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { formatCurrency } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FinancialMetrics {
  projectName: string | null;
  totalUnits: number | null;
  tdc: number | null;
  tdcPerUnit: number | null;
  noi: number | null;
  grossRevenue: number | null;
  totalExpenses: number | null;
  expenseRatio: number | null;
  dscr: number | null;
  annualDebtService: number | null;
  netCashFlow: number | null;
  lihtcEquity: number | null;
  deferredDevFee: number | null;
  devFee: number | null;
}

// ── Sheet helpers ─────────────────────────────────────────────────────────────

type SheetRows = (string | number | boolean)[][];

function readSheet(wb: XLSX.WorkBook, names: string[]): SheetRows | null {
  for (const name of names) {
    const s = wb.Sheets[name];
    if (s) return XLSX.utils.sheet_to_json<(string | number | boolean)[]>(s, { header: 1, defval: "" });
  }
  // fuzzy fallback
  for (const name of names) {
    const lc = name.toLowerCase();
    const key = wb.SheetNames.find((k) => k.toLowerCase().includes(lc));
    if (key) return XLSX.utils.sheet_to_json<(string | number | boolean)[]>(wb.Sheets[key], { header: 1, defval: "" });
  }
  return null;
}

/**
 * Find the first row index whose cells contain `label` (case-insensitive).
 * Returns -1 if not found.
 */
function findRowIndex(rows: SheetRows, label: string): number {
  const lc = label.toLowerCase();
  return rows.findIndex((row) =>
    row.some((cell) => typeof cell === "string" && cell.trim().toLowerCase().includes(lc))
  );
}

/**
 * From a row, return the first numeric value that is non-zero and optionally above a floor.
 * Skips leading zeros so baseline-zero cells in proforma rows don't shadow real values.
 */
function firstNumeric(row: (string | number | boolean)[], minAbs = 0): number | null {
  let foundAny = false;
  for (const cell of row) {
    if (typeof cell === "number") {
      foundAny = true;
      if (Math.abs(cell) >= minAbs && cell !== 0) return cell;
    }
  }
  // If the only numerics were 0, return 0 if minAbs is 0 and we found something
  if (foundAny && minAbs === 0) return 0;
  return null;
}

/**
 * From a row, return the first numeric value at or after column `fromCol` (0-based).
 */
function numericAfterCol(row: (string | number | boolean)[], fromCol: number, minAbs = 0): number | null {
  for (let i = fromCol; i < row.length; i++) {
    const cell = row[i];
    if (typeof cell === "number" && Math.abs(cell) >= minAbs) return cell;
  }
  return null;
}

// ── Main parser ───────────────────────────────────────────────────────────────

function extractMetrics(wb: XLSX.WorkBook): FinancialMetrics {
  const m: FinancialMetrics = {
    projectName: null,
    totalUnits: null,
    tdc: null,
    tdcPerUnit: null,
    noi: null,
    grossRevenue: null,
    totalExpenses: null,
    expenseRatio: null,
    dscr: null,
    annualDebtService: null,
    netCashFlow: null,
    lihtcEquity: null,
    deferredDevFee: null,
    devFee: null,
  };

  // ── Inputs ──────────────────────────────────────────────────────────────────
  const inputs = readSheet(wb, ["Inputs"]);
  if (inputs) {
    // Row 1: [..., "Project", <name>, ...]
    const projRow = findRowIndex(inputs, "project");
    if (projRow >= 0) {
      const row = inputs[projRow];
      // Find the label col then take the next string cell
      const labelCol = row.findIndex((c) => typeof c === "string" && c.trim().toLowerCase() === "project");
      for (let i = labelCol + 1; i < row.length; i++) {
        if (typeof row[i] === "string" && (row[i] as string).trim()) {
          m.projectName = (row[i] as string).trim();
          break;
        }
      }
    }
    // Row 2: "Number of Units"
    const unitsRow = findRowIndex(inputs, "number of units");
    if (unitsRow >= 0) {
      const v = firstNumeric(inputs[unitsRow], 1);
      if (v) m.totalUnits = v;
    }
  }

  // ── Development Budget → TDC ────────────────────────────────────────────────
  const devBudget = readSheet(wb, ["Development Budget"]);
  if (devBudget) {
    // "Total, With Developer Fee" is the bottom-line TDC row
    const ri = findRowIndex(devBudget, "total, with developer fee");
    if (ri >= 0) {
      // Col 6 (0-indexed) is the "Total" column in the template
      const v = numericAfterCol(devBudget[ri], 4, 10000);
      if (v) m.tdc = v;
    }
    // Dev fee
    const feeRi = findRowIndex(devBudget, "developer fee");
    if (feeRi >= 0) {
      const v = numericAfterCol(devBudget[feeRi], 4, 1000);
      if (v) m.devFee = v;
    }
  }

  // ── Perm Sources-Uses → TDC fallback, LIHTC equity, deferred dev fee ────────
  const permSU = readSheet(wb, ["Perm Sources-Uses", "Summary Sources-Uses", "Summary"]);
  if (permSU) {
    if (!m.tdc) {
      const ri = findRowIndex(permSU, "total uses:");
      if (ri >= 0) {
        const v = numericAfterCol(permSU[ri], 4, 10000);
        if (v) m.tdc = v;
      }
    }
    // LIHTC equity
    const lihtcRi = findRowIndex(permSU, "total federal lihtc equity");
    if (lihtcRi >= 0) {
      const v = firstNumeric(permSU[lihtcRi], 10000);
      if (v) m.lihtcEquity = v;
    }
    // Deferred developer fee
    const ddfRi = findRowIndex(permSU, "deferred devel fee");
    if (ddfRi >= 0) {
      const v = firstNumeric(permSU[ddfRi], 100);
      if (v) m.deferredDevFee = v;
    }
  }

  // ── Operating Expense → revenue, expenses, expense ratio ────────────────────
  const opex = readSheet(wb, ["Operating Expense"]);
  if (opex) {
    // Net Revenue (Effective Gross Income)
    const revRi = findRowIndex(opex, "net revenue");
    if (revRi >= 0) {
      const v = numericAfterCol(opex[revRi], 1, 1000);
      if (v) m.grossRevenue = v;
    }
    // Total Expense (without replacement reserves)
    const expRi = findRowIndex(opex, "total expense");
    // Find the plain "TOTAL EXPENSE" row (not "TOTAL EXPENSE + Repl Res.")
    const expRiExact = opex.findIndex((row) =>
      row.some(
        (c) =>
          typeof c === "string" &&
          c.trim().toUpperCase() === "TOTAL EXPENSE"
      )
    );
    const useExpRi = expRiExact >= 0 ? expRiExact : expRi;
    if (useExpRi >= 0) {
      const v = numericAfterCol(opex[useExpRi], 1, 1000);
      if (v) m.totalExpenses = v;
    }
    // Expense ratio
    const erRi = findRowIndex(opex, "expense ratio");
    if (erRi >= 0) {
      const v = firstNumeric(opex[erRi], 0);
      if (v !== null && v > 0 && v < 1) m.expenseRatio = v;
    }
    // Derive NOI from Operating Expense sheet if gross revenue found
    if (m.grossRevenue && m.totalExpenses) {
      m.noi = m.grossRevenue - m.totalExpenses;
    }
  }

  // ── 20yr Proforma → NOI, DSCR, debt service, net cash flow ──────────────────
  const proforma = readSheet(wb, ["20yr Proforma", "20-yr Proforma", "Proforma"]);
  if (proforma) {
    // Net Operating Income — row 24 in template
    const noiRi = findRowIndex(proforma, "net operating income");
    if (noiRi >= 0) {
      const v = firstNumeric(proforma[noiRi], 1000);
      // Prefer proforma NOI if it has a real value
      if (v && v > 0) m.noi = v;
    }

    // Total debt service: sum Debt Service 1st–5th rows (rows 27-31)
    let totalDS = 0;
    for (const label of [
      "debt service 1st",
      "debt service 2nd",
      "debt service 3rd",
      "debt service 4th",
      "debt service 5th",
    ]) {
      const ri = findRowIndex(proforma, label);
      if (ri >= 0) {
        const v = firstNumeric(proforma[ri], 1);
        if (v && v > 0) totalDS += v;
      }
    }
    if (totalDS > 0) m.annualDebtService = totalDS;

    // DSCR — "DSC - 1st & 2nd Mrgt" (row 51)
    const dscrRi = findRowIndex(proforma, "dsc - 1st");
    if (dscrRi >= 0) {
      const v = firstNumeric(proforma[dscrRi], 0);
      if (v && v > 0 && v < 20) m.dscr = v;
    }
    // If DSCR not found, calculate from NOI and debt service
    if (!m.dscr && m.noi && m.annualDebtService && m.annualDebtService > 0) {
      m.dscr = m.noi / m.annualDebtService;
    }

    // Net Cash Flow — row 49
    const ncfRi = findRowIndex(proforma, "net cash flow");
    if (ncfRi >= 0) {
      const v = firstNumeric(proforma[ncfRi], 0);
      if (v !== null) m.netCashFlow = v;
    }
  }

  // ── Computed metrics ─────────────────────────────────────────────────────────
  if (m.tdc && m.totalUnits && m.totalUnits > 0) {
    m.tdcPerUnit = m.tdc / m.totalUnits;
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
}

function MetricCard({ label, value, sub, status = "neutral" }: MetricCardProps) {
  const valueColor =
    status === "good"    ? "text-emerald-400" :
    status === "warn"    ? "text-amber-400"   :
    status === "bad"     ? "text-red-400"      :
                           "text-white";
  return (
    <div className="bg-[#0F1729] border border-slate-800 rounded-xl p-5">
      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold font-serif ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function fmtPct(v: number | null): string {
  if (v === null) return "—";
  return `${(v * 100).toFixed(1)}%`;
}

function fmtDscr(v: number | null): string {
  if (v === null) return "—";
  return `${v.toFixed(2)}x`;
}

function fmtCur(v: number | null): string {
  if (v === null) return "—";
  return formatCurrency(v);
}

function dscrStatus(v: number | null): StatusColor {
  if (!v) return "neutral";
  return v >= 1.25 ? "good" : v >= 1.0 ? "warn" : "bad";
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FinancialPage() {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
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
        const result = extractMetrics(wb);
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

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#080E1A]/90 backdrop-blur-sm sticky top-0 z-20 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm">Back</Link>
            <h1 className="text-lg font-bold">
              <span className="text-teal-400">Financial</span> Analysis
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* Template download */}
        <section className="bg-[#0F1729] border border-slate-800 rounded-2xl p-6">
          <h2 className="text-base font-bold text-white mb-1">Step 1 — Download Template</h2>
          <p className="text-sm text-slate-400 mb-4">
            Use the RipeSpot Tax Credit Development Analysis template to model your deal.
            Fill in the yellow cells on the <span className="text-slate-300 font-mono text-xs">Inputs</span> sheet —
            the model calculates everything else automatically.
          </p>
          <a
            href="/templates/RipeSpot%20(Tax%20Credit%20Development%20Analysis).xlsx"
            download
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Template (.xlsx)
          </a>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { sheet: "Inputs",              desc: "Units, rents, AMI tiers, timeline" },
              { sheet: "Development Budget",  desc: "Hard/soft costs, TDC, developer fee" },
              { sheet: "Operating Expense",   desc: "Expenses, net revenue, NOI" },
              { sheet: "20yr Proforma",       desc: "DSCR, debt service, net cash flow" },
            ].map((s) => (
              <div key={s.sheet} className="bg-slate-900/60 rounded-lg px-3 py-2.5">
                <p className="text-xs font-semibold text-teal-400">{s.sheet}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Upload */}
        <section className="bg-[#0F1729] border border-slate-800 rounded-2xl p-6">
          <h2 className="text-base font-bold text-white mb-1">Step 2 — Upload Your Completed Model</h2>
          <p className="text-sm text-slate-400 mb-4">
            Upload your filled-in workbook. Parsing runs entirely in your browser — no data is sent to a server.
          </p>
          <div
            className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-teal-600/60 transition-colors"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
            />
            {parsing ? (
              <p className="text-slate-400 text-sm">Parsing workbook…</p>
            ) : fileName ? (
              <div>
                <p className="text-teal-400 text-sm font-semibold">{fileName}</p>
                <p className="text-slate-500 text-xs mt-1">Click or drop to replace</p>
              </div>
            ) : (
              <div>
                <svg className="w-8 h-8 text-slate-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-slate-400 text-sm">Drop .xlsx file here or click to browse</p>
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
          <section>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-white">
                  {metrics.projectName
                    ? <><span className="text-teal-400">{metrics.projectName}</span> — Key Metrics</>
                    : "Key Financial Metrics"}
                </h2>
                {metrics.totalUnits && (
                  <p className="text-xs text-slate-500 mt-0.5">{metrics.totalUnits} units</p>
                )}
              </div>
            </div>

            {/* Development cost */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
              <MetricCard
                label="Total Development Cost"
                value={fmtCur(metrics.tdc)}
                sub={metrics.tdcPerUnit ? `${fmtCur(metrics.tdcPerUnit)} / unit` : undefined}
              />
              <MetricCard
                label="Developer Fee"
                value={fmtCur(metrics.devFee)}
                sub={metrics.tdc && metrics.devFee ? `${((metrics.devFee / metrics.tdc) * 100).toFixed(1)}% of TDC` : undefined}
              />
              <MetricCard
                label="Deferred Dev Fee"
                value={fmtCur(metrics.deferredDevFee)}
                sub={metrics.devFee && metrics.deferredDevFee
                  ? `${((metrics.deferredDevFee / metrics.devFee) * 100).toFixed(0)}% of total fee deferred`
                  : undefined}
              />
            </div>

            {/* Income & expenses */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <MetricCard
                label="Gross Revenue (EGI)"
                value={fmtCur(metrics.grossRevenue)}
                sub="Net of vacancy"
                status="neutral"
              />
              <MetricCard
                label="Operating Expenses"
                value={fmtCur(metrics.totalExpenses)}
                sub={metrics.expenseRatio ? `Expense ratio: ${fmtPct(metrics.expenseRatio)}` : undefined}
                status={
                  metrics.expenseRatio == null ? "neutral" :
                  metrics.expenseRatio <= 0.55  ? "good" :
                  metrics.expenseRatio <= 0.65  ? "warn" : "bad"
                }
              />
              <MetricCard
                label="NOI (Year 1)"
                value={fmtCur(metrics.noi)}
                sub="Net Operating Income"
                status={metrics.noi ? (metrics.noi > 0 ? "good" : "bad") : "neutral"}
              />
              <MetricCard
                label="LIHTC Equity"
                value={fmtCur(metrics.lihtcEquity)}
                sub={metrics.tdc && metrics.lihtcEquity
                  ? `${((metrics.lihtcEquity / metrics.tdc) * 100).toFixed(1)}% of TDC`
                  : undefined}
              />
            </div>

            {/* Debt & returns */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <MetricCard
                label="Annual Debt Service"
                value={fmtCur(metrics.annualDebtService)}
                sub="1st & 2nd mortgage combined"
              />
              <MetricCard
                label="DSCR"
                value={fmtDscr(metrics.dscr)}
                sub={
                  metrics.dscr == null ? undefined :
                  metrics.dscr >= 1.25 ? "Strong coverage" :
                  metrics.dscr >= 1.0  ? "Adequate — monitor closely" :
                  "Below 1.0x — coverage deficit"
                }
                status={dscrStatus(metrics.dscr)}
              />
              <MetricCard
                label="Net Cash Flow"
                value={fmtCur(metrics.netCashFlow)}
                sub="After debt service, Year 1"
                status={
                  metrics.netCashFlow == null ? "neutral" :
                  metrics.netCashFlow > 0 ? "good" : "bad"
                }
              />
            </div>

            {/* Benchmark reference */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Benchmark Reference</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                {[
                  { metric: "DSCR",           good: "≥ 1.25x",   warn: "1.00–1.24x",  bad: "< 1.00x" },
                  { metric: "Expense Ratio",  good: "≤ 55%",      warn: "56–65%",       bad: "> 65% (TDHCA cap)" },
                  { metric: "TDC / Unit",     good: "< $250k",    warn: "$250–$350k",   bad: "> $350k" },
                ].map((b) => (
                  <div key={b.metric} className="space-y-1">
                    <p className="text-slate-300 font-semibold">{b.metric}</p>
                    <p><span className="text-emerald-400">●</span> <span className="text-slate-400"> Strong: {b.good}</span></p>
                    <p><span className="text-amber-400">●</span> <span className="text-slate-400"> Adequate: {b.warn}</span></p>
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
