"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import type { CompanyDocument, CompanyDocumentType } from "@/types";
import { COMPANY_DOCUMENT_TYPES } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type ExpiryStatus = "expired" | "expiring_soon" | "ok" | "none";

function expiryStatus(expiresAt: string | null): ExpiryStatus {
  if (!expiresAt) return "none";
  const diff = new Date(expiresAt + "T23:59:59").getTime() - Date.now();
  if (diff < 0) return "expired";
  if (diff < 30 * 24 * 60 * 60 * 1000) return "expiring_soon";
  return "ok";
}

function getMeta(type: CompanyDocumentType) {
  return COMPANY_DOCUMENT_TYPES.find((t) => t.value === type) ?? COMPANY_DOCUMENT_TYPES.at(-1)!;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: CompanyDocumentType }) {
  const meta = getMeta(type);
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-900/40 text-teal-300 border border-teal-800/50 whitespace-nowrap">
      {meta.icon} {meta.label}
    </span>
  );
}

function ExpiryBadge({ expiresAt }: { expiresAt: string | null }) {
  const status = expiryStatus(expiresAt);
  if (status === "none") return null;
  if (status === "expired") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-900/40 text-red-300 border border-red-700/40">
        ⚠ Expired {fmtDate(expiresAt!)}
      </span>
    );
  }
  if (status === "expiring_soon") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-900/40 text-amber-300 border border-amber-700/40">
        ⏰ Expires {fmtDate(expiresAt!)}
      </span>
    );
  }
  return (
    <span className="text-[10px] text-slate-500">
      Expires {fmtDate(expiresAt!)}
    </span>
  );
}

// ── Upload Modal ──────────────────────────────────────────────────────────────

interface UploadModalProps {
  onClose: () => void;
  onSuccess: (doc: CompanyDocument) => void;
  defaultType?: CompanyDocumentType;
}

