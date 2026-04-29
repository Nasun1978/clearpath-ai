"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import type { CompanyDocument } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface UnitRow {
  unit: string;
  type: string;
  sqFt: number | null;
  resident: string;
  status: string;
  marketRent: number | null;
  rent: number | null;
  otherCharges: number | null;
  credits: number | null;
  total: number | null;
  moveIn: string;
  leaseStart: string;
  leaseEnd: string;
  moveOut: string;
  deposits: number | null;
  balance: number | null;
  isPBV: boolean;
}

interface ParsedRentRoll {
  propertyName: string;
  managementCompany: string;
  printDate: string;
  units: UnitRow[];
}

// ── Parsing ───────────────────────────────────────────────────────────────────

function parseNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[$,]/g, ""));
  return isNaN(n) ? null : n;
}

function parseDate(v: unknown): string {
  if (!v) return "";
  if (typeof v === "number") {
    try {
      const d = XLSX.SSF.parse_date_code(v);
      return `${d.m.toString().padStart(2, "0")}/${d.d.toString().padStart(2, "0")}/${d.y}`;
    } catch { return ""; }
  }
  return String(v);
}

function parseRentRoll(wb: XLSX.WorkBook): ParsedRentRoll {
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  let propertyName = "";
  let managementCompany = "";
  let printDate = "";
  let headerRowIdx = -1;

  // Scan first 15 rows for metadata + header row
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const row = rows[i].map((c) => String(c).trim());
    const joined = row.join(" ").toLowerCase();
    if (!propertyName && row.some((c) => c.length > 3 && !c.toLowerCase().includes("rent roll") && !c.toLowerCase().includes("printed"))) {
      const candidate = row.find((c) => c.length > 3);
      if (candidate) propertyName = candidate;
    }
    if (joined.includes("management") || joined.includes("realty") || joined.includes("llc") || joined.includes("inc")) {
      const mc = row.find((c) => /management|realty|llc|inc/i.test(c));
      if (mc) managementCompany = mc;
    }
    if (joined.includes("printed")) {
      const pd = row.find((c) => /printed/i.test(c));
      if (pd) printDate = pd.replace(/printed/i, "").trim();
    }
    // Detect header row by looking for "unit" and "status" columns
    if (joined.includes("unit") && (joined.includes("status") || joined.includes("resident") || joined.includes("market rent"))) {
      headerRowIdx = i;
      break;
    }
  }

  if (headerRowIdx === -1) {
    return { propertyName, managementCompany, printDate, units: [] };
  }

  // Map column names to indices
  const headerRow = rows[headerRowIdx].map((c) => String(c).trim().toLowerCase());
  const col = (names: string[]): number => {
    for (const n of names) {
      const idx = headerRow.findIndex((h) => h.includes(n.toLowerCase()));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const colUnit        = col(["unit"]);
  const colType        = col(["type"]);
  const colSqFt        = col(["sq. feet", "sqft", "sq feet", "square"]);
  const colResident    = col(["residents", "resident", "tenant", "name"]);
  const colStatus      = col(["status"]);
  const colMarket      = col(["market rent", "market"]);
  const colRent        = col(["rent"]);
  const colOther       = col(["other charges", "other"]);
  const colCredits     = col(["credits", "credit"]);
  const colTotal       = col(["total"]);
  const colMoveIn      = col(["move in", "movein"]);
  const colLeaseStart  = col(["lease start", "start"]);
  const colLeaseEnd    = col(["lease end", "end"]);
  const colMoveOut     = col(["move out", "moveout"]);
  const colDeposits    = col(["deposits", "deposit"]);
  const colBalance     = col(["balance"]);

  // Parse data rows — stop at summary sections
  const units: UnitRow[] = [];
  const summaryKeywords = /property occupancy|unit type occupancy|collections|totals|account|square footage|occupied|vacant/i;

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    const joined = row.map((c) => String(c)).join(" ").trim();
    if (!joined) continue;

    // Stop when we hit summary rows
    const firstCell = String(row[0] ?? "").trim();
    if (summaryKeywords.test(firstCell) && !firstCell.match(/^[a-z]{2}\d/i)) break;

    const unitVal = colUnit >= 0 ? String(row[colUnit] ?? "").trim() : "";
    const residentVal = colResident >= 0 ? String(row[colResident] ?? "").trim() : "";
    const statusVal = colStatus >= 0 ? String(row[colStatus] ?? "").trim() : "";

    // Skip if no meaningful unit or resident data
    if (!unitVal && !residentVal) continue;

    units.push({
      unit:         unitVal,
      type:         colType >= 0 ? String(row[colType] ?? "").trim() : "",
      sqFt:         colSqFt >= 0 ? parseNum(row[colSqFt]) : null,
      resident:     residentVal,
      status:       statusVal || (residentVal && residentVal.toLowerCase() !== "vacant unit" ? "Occupied" : "Vacant"),
      marketRent:   colMarket >= 0 ? parseNum(row[colMarket]) : null,
      rent:         colRent >= 0 ? parseNum(row[colRent]) : null,
      otherCharges: colOther >= 0 ? parseNum(row[colOther]) : null,
      credits:      colCredits >= 0 ? parseNum(row[colCredits]) : null,
      total:        colTotal >= 0 ? parseNum(row[colTotal]) : null,
      moveIn:       colMoveIn >= 0 ? parseDate(row[colMoveIn]) : "",
      leaseStart:   colLeaseStart >= 0 ? parseDate(row[colLeaseStart]) : "",
      leaseEnd:     colLeaseEnd >= 0 ? parseDate(row[colLeaseEnd]) : "",
      moveOut:      colMoveOut >= 0 ? parseDate(row[colMoveOut]) : "",
      deposits:     colDeposits >= 0 ? parseNum(row[colDeposits]) : null,
      balance:      colBalance >= 0 ? parseNum(row[colBalance]) : null,
      isPBV:        residentVal.toLowerCase().includes("pbv") || unitVal.toLowerCase().includes("pbv"),
    });
  }

  return { propertyName, managementCompany, printDate, units };
}

