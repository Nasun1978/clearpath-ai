"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import type { CompanyDocument, CompanyDocumentType } from "@/types";

// ── Folder structure definition ───────────────────────────────────────────────

interface DocumentSubfolder {
  path: string;
  label: string;
  description: string;
  templates?: { name: string; url: string }[];
}

interface FolderGroupDef {
  id: string;
  label: string;
  icon: string;
  borderColor: string;
  hoverBg: string;
  accentText: string;
  subfolders: DocumentSubfolder[];
}

const FOLDER_GROUPS: FolderGroupDef[] = [
  {
    id: "funding_sources",
    label: "Funding Sources",
    icon: "💰",
    borderColor: "border-teal-800/60",
    hoverBg: "hover:bg-teal-900/20",
    accentText: "text-teal-400",
    subfolders: [
      { path: "funding_sources/tax_credit_application",  label: "Tax Credit Application",   description: "LIHTC allocation letters, 8609 forms, carryover docs" },
      { path: "funding_sources/tax_exempt_bonds",         label: "Tax-Exempt Bonds",          description: "Bond documents, inducement resolutions, bond counsel opinions" },
      { path: "funding_sources/home_funds",               label: "HOME Funds",                description: "HOME agreement, compliance docs, drawdown requests" },
      { path: "funding_sources/housing_trust_fund",       label: "Housing Trust Fund",        description: "HTF application, award letter, reporting" },
      { path: "funding_sources/pilot_agreement",          label: "PILOT Agreement",           description: "PILOT application, council resolution, annual certifications" },
      { path: "funding_sources/project_based_vouchers",  label: "Project Based Vouchers",    description: "HAP contract, AHAP, PBV commitment letter" },
      { path: "funding_sources/permanent_loan",           label: "Permanent Loan",            description: "Loan commitment, closing docs, promissory note" },
      { path: "funding_sources/general_obligation_bonds", label: "General Obligation Bonds",  description: "GO bond authorization, draw schedule" },
      { path: "funding_sources/other",                    label: "Other Funding Sources",     description: "Other funding source documentation" },
    ],
  },
  {
    id: "construction",
    label: "Construction",
    icon: "🏗️",
    borderColor: "border-amber-800/60",
    hoverBg: "hover:bg-amber-900/20",
    accentText: "text-amber-400",
    subfolders: [
      { path: "construction/documents",      label: "Construction Documents", description: "Plans, specifications, drawings, as-builts" },
      {
        path: "construction/contracts",
        label: "Construction Contracts",
        description: "GC contract, schedule of values, change orders, draw requests",
        templates: [
          { name: "Construction Draw Template (Excel)", url: "/api/templates/construction-draw" },
        ],
      },
      { path: "construction/davis_bacon",    label: "Davis-Bacon Wages",      description: "Wage determinations, certified payroll, employee interviews" },
      { path: "construction/dbe_mbe_wbe",    label: "DBE/MBE/WBE",           description: "DBE plan, certifications, utilization reports, good faith efforts" },
      { path: "construction/building_permits", label: "Building Permits",     description: "Permit applications, approvals, inspections" },
      { path: "construction/insurance",      label: "Insurance",              description: "Builder's risk, GL, workers comp certificates" },
    ],
  },
  {
    id: "third_party_vendors",
    label: "Third Party Vendors",
    icon: "🤝",
    borderColor: "border-violet-800/60",
    hoverBg: "hover:bg-violet-900/20",
    accentText: "text-violet-400",
    subfolders: [
      { path: "third_party_vendors/architect",             label: "Architect",              description: "Design contract, drawings, specifications, AIA documents" },
      { path: "third_party_vendors/engineer",              label: "Engineer",               description: "Civil, structural, MEP contracts and reports" },
      { path: "third_party_vendors/accountant",            label: "Accountant/CPA",         description: "Audit engagement, cost certifications, tax returns" },
      { path: "third_party_vendors/legal",                 label: "Legal/Attorney",         description: "Partnership agreement, title, closing docs, opinion letters" },
      { path: "third_party_vendors/environmental",         label: "Environmental",          description: "Phase I, Phase II, asbestos/lead reports, remediation" },
      { path: "third_party_vendors/appraiser",             label: "Appraiser",              description: "Appraisal report, market study" },
      { path: "third_party_vendors/property_management",  label: "Property Management",    description: "Management agreement, policies, staffing plan" },
      { path: "third_party_vendors/market_analyst",        label: "Market Analyst",         description: "Market study, demand analysis" },
      { path: "third_party_vendors/surveyor",              label: "Surveyor",               description: "Survey, ALTA, boundary" },
      { path: "third_party_vendors/title_company",         label: "Title Company",          description: "Title commitment, title policy, endorsements" },
      { path: "third_party_vendors/tax_credit_syndicator", label: "Tax Credit Syndicator",  description: "Partnership agreement, investor docs, pay-in schedule" },
      { path: "third_party_vendors/other",                 label: "Other Vendors",          description: "Other vendor documentation" },
    ],
  },
  {
    id: "company_documents",
    label: "Company Documents",
    icon: "🏢",
    borderColor: "border-slate-700",
    hoverBg: "hover:bg-slate-800/40",
    accentText: "text-slate-400",
    subfolders: [
      { path: "company_documents/w9",                label: "W-9 Form",                   description: "IRS Request for Taxpayer Identification Number and Certification" },
      { path: "company_documents/board_resolution",  label: "Board Resolution",            description: "Corporate authorization for transactions, signatories, or actions" },
      { path: "company_documents/tax_clearance",     label: "Tax Clearance Certificate",   description: "State-issued proof of no outstanding tax liabilities" },
      { path: "company_documents/affidavit_work_site", label: "Affidavit of Work Site",   description: "Sworn statement confirming work site location and conditions" },
      { path: "company_documents/good_standing",     label: "Good Standing Certificate",   description: "Secretary of State confirmation that entity is active and compliant" },
      { path: "company_documents/annual_inspection", label: "Annual Inspection Report",    description: "Property inspection results required by housing agencies" },
      { path: "company_documents/rental_application", label: "Rental Application Template", description: "Standard application form used for prospective tenants" },
      { path: "company_documents/tenant_documents",  label: "Tenant Documents",            description: "ID, income verification, and other tenant eligibility documents" },
      { path: "company_documents/other",             label: "Other",                       description: "Other company documents" },
    ],
  },
];