function UploadModal({ onClose, onSuccess, defaultType }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [docType, setDocType] = useState<CompanyDocumentType>(defaultType ?? "other");
  const [docName, setDocName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChosen(f: File) {
    setFile(f);
    // Pre-fill doc name from filename (strip extension)
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
      // Step 1: get signed upload URL
      const urlRes = await fetch("/api/documents/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, content_type: file.type }),
      });
      if (!urlRes.ok) throw new Error((await urlRes.json() as { error: string }).error);
      const { upload_url, file_path } = await urlRes.json() as { upload_url: string; file_path: string };
      setProgress(30);

      // Step 2: PUT file directly to Supabase Storage via the signed URL
      const putRes = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type, "x-upsert": "true" },
        body: file,
      });
      if (!putRes.ok) throw new Error(`Storage upload failed: ${putRes.statusText}`);
      setProgress(70);

      // Step 3: create the DB record
      const docRes = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_type: docType,
          document_name: docName.trim(),
          file_path,
          file_url:   "",  // signed_url is generated at query time
          file_size:  file.size,
          expires_at: expiresAt || null,
          notes:      notes.trim() || null,
        }),
      });
      if (!docRes.ok) throw new Error((await docRes.json() as { error: string }).error);
      const { document } = await docRes.json() as { document: CompanyDocument };
      setProgress(100);
      onSuccess(document);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setProgress(0);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#0F1729] border border-slate-700 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
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

          {/* Document type */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Document Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as CompanyDocumentType)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-600"
            >
              {COMPANY_DOCUMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
              ))}
            </select>
          </div>

          {/* Document name */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Document Name</label>
            <input
              type="text"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="e.g. Acme Housing W-9 2026"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-600"
            />
          </div>

          {/* Expiration date */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Expiration Date <span className="text-slate-600 font-normal">(optional)</span>
            </label>
            <input
              type="date"
              value={expiresAt}
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
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any notes about this document…"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-600 resize-none"
            />
          </div>

          {/* Progress bar */}
          {uploading && (
            <div className="w-full bg-slate-800 rounded-full h-1.5">
              <div
                className="bg-teal-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
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

// ── Document Card ─────────────────────────────────────────────────────────────

function DocumentCard({
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

  const cardBorder =
    status === "expired"       ? "border-red-700/40" :
    status === "expiring_soon" ? "border-amber-700/40" :
                                  "border-slate-800";

  return (
    <div className={`bg-[#0F1729] border ${cardBorder} rounded-xl p-4 flex flex-col gap-3 hover:border-slate-700 transition-colors`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{doc.document_name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{fmtDate(doc.uploaded_at)}</p>
        </div>
        <div className="shrink-0 flex gap-1.5">
          {/* Download */}
          {doc.signed_url && (
            <a
              href={doc.signed_url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-300 hover:bg-teal-900/30 transition-colors"
              title="Download"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>
          )}
          {/* Delete */}
          <button
            onClick={handleDelete} disabled={deleting}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-40"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <TypeBadge type={doc.document_type} />
        <ExpiryBadge expiresAt={doc.expires_at} />
      </div>

      {/* Footer: file size + notes */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{fmtBytes(doc.file_size)}</span>
        {doc.notes && (
          <span className="truncate max-w-[180px] italic" title={doc.notes}>{doc.notes}</span>
        )}
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({
  type,
  onUpload,
}: {
  type: CompanyDocumentType | "all";
  onUpload: () => void;
}) {
  const meta = type !== "all" ? getMeta(type) : null;
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-3">{meta?.icon ?? "📁"}</div>
      <p className="text-slate-300 font-semibold mb-1">
        {meta ? `No ${meta.label} documents yet` : "No documents yet"}
      </p>
      <p className="text-slate-500 text-sm max-w-sm mb-5">
        {meta
          ? meta.description
          : "Upload your company's standard government-required documents here. They'll be organized by type and accessible from any project."}
      </p>
      <button
        onClick={onUpload}
        className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-sm font-semibold transition-colors"
      >
        Upload your first document
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [loading, setLoading]     = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadType, setUploadType] = useState<CompanyDocumentType | undefined>();
  const [typeFilter, setTypeFilter] = useState<CompanyDocumentType | "all">("all");
  const [search, setSearch]         = useState("");

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const url = typeFilter !== "all"
        ? `/api/documents?type=${typeFilter}`
        : "/api/documents";
      const res = await fetch(url);
      if (res.ok) {
        const { documents: docs } = await res.json() as { documents: CompanyDocument[] };
        setDocuments(docs);
      }
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => { void loadDocuments(); }, [loadDocuments]);

  function handleUploadSuccess(doc: CompanyDocument) {
    setUploadOpen(false);
    setUploadType(undefined);
    // Refresh so we get the signed URL attached
    void loadDocuments();
  }

  function handleDelete(id: string) {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  // Client-side text search on top of server-side type filter
  const filtered = search.trim()
    ? documents.filter((d) =>
        d.document_name.toLowerCase().includes(search.toLowerCase()) ||
        getMeta(d.document_type).label.toLowerCase().includes(search.toLowerCase()) ||
        (d.notes ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : documents;

  // Expiry alerts
  const expiredDocs      = documents.filter((d) => expiryStatus(d.expires_at) === "expired");
  const expiringSoonDocs = documents.filter((d) => expiryStatus(d.expires_at) === "expiring_soon");

  return (
    <div className="min-h-screen bg-[#080E1A] text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#080E1A]/90 backdrop-blur-sm sticky top-0 z-20 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm transition-colors">Back</Link>
            <span className="text-slate-700">/</span>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <h1 className="text-lg font-bold">Document Repository</h1>
            </div>
          </div>
          <button
            onClick={() => { setUploadType(undefined); setUploadOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload Document
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* Expiry alerts banner */}
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

        {/* Search + filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search documents…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#0F1729] border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-700"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as CompanyDocumentType | "all")}
            className="bg-[#0F1729] border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-teal-700"
          >
            <option value="all">All Types</option>
            {COMPANY_DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
            ))}
          </select>
        </div>

        {/* Category tiles — quick-upload shortcuts */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Document Categories</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {COMPANY_DOCUMENT_TYPES.map((t) => {
              const count = documents.filter((d) => d.document_type === t.value).length;
              const hasExpired = documents.some(
                (d) => d.document_type === t.value && expiryStatus(d.expires_at) === "expired"
              );
              const hasExpiring = documents.some(
                (d) => d.document_type === t.value && expiryStatus(d.expires_at) === "expiring_soon"
              );
              const active = typeFilter === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setTypeFilter(active ? "all" : t.value)}
                  className={`relative text-left px-3 py-3 rounded-xl border transition-colors text-xs group ${
                    active
                      ? "bg-teal-900/40 border-teal-700/60 text-teal-200"
                      : "bg-[#0F1729] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <span className="text-base block mb-1">{t.icon}</span>
                  <span className="font-semibold block truncate">{t.label}</span>
                  <span className={`block mt-0.5 ${active ? "text-teal-400" : "text-slate-600"}`}>
                    {count} file{count !== 1 ? "s" : ""}
                  </span>
                  {/* Expiry dot indicator */}
                  {(hasExpired || hasExpiring) && (
                    <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${hasExpired ? "bg-red-500" : "bg-amber-500"}`} />
                  )}
                  {/* Quick-upload on hover */}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); setUploadType(t.value); setUploadOpen(true); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); setUploadType(t.value); setUploadOpen(true); } }}
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-teal-400 hover:text-teal-300"
                    title={`Upload ${t.label}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Documents grid */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              {typeFilter === "all"
                ? `All Documents (${filtered.length})`
                : `${getMeta(typeFilter).label} (${filtered.length})`}
            </h2>
            {filtered.length > 0 && (
              <p className="text-xs text-slate-600">{documents.length} total</p>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-[#0F1729] border border-slate-800 rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-slate-800 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-slate-800 rounded w-1/2 mb-3" />
                  <div className="h-5 bg-slate-800 rounded-full w-1/3" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              type={typeFilter}
              onUpload={() => { setUploadType(typeFilter !== "all" ? typeFilter : undefined); setUploadOpen(true); }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </section>

        {/* Template Library */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Template Library</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                name: "Rent Schedule Template",
                description: "Track units, tenants, and rent collection",
                icon: "🏠",
                badge: "Rental Application",
                href: "/templates/Rent_Schedule_Template.xlsx",
                filename: "Rent_Schedule_Template.xlsx",
                type: "Excel (.xlsx)",
              },
              {
                name: "Annual Inspection Report",
                description: "Comprehensive property inspection checklist for compliance",
                icon: "🔍",
                badge: "Annual Inspection",
                href: "/templates/Annual_Inspection_Template.xlsx",
                filename: "Annual_Inspection_Template.xlsx",
                type: "Excel (.xlsx)",
              },
            ].map((tpl) => (
              <div key={tpl.name} className="bg-[#0F1729] border border-slate-800 rounded-xl p-4 flex items-start gap-4 hover:border-teal-800/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-teal-900/30 border border-teal-800/40 flex items-center justify-center text-xl shrink-0">
                  {tpl.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{tpl.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{tpl.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-900/40 text-teal-400 border border-teal-800/40 font-semibold">
                      {tpl.badge}
                    </span>
                    <span className="text-[10px] text-slate-600">{tpl.type}</span>
                  </div>
                </div>
                <a
                  href={tpl.href}
                  download={tpl.filename}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-800/40 hover:bg-teal-700/50 text-teal-300 text-xs font-semibold border border-teal-700/40 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Info cards for each document type */}
        {typeFilter === "all" && documents.length === 0 && !loading && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">What documents belong here?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {COMPANY_DOCUMENT_TYPES.filter((t) => t.value !== "other").map((t) => (
                <div key={t.value} className="bg-[#0F1729] border border-slate-800 rounded-xl px-4 py-3 flex gap-3 items-start">
                  <span className="text-xl shrink-0 mt-0.5">{t.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{t.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Upload modal */}
      {uploadOpen && (
        <UploadModal
          defaultType={uploadType}
          onClose={() => { setUploadOpen(false); setUploadType(undefined); }}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