// ── Formatting helpers ────────────────────────────────────────────────────────

function fmtCurrency(n: number | null): string {
  if (n === null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function fmtNum(n: number | null): string {
  if (n === null) return "—";
  return n.toLocaleString();
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const lc = status.toLowerCase();
  const cls = lc.includes("occup")
    ? "bg-emerald-900/40 text-emerald-300 border-emerald-700/40"
    : lc.includes("vacant") || lc === ""
    ? "bg-red-900/40 text-red-300 border-red-700/40"
    : lc.includes("notice") || lc.includes("ntv")
    ? "bg-amber-900/40 text-amber-300 border-amber-700/40"
    : "bg-slate-800 text-slate-400 border-slate-700";
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${cls}`}>
      {status || "Vacant"}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RentRollPage() {
  const [data, setData] = useState<ParsedRentRoll | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "occupied" | "vacant" | "pbv">("all");
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<"unit" | "type" | "rent" | "balance" | "leaseEnd">("unit");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [savedDocs, setSavedDocs] = useState<CompanyDocument[]>([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load previously saved rent rolls
  useEffect(() => {
    fetch("/api/documents?folder_path=rent-roll")
      .then((r) => r.json())
      .then((d: { documents?: CompanyDocument[] }) => setSavedDocs(d.documents ?? []));
  }, []);

  function processFile(file: File | Blob, name?: string) {
    setLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const ab = e.target?.result as ArrayBuffer;
        const wb = XLSX.read(ab, { type: "array", cellDates: false });
        const parsed = parseRentRoll(wb);
        setData(parsed);
        setFileName(name ?? (file instanceof File ? file.name : "Rent_Roll_Sample.xlsx"));
      } catch {
        setError("Could not parse this file. Please upload a valid rent roll in .xls or .xlsx format.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function loadSample() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rent-roll/sample");
      if (!res.ok) throw new Error("Failed to load sample");
      const blob = await res.blob();
      processFile(blob, "Rent_Roll_Sample.xlsx");
    } catch {
      setError("Could not load the sample rent roll.");
      setLoading(false);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  }, []);

  async function saveToDocuments() {
    if (!fileRef.current?.files?.[0] && !fileName) return;
    setSaving(true);
    try {
      const fileInput = fileRef.current;
      const file = fileInput?.files?.[0];
      if (!file) { setSaving(false); return; }

      const urlRes = await fetch("/api/documents/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, content_type: file.type || "application/vnd.ms-excel" }),
      });
      const { upload_url, file_path } = await urlRes.json() as { upload_url: string; file_path: string };
      await fetch(upload_url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });

      const docRes = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_name: `Rent Roll — ${data?.propertyName || file.name}`,
          file_path,
          file_size: file.size,
          folder_path: "rent-roll",
          document_type: "other",
        }),
      });
      const { document } = await docRes.json() as { document: CompanyDocument };
      setSavedDocs((prev) => [document, ...prev]);
    } finally {
      setSaving(false);
    }
  }

  // Derived stats
  const units = data?.units ?? [];
  const occupied = units.filter((u) => /occup/i.test(u.status));
  const vacant = units.filter((u) => /vacant/i.test(u.status) || (!u.status && !u.resident));
  const pbv = units.filter((u) => u.isPBV);
  const totalRent = occupied.reduce((sum, u) => sum + (u.rent ?? 0), 0);
  const totalMarketRent = units.reduce((sum, u) => sum + (u.marketRent ?? 0), 0);
  const occupancyPct = units.length > 0 ? Math.round((occupied.length / units.length) * 100) : 0;

  // Unit type breakdown
  const typeMap = new Map<string, { total: number; occupied: number; avgRent: number; rents: number[] }>();
  for (const u of units) {
    const t = u.type || "Unknown";
    if (!typeMap.has(t)) typeMap.set(t, { total: 0, occupied: 0, avgRent: 0, rents: [] });
    const entry = typeMap.get(t)!;
    entry.total++;
    if (/occup/i.test(u.status)) { entry.occupied++; if (u.rent) entry.rents.push(u.rent); }
  }
  for (const [, v] of typeMap) {
    v.avgRent = v.rents.length ? Math.round(v.rents.reduce((a, b) => a + b, 0) / v.rents.length) : 0;
  }

  // Filtered + sorted rows
  const filtered = units.filter((u) => {
    if (filter === "occupied" && !/occup/i.test(u.status)) return false;
    if (filter === "vacant" && !/vacant/i.test(u.status) && u.status) return false;
    if (filter === "pbv" && !u.isPBV) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.unit.toLowerCase().includes(q) || u.resident.toLowerCase().includes(q) || u.type.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => {
    let va: string | number = "", vb: string | number = "";
    if (sortCol === "unit") { va = a.unit; vb = b.unit; }
    else if (sortCol === "type") { va = a.type; vb = b.type; }
    else if (sortCol === "rent") { va = a.rent ?? -1; vb = b.rent ?? -1; }
    else if (sortCol === "balance") { va = a.balance ?? -999999; vb = b.balance ?? -999999; }
    else if (sortCol === "leaseEnd") { va = a.leaseEnd; vb = b.leaseEnd; }
    if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
    return sortDir === "asc" ? (va as number) - (vb as number) : (vb as number) - (va as number);
  });

  function toggleSort(col: typeof sortCol) {
    if (sortCol === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }

  function SortIcon({ col }: { col: typeof sortCol }) {
    if (sortCol !== col) return <svg className="w-3 h-3 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>;
    return sortDir === "asc"
      ? <svg className="w-3 h-3 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
      : <svg className="w-3 h-3 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>;
  }

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#080E1A]/90 backdrop-blur-sm sticky top-0 z-10 px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-300 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white">Rent Roll Analyzer</h1>
              <p className="text-xs text-slate-500 mt-0.5">Upload a rent roll to analyze occupancy, collections, and unit mix</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data && (
              <button
                onClick={saveToDocuments}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-700 text-white hover:bg-teal-600 disabled:opacity-50 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                {saving ? "Saving…" : "Save to Documents"}
              </button>
            )}
            <a
              href="/templates/Rent_Roll_Template.xlsx"
              download
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Template
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Upload area */}
        {!data && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false); }}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors ${
              dragOver ? "border-teal-500 bg-teal-900/10" : "border-slate-700 hover:border-slate-600 bg-[#0F1729]"
            }`}
          >
            {loading ? (
              <svg className="w-8 h-8 text-teal-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-teal-900/40 border border-teal-700/40 flex items-center justify-center">
                <svg className="w-7 h-7 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            )}
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-300">
                {loading ? "Parsing rent roll…" : "Drop your rent roll here or click to browse"}
              </p>
              <p className="text-xs text-slate-500 mt-1">Supports .xls and .xlsx files from Yardi, RealPage, Entrata, and other property management systems</p>
            </div>
            {error && <p className="text-xs text-red-400 text-center max-w-sm">{error}</p>}
            <input ref={fileRef} type="file" accept=".xls,.xlsx" className="hidden" onChange={handleFileInput} />
            {!loading && (
              <div className="flex items-center gap-3 mt-1" onClick={(e) => e.stopPropagation()}>
                <span className="text-xs text-slate-600">or</span>
                <button
                  onClick={loadSample}
                  className="text-xs text-teal-400 hover:text-teal-300 font-semibold border border-teal-800/50 px-3 py-1.5 rounded-lg hover:bg-teal-900/20 transition-colors"
                >
                  Load Sample Rent Roll
                </button>
              </div>
            )}
          </div>
        )}

        {/* Previously saved */}
        {!data && savedDocs.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Previously Saved Rent Rolls</h2>
            <div className="bg-[#0F1729] border border-slate-800 rounded-xl divide-y divide-slate-800/60">
              {savedDocs.map((doc) => (
                <div key={doc.id} className="px-4 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-200 font-medium">{doc.document_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{new Date(doc.uploaded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                  </div>
                  {doc.signed_url && (
                    <a
                      href={doc.signed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
                    >
                      Download
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Results */}
        {data && (
          <>
            {/* Property header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-2xl font-bold font-serif text-white">{data.propertyName || "Rent Roll"}</h2>
                {data.managementCompany && <p className="text-sm text-slate-400 mt-0.5">{data.managementCompany}</p>}
                {data.printDate && <p className="text-xs text-slate-600 mt-0.5">As of: {data.printDate}</p>}
                <p className="text-xs text-slate-600 mt-0.5">Source: {fileName}</p>
              </div>
              <button
                onClick={() => { setData(null); setFileName(""); if (fileRef.current) fileRef.current.value = ""; }}
                className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload different file
              </button>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Total Units", value: units.length, color: "text-slate-200" },
                { label: "Occupied", value: occupied.length, color: "text-emerald-400" },
                { label: "Vacant", value: vacant.length, color: "text-red-400" },
                { label: "Occupancy", value: `${occupancyPct}%`, color: occupancyPct >= 95 ? "text-emerald-400" : occupancyPct >= 85 ? "text-amber-400" : "text-red-400" },
                { label: "Collected Rent", value: fmtCurrency(totalRent), color: "text-teal-400" },
                { label: "Market Rent", value: fmtCurrency(totalMarketRent), color: "text-slate-300" },
              ].map((s) => (
                <div key={s.label} className="bg-[#0F1729] border border-slate-800 rounded-xl p-4">
                  <div className={`text-xl font-bold font-serif ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Unit type breakdown */}
            {typeMap.size > 0 && (
              <section>
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Unit Type Mix</h2>
                <div className="bg-[#0F1729] border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        {["Unit Type", "Total Units", "Occupied", "Vacant", "Occ %", "Avg Collected Rent"].map((h) => (
                          <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold text-teal-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...typeMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([type, v]) => {
                        const pct = v.total > 0 ? Math.round((v.occupied / v.total) * 100) : 0;
                        return (
                          <tr key={type} className="border-b border-slate-800/40 hover:bg-slate-800/20">
                            <td className="px-4 py-2.5 text-sm font-semibold text-slate-200">{type}</td>
                            <td className="px-4 py-2.5 text-sm text-slate-300">{v.total}</td>
                            <td className="px-4 py-2.5 text-sm text-emerald-400">{v.occupied}</td>
                            <td className="px-4 py-2.5 text-sm text-red-400">{v.total - v.occupied}</td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${pct >= 95 ? "bg-emerald-500" : pct >= 85 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-xs text-slate-400">{pct}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-sm text-slate-300">{v.avgRent > 0 ? fmtCurrency(v.avgRent) : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Unit table */}
            <section>
              <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Unit Detail</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Filter tabs */}
                  <div className="flex bg-slate-900 rounded-lg border border-slate-800 p-0.5">
                    {(["all", "occupied", "vacant", "pbv"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                          filter === f ? "bg-teal-700 text-white" : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {f === "all" ? `All (${units.length})` : f === "occupied" ? `Occupied (${occupied.length})` : f === "vacant" ? `Vacant (${vacant.length})` : `PBV (${pbv.length})`}
                      </button>
                    ))}
                  </div>
                  {/* Search */}
                  <div className="relative">
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search unit or resident…"
                      className="pl-7 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-teal-600 w-48"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#0F1729] border border-slate-800 rounded-xl overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-[#080E1A]/60">
                      {[
                        { key: "unit", label: "Unit" },
                        { key: "type", label: "Type" },
                        { key: null, label: "Sq Ft" },
                        { key: null, label: "Resident" },
                        { key: null, label: "Status" },
                        { key: "rent", label: "Rent" },
                        { key: null, label: "Market Rent" },
                        { key: "leaseEnd", label: "Lease End" },
                        { key: "balance", label: "Balance" },
                      ].map(({ key, label }) => (
                        <th
                          key={label}
                          onClick={key ? () => toggleSort(key as typeof sortCol) : undefined}
                          className={`text-left px-3 py-2.5 text-[10px] font-bold text-teal-400 uppercase tracking-wider whitespace-nowrap ${key ? "cursor-pointer hover:text-teal-300 select-none" : ""}`}
                        >
                          <span className="flex items-center gap-1">
                            {label}
                            {key && <SortIcon col={key as typeof sortCol} />}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-slate-500 text-xs">No units match the current filter</td>
                      </tr>
                    ) : filtered.map((u, i) => (
                      <tr key={i} className={`border-b border-slate-800/40 hover:bg-slate-800/20 ${u.isPBV ? "bg-purple-950/10" : ""}`}>
                        <td className="px-3 py-2.5 font-mono text-xs text-slate-300 whitespace-nowrap">{u.unit}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-400 whitespace-nowrap">{u.type}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{fmtNum(u.sqFt)}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-200 whitespace-nowrap max-w-[180px] truncate">
                          <span title={u.resident}>{u.resident || <span className="text-slate-600 italic">Vacant</span>}</span>
                          {u.isPBV && <span className="ml-1.5 text-[9px] bg-purple-900/50 text-purple-300 border border-purple-700/40 px-1 py-0.5 rounded font-bold">PBV</span>}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap"><StatusBadge status={u.status} /></td>
                        <td className="px-3 py-2.5 text-xs text-emerald-300 whitespace-nowrap font-semibold">{fmtCurrency(u.rent)}</td>
                        <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{fmtCurrency(u.marketRent)}</td>
                        <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                          {u.leaseEnd ? (
                            <span className={new Date(u.leaseEnd) < new Date() ? "text-red-400" : new Date(u.leaseEnd) < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) ? "text-amber-400" : "text-slate-400"}>
                              {u.leaseEnd}
                            </span>
                          ) : <span className="text-slate-700">—</span>}
                        </td>
                        <td className={`px-3 py-2.5 text-xs whitespace-nowrap font-semibold ${(u.balance ?? 0) > 0 ? "text-red-400" : (u.balance ?? 0) < 0 ? "text-emerald-400" : "text-slate-600"}`}>
                          {fmtCurrency(u.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Showing {filtered.length} of {units.length} units.
                {pbv.length > 0 && <span className="ml-2 text-purple-500">{pbv.length} Project-Based Voucher units highlighted in purple.</span>}
                {" "}Leases expiring within 60 days shown in amber; expired in red.
              </p>
            </section>
          </>
        )}

        {/* About section (always visible) */}
        <section className="bg-[#0F1729] border border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-slate-300 mb-3">About Rent Rolls in LIHTC Development</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400 leading-relaxed">
            <div>
              <p className="font-semibold text-teal-400 mb-1">Underwriting & Feasibility</p>
              <p>Lenders and syndicators require a current rent roll to verify gross potential rent, physical occupancy, economic vacancy, and net operating income during underwriting. At least 90% occupancy is typically required for a LIHTC deal to be in compliance.</p>
            </div>
            <div>
              <p className="font-semibold text-emerald-400 mb-1">Compliance Monitoring</p>
              <p>For existing LIHTC properties, the rent roll confirms that rents do not exceed the applicable MTSP/FMR limits for each unit's AMI set-aside (50% or 60% AMI). PBV units must be tracked separately per HAP contract requirements.</p>
            </div>
            <div>
              <p className="font-semibold text-amber-400 mb-1">Investor Reporting</p>
              <p>Tax credit investors require quarterly or annual rent rolls as part of Asset Management reporting. The rent roll confirms the property is maintaining occupancy, collecting rents, and meeting Extended Use Agreement obligations throughout the compliance period.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