// Map legacy document_type to folder_path for pre-migration documents
function getEffectiveFolderPath(doc: CompanyDocument): string {
  if (doc.folder_path) return doc.folder_path;
  const map: Partial<Record<CompanyDocumentType, string>> = {
    w9:                  "company_documents/w9",
    board_resolution:    "company_documents/board_resolution",
    tax_clearance:       "company_documents/tax_clearance",
    affidavit_work_site: "company_documents/affidavit_work_site",
    good_standing:       "company_documents/good_standing",
    annual_inspection:   "company_documents/annual_inspection",
    rental_application:  "company_documents/rental_application",
    tenant_id:           "company_documents/tenant_documents",
    tenant_income:       "company_documents/tenant_documents",
    other:               "company_documents/other",
  };
  return map[doc.document_type] ?? "company_documents/other";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type ExpiryStatus = "expired" | "expiring_soon" | "ok" | "none";

function expiryStatus(expiresAt: string | null): ExpiryStatus {
  if (!expiresAt) return "none";
  const diff = new Date(expiresAt + "T23:59:59").getTime() - Date.now();
  if (diff < 0) return "expired";
  if (diff < 30 * 86_400_000) return "expiring_soon";
  return "ok";
}

function docMatchesSearch(doc: CompanyDocument, q: string): boolean {
  if (!q.trim()) return true;
  const lower = q.toLowerCase();
  return (
    doc.document_name.toLowerCase().includes(lower) ||
    (doc.notes ?? "").toLowerCase().includes(lower)
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function FolderIcon({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
      )}
    </svg>
  );
}

// ── Upload Modal ──────────────────────────────────────────────────────────────

interface UploadModalProps {
  onClose: () => void;
  onSuccess: (doc: CompanyDocument) => void;
  defaultFolderPath?: string;
  defaultFile?: File;
}

function UploadModal({ onClose, onSuccess, defaultFolderPath, defaultFile }: UploadModalProps) {
  const defaultPath = defaultFolderPath ?? FOLDER_GROUPS[0].subfolders[0].path;
  const [file, setFile] = useState<File | null>(defaultFile ?? null);
  const [dragging, setDragging] = useState(false);
  const [folderPath, setFolderPath] = useState<string>(defaultPath);
  const [docName, setDocName] = useState(defaultFile ? defaultFile.name.replace(/\.[^.]+$/, "") : "");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChosen(f: File) {
    setFile(f);
    if (!docName) setDocName(f.name.replace(/\.[^.]+$/, ""));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError("Please select a file"); return; }
    if (!docName.trim()) { setError("Document name is required"); return; }
    setUploading(true);
    setError(null);
    setProgress(10);
    try {
      const urlRes = await fetch("/api/documents/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, content_type: file.type }),
      });
      if (!urlRes.ok) throw new Error((await urlRes.json() as { error: string }).error);
      const { upload_url, file_path } = await urlRes.json() as { upload_url: string; file_path: string };
      setProgress(30);

      const putRes = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type, "x-upsert": "true" },
        body: file,
      });
      if (!putRes.ok) throw new Error(`Storage upload failed: ${putRes.statusText}`);
      setProgress(70);

      const docRes = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_name: docName.trim(),
          file_path,
          file_url: "",
          file_size: file.size,
          expires_at: expiresAt || null,
          notes: notes.trim() || null,
          folder_path: folderPath,
        }),
      });
      if (!docRes.ok) throw new Error((await docRes.json() as { error: string }).error);
      const { document: doc } = await docRes.json() as { document: CompanyDocument };
      setProgress(100);
      onSuccess(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setProgress(0);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#0F1729] border border-slate-700 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-[#0F1729] z-10">
          <h2 className="font-bold text-white">Upload Document</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              dragging ? "border-teal-500 bg-teal-900/10" : "border-slate-700 hover:border-teal-700/60"
            }`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFileChosen(f); }}
          >
            <input
              ref={inputRef} type="file" className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
              onChange={(e) => { if (e.target.files?.[0]) handleFileChosen(e.target.files[0]); }}
            />
            {file ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div className="text-left">
                  <p className="text-sm font-semibold text-teal-300 truncate max-w-[300px]">{file.name}</p>
                  <p className="text-xs text-slate-500">{fmtBytes(file.size)}</p>
                </div>
              </div>
            ) : (
              <>
                <svg className="w-8 h-8 text-slate-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-slate-400 text-sm">Drop file here or click to browse</p>
                <p className="text-slate-600 text-xs mt-1">PDF, Word, Excel, or image — max 50 MB</p>
              </>
            )}
          </div>

          {/* Folder picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Destination Folder</label>
            <select
              value={folderPath}
              onChange={(e) => setFolderPath(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-600"
            >
              {FOLDER_GROUPS.map((g) => (
                <optgroup key={g.id} label={g.label}>
                  {g.subfolders.map((s) => (
                    <option key={s.path} value={s.path}>{s.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Document name */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Document Name</label>
            <input
              type="text" value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="e.g. Allocation Letter 2026"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-600"
            />
          </div>

          {/* Expiration date */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Expiration Date <span className="text-slate-600 font-normal">(optional)</span>
            </label>
            <input
              type="date" value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-600"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Notes <span className="text-slate-600 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any notes about this document…"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-600 resize-none"
            />
          </div>

          {uploading && (
            <div className="w-full bg-slate-800 rounded-full h-1.5">
              <div className="bg-teal-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          )}
          {error && (
            <p className="text-xs text-red-400 bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 text-sm hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={uploading}
              className="flex-1 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Document Row ──────────────────────────────────────────────────────────────

function DocumentRow({
  doc,
  onDelete,
}: {
  doc: CompanyDocument;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const status = expiryStatus(doc.expires_at);

  async function handleDelete() {
    if (!confirm(`Delete "${doc.document_name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
      if (res.ok || res.status === 204) onDelete(doc.id);
      else {
        const j = await res.json() as { error: string };
        alert(j.error ?? "Delete failed");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors group ${
      status === "expired"       ? "border-l-2 border-l-red-600/60 ml-px" :
      status === "expiring_soon" ? "border-l-2 border-l-amber-600/60 ml-px" : ""
    }`}>
      <FileIcon className="w-3.5 h-3.5 text-slate-600 shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 truncate leading-snug">{doc.document_name}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-600">{fmtBytes(doc.file_size)}</span>
          <span className="text-slate-800 text-xs">·</span>
          <span className="text-xs text-slate-600">{fmtDate(doc.uploaded_at)}</span>
          {status === "expired" && (
            <span className="text-xs text-red-400">· Expired {fmtDate(doc.expires_at!)}</span>
          )}
          {status === "expiring_soon" && (
            <span className="text-xs text-amber-400">· Expires {fmtDate(doc.expires_at!)}</span>
          )}
          {doc.notes && (
            <span className="text-xs text-slate-600 truncate max-w-[140px] italic" title={doc.notes}>{doc.notes}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {doc.signed_url && (
          <a
            href={doc.signed_url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded text-slate-500 hover:text-teal-300 hover:bg-teal-900/30 transition-colors"
            title="Download"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </a>
        )}
        <button
          onClick={handleDelete} disabled={deleting}
          className="p-1.5 rounded text-slate-600 hover:text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-40"
          title="Delete"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Subfolder Row ─────────────────────────────────────────────────────────────

function SubfolderRow({
  subfolder,
  docs,
  onUpload,
  onDelete,
  isOpen,
  onToggle,
  search,
}: {
  subfolder: DocumentSubfolder;
  docs: CompanyDocument[];
  onUpload: (folderPath: string, file?: File) => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  search: string;
}) {
  const [dragOver, setDragOver] = useState(false);

  const hasMatches = search.trim()
    ? docs.some((d) => docMatchesSearch(d, search))
    : false;
  const effectiveIsOpen = (search.trim().length > 0 && hasMatches) || isOpen;

  const visibleDocs = search.trim()
    ? docs.filter((d) => docMatchesSearch(d, search))
    : docs;

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    onUpload(subfolder.path, f ?? undefined);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
  }

  return (
    <div className="mb-px">
      {/* Subfolder header */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all group ${
          dragOver
            ? "bg-teal-900/30 ring-1 ring-teal-700/50"
            : "hover:bg-slate-800/50"
        }`}
        onClick={onToggle}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <FolderIcon
          open={effectiveIsOpen}
          className="w-4 h-4 text-slate-500 shrink-0 group-hover:text-slate-400 transition-colors"
        />
        <span className="flex-1 text-sm text-slate-400 group-hover:text-slate-200 transition-colors truncate">
          {subfolder.label}
        </span>
        {docs.length > 0 && (
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-500 border border-slate-700/60 shrink-0">
            {docs.length}
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onUpload(subfolder.path); }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-600 hover:text-teal-400 hover:bg-teal-900/30 transition-all shrink-0"
          title={`Upload to ${subfolder.label}`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <svg
          className={`w-3.5 h-3.5 text-slate-700 transition-transform shrink-0 ${effectiveIsOpen ? "rotate-90" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* Expanded content */}
      {effectiveIsOpen && (
        <div className="ml-6 mt-0.5 mb-1.5">
          {/* Downloadable templates for this subfolder */}
          {subfolder.templates && subfolder.templates.length > 0 && (
            <div className="mb-2 flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-900/10 border border-amber-800/30">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-500/80 mr-1">
                Templates
              </span>
              {subfolder.templates.map((t) => (
                <a
                  key={t.url}
                  href={t.url}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-900/30 hover:bg-amber-800/40 border border-amber-700/50 text-[11px] font-medium text-amber-200 hover:text-amber-100 transition-colors"
                  download
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  {t.name}
                </a>
              ))}
            </div>
          )}

          {visibleDocs.length > 0 ? (
            <div className="space-y-px">
              {visibleDocs.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} onDelete={onDelete} />
              ))}
            </div>
          ) : (
            !search.trim() && (
              <p className="text-xs text-slate-700 px-3 py-1 italic">No documents yet</p>
            )
          )}

          {/* Drop zone */}
          <div
            className="mt-1.5 rounded-lg border border-dashed border-slate-800 hover:border-teal-800/50 transition-colors cursor-pointer py-2.5 px-3 text-center"
            onClick={() => onUpload(subfolder.path)}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <p className="text-xs text-slate-700">
              Drop files here or{" "}
              <span className="text-teal-700 hover:text-teal-500 transition-colors">click to upload</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Folder Group ──────────────────────────────────────────────────────────────

function FolderGroup({
  group,
  docs,
  onUpload,
  onDelete,
  search,
}: {
  group: FolderGroupDef;
  docs: CompanyDocument[];
  onUpload: (folderPath: string, file?: File) => void;
  onDelete: (id: string) => void;
  search: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openSubfolders, setOpenSubfolders] = useState<Set<string>>(new Set());

  const hasSearchMatches = search.trim()
    ? docs.some((d) => docMatchesSearch(d, search))
    : false;
  const effectiveIsOpen = (search.trim().length > 0 && hasSearchMatches) || isOpen;

  function toggleSubfolder(path: string) {
    setOpenSubfolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  return (
    <div className={`bg-[#0F1729] border ${group.borderColor} rounded-xl overflow-hidden`}>
      {/* Group header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 px-5 py-4 ${group.hoverBg} transition-colors`}
      >
        <span className="text-lg shrink-0">{group.icon}</span>
        <span className="flex-1 text-left font-bold text-white tracking-widest text-xs uppercase">
          {group.label}
        </span>
        {docs.length > 0 && (
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800/80 border border-slate-700 shrink-0 ${group.accentText}`}>
            {docs.length} {docs.length === 1 ? "file" : "files"}
          </span>
        )}
        <svg
          className={`w-4 h-4 text-slate-600 transition-transform shrink-0 ${effectiveIsOpen ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Subfolders */}
      {effectiveIsOpen && (
        <div className="border-t border-slate-800/50 px-3 py-2 space-y-px">
          {group.subfolders.map((subfolder) => {
            const subDocs = docs.filter((d) => getEffectiveFolderPath(d) === subfolder.path);
            return (
              <SubfolderRow
                key={subfolder.path}
                subfolder={subfolder}
                docs={subDocs}
                onUpload={onUpload}
                onDelete={onDelete}
                isOpen={openSubfolders.has(subfolder.path)}
                onToggle={() => toggleSubfolder(subfolder.path)}
                search={search}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFolderPath, setUploadFolderPath] = useState<string | undefined>();
  const [uploadFile, setUploadFile] = useState<File | undefined>();
  const [search, setSearch] = useState("");

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        const { documents: docs } = await res.json() as { documents: CompanyDocument[] };
        setDocuments(docs);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadDocuments(); }, [loadDocuments]);

  function openUpload(folderPath?: string, file?: File) {
    setUploadFolderPath(folderPath);
    setUploadFile(file);
    setUploadOpen(true);
  }

  function handleUploadSuccess() {
    setUploadOpen(false);
    setUploadFolderPath(undefined);
    setUploadFile(undefined);
    void loadDocuments();
  }

  function handleDelete(id: string) {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  const expiredDocs      = documents.filter((d) => expiryStatus(d.expires_at) === "expired");
  const expiringSoonDocs = documents.filter((d) => expiryStatus(d.expires_at) === "expiring_soon");

  const foldersWithDocs = FOLDER_GROUPS.reduce((acc, g) => {
    return acc + g.subfolders.filter((s) =>
      documents.some((d) => getEffectiveFolderPath(d) === s.path)
    ).length;
  }, 0);

  return (
    <div className="min-h-screen bg-[#080E1A] text-white">
      {/* Sticky header */}
      <header className="border-b border-slate-800 bg-[#080E1A]/90 backdrop-blur-sm sticky top-0 z-20 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          {/* Nav */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm transition-colors">
              Back
            </Link>
            <span className="text-slate-700">/</span>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <h1 className="text-base font-bold">Document Repository</h1>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 relative max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search documents…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 bg-[#0F1729] border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-700 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <button
            onClick={() => openUpload()}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-3">
        {/* Expiry alerts */}
        {(expiredDocs.length > 0 || expiringSoonDocs.length > 0) && (
          <div className="space-y-2">
            {expiredDocs.length > 0 && (
              <div className="bg-red-950/30 border border-red-700/40 rounded-xl px-4 py-3 flex items-center gap-3">
                <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-red-300">
                  <span className="font-semibold">{expiredDocs.length} document{expiredDocs.length > 1 ? "s" : ""} expired:</span>{" "}
                  {expiredDocs.map((d) => d.document_name).join(", ")}
                </p>
              </div>
            )}
            {expiringSoonDocs.length > 0 && (
              <div className="bg-amber-950/30 border border-amber-700/40 rounded-xl px-4 py-3 flex items-center gap-3">
                <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-amber-300">
                  <span className="font-semibold">{expiringSoonDocs.length} document{expiringSoonDocs.length > 1 ? "s" : ""} expiring within 30 days:</span>{" "}
                  {expiringSoonDocs.map((d) => d.document_name).join(", ")}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Stats row */}
        {!loading && documents.length > 0 && (
          <p className="text-xs text-slate-600 px-1">
            {documents.length} document{documents.length !== 1 ? "s" : ""} across {foldersWithDocs} folder{foldersWithDocs !== 1 ? "s" : ""}
          </p>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#0F1729] border border-slate-800 rounded-xl animate-pulse">
                <div className="flex items-center gap-3 px-5 py-4">
                  <div className="w-5 h-5 rounded bg-slate-800" />
                  <div className="h-4 bg-slate-800 rounded flex-1" />
                  <div className="w-16 h-5 bg-slate-800 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state (no docs at all) */}
        {!loading && documents.length === 0 && !search && (
          <div className="text-center py-20">
            <svg className="w-12 h-12 text-slate-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M3 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
            <p className="text-slate-400 font-semibold mb-1">No documents yet</p>
            <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
              Upload LIHTC documents, construction contracts, vendor agreements, and company records —
              all organized in one place.
            </p>
            <button
              onClick={() => openUpload()}
              className="px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-colors"
            >
              Upload your first document
            </button>
          </div>
        )}

        {/* Search empty state */}
        {!loading && documents.length > 0 && search && !documents.some((d) => docMatchesSearch(d, search)) && (
          <div className="text-center py-12">
            <p className="text-slate-500 text-sm">No documents match &quot;{search}&quot;</p>
            <button onClick={() => setSearch("")} className="mt-2 text-xs text-teal-500 hover:text-teal-400">
              Clear search
            </button>
          </div>
        )}

        {/* Folder groups */}
        {!loading && FOLDER_GROUPS.map((group) => {
          const groupDocs = documents.filter((d) =>
            getEffectiveFolderPath(d).startsWith(group.id + "/")
          );
          // Hide group when searching and no matches
          if (search.trim() && !groupDocs.some((d) => docMatchesSearch(d, search))) return null;
          return (
            <FolderGroup
              key={group.id}
              group={group}
              docs={groupDocs}
              onUpload={openUpload}
              onDelete={handleDelete}
              search={search}
            />
          );
        })}
      </main>

      {uploadOpen && (
        <UploadModal
          defaultFolderPath={uploadFolderPath}
          defaultFile={uploadFile}
          onClose={() => {
            setUploadOpen(false);
            setUploadFolderPath(undefined);
            setUploadFile(undefined);
          }}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
