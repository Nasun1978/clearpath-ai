"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import type { VendorProfile, VendorBid, ProjectListing, VendorSubscription } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtCurrency(n: number | null): string {
  if (!n) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${(n / 1_000).toFixed(0)}K`;
}

function fmtFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const BID_STATUS_STYLE: Record<string, string> = {
  submitted:   "bg-slate-800 text-slate-300 border-slate-700",
  shortlisted: "bg-amber-900/40 text-amber-300 border-amber-700/40",
  awarded:     "bg-emerald-900/40 text-emerald-300 border-emerald-700/40",
  rejected:    "bg-red-900/30 text-red-400 border-red-700/30",
};

const PLAN_FEATURES: Record<string, { price: string; bids: string; listings: string; features: string[] }> = {
  basic: {
    price: "$29/mo",
    bids: "3 bids/month",
    listings: "5 listings/month",
    features: ["View project listings", "Submit up to 3 bids/month", "Basic vendor profile"],
  },
  professional: {
    price: "$79/mo",
    bids: "10 bids/month",
    listings: "Unlimited",
    features: ["Unlimited project viewing", "10 bids/month", "Priority badge", "Email alerts for new projects"],
  },
  premium: {
    price: "$149/mo",
    bids: "Unlimited",
    listings: "Unlimited",
    features: ["Unlimited bids", "Featured vendor listing", "Direct developer messaging", "Bid analytics"],
  },
};

interface VendorDoc {
  id: string;
  document_name: string;
  folder_path: string | null;
  file_path: string;
  file_size: number | null;
  uploaded_at: string;
  expires_at: string | null;
  notes: string | null;
  signed_url: string | null;
}

interface DocCategory {
  id: string;
  label: string;
  description: string;
  examples: string[];
  color: "amber" | "teal" | "blue";
}

const DOC_CATEGORIES: DocCategory[] = [
  {
    id: "vendor-insurance",
    label: "Insurance",
    description: "Upload your certificate of insurance (COI), general liability, workers' compensation, and professional liability certificates.",
    examples: ["Certificate of Insurance (COI)", "General Liability Policy", "Workers' Compensation Certificate", "Professional Liability / E&O"],
    color: "amber",
  },
  {
    id: "vendor-bonding",
    label: "Bonding",
    description: "Upload bonding capacity letters, surety bonds, and bid bonds to demonstrate your financial capacity for projects.",
    examples: ["Bonding Capacity Letter", "Surety Bond Certificate", "Bid Bond", "Performance & Payment Bond"],
    color: "teal",
  },
  {
    id: "vendor-experience",
    label: "Project Experience",
    description: "Upload portfolio documents, client references, and completed project summaries to showcase your track record.",
    examples: ["Project Portfolio / Case Studies", "Client References", "Completed LIHTC Project Summaries", "Awards & Certifications"],
    color: "blue",
  },
];

const COLOR_MAP = {
  amber: {
    badge: "bg-amber-900/40 text-amber-300 border-amber-700/40",
    button: "bg-amber-700 hover:bg-amber-600 text-white",
    outline: "border-amber-700/50 text-amber-300 hover:bg-amber-900/20",
    icon: "text-amber-400",
    border: "border-amber-800/40",
    header: "bg-amber-950/30",
  },
  teal: {
    badge: "bg-teal-900/40 text-teal-300 border-teal-700/40",
    button: "bg-teal-700 hover:bg-teal-600 text-white",
    outline: "border-teal-700/50 text-teal-300 hover:bg-teal-900/20",
    icon: "text-teal-400",
    border: "border-teal-800/40",
    header: "bg-teal-950/30",
  },
  blue: {
    badge: "bg-blue-900/40 text-blue-300 border-blue-700/40",
    button: "bg-blue-700 hover:bg-blue-600 text-white",
    outline: "border-blue-700/50 text-blue-300 hover:bg-blue-900/20",
    icon: "text-blue-400",
    border: "border-blue-800/40",
    header: "bg-blue-950/30",
  },
};

// ── Upload hook ───────────────────────────────────────────────────────────────

type UploadState = "idle" | "uploading" | "done" | "error";

interface UploadStatus {
  state: UploadState;
  error?: string;
}

function useDocUpload(folderPath: string, onComplete: (doc: VendorDoc) => void) {
  const [status, setStatus] = useState<UploadStatus>({ state: "idle" });

  const upload = useCallback(async (file: File, docName: string) => {
    setStatus({ state: "uploading" });
    try {
      // Step 1: get signed upload URL
      const urlRes = await fetch("/api/documents/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, content_type: file.type || "application/octet-stream" }),
      });
      if (!urlRes.ok) {
        const { error } = await urlRes.json() as { error: string };
        throw new Error(error);
      }
      const { upload_url, file_path } = await urlRes.json() as { upload_url: string; file_path: string; token: string };

      // Step 2: PUT file to storage
      const putRes = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!putRes.ok) throw new Error("Storage upload failed");

      // Step 3: save document record
      const docRes = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_name: docName,
          document_type: "other",
          file_path,
          file_size: file.size,
          folder_path: folderPath,
        }),
      });
      if (!docRes.ok) {
        const { error } = await docRes.json() as { error: string };
        throw new Error(error);
      }
      const { document } = await docRes.json() as { document: VendorDoc };
      setStatus({ state: "done" });
      onComplete(document);
    } catch (err) {
      setStatus({ state: "error", error: err instanceof Error ? err.message : "Upload failed" });
    }
  }, [folderPath, onComplete]);

  function reset() { setStatus({ state: "idle" }); }

  return { status, upload, reset };
}

// ── Delete helper ─────────────────────────────────────────────────────────────

async function deleteDoc(id: string): Promise<boolean> {
  const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
  return res.ok;
}

// ── DocUploadCard ─────────────────────────────────────────────────────────────

function DocUploadCard({ category, docs, onUploaded, onDeleted }: {
  category: DocCategory;
  docs: VendorDoc[];
  onUploaded: (doc: VendorDoc) => void;
  onDeleted: (id: string) => void;
}) {
  const [docName, setDocName] = useState("");
  const [dragging, setDragging] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const c = COLOR_MAP[category.color];

  const { status, upload, reset } = useDocUpload(category.id, (doc) => {
    onUploaded(doc);
    setDocName("");
    reset();
    setTimeout(reset, 1500);
  });

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0]!;
    const name = docName.trim() || file.name.replace(/\.[^.]+$/, "");
    void upload(file, name);
  }

  function onDragEnter(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current++;
    setDragging(true);
  }
  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragging(false);
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const ok = await deleteDoc(id);
    if (ok) onDeleted(id);
    setDeletingId(null);
  }

  const uploading = status.state === "uploading";

  return (
    <div className={`bg-[#0F1729] border rounded-xl overflow-hidden ${c.border}`}>
      {/* Header */}
      <div className={`px-5 py-4 border-b ${c.header} ${c.border}`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-white text-sm">{category.label}</h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{category.description}</p>
          </div>
          <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.badge}`}>
            {docs.length} {docs.length === 1 ? "file" : "files"}
          </span>
        </div>
        {/* Examples */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {category.examples.map((ex) => (
            <span key={ex} className="text-[10px] bg-slate-800/80 text-slate-400 border border-slate-700/50 px-2 py-0.5 rounded-full">
              {ex}
            </span>
          ))}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Uploaded docs */}
        {docs.length > 0 && (
          <ul className="space-y-2">
            {docs.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2.5 group">
                <svg className={`w-4 h-4 shrink-0 ${c.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate">{doc.document_name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {fmtDate(doc.uploaded_at)}
                    {doc.file_size ? ` · ${fmtFileSize(doc.file_size)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {doc.signed_url && (
                    <a
                      href={doc.signed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-slate-400 hover:text-white border border-slate-700 px-2 py-1 rounded-md transition-colors"
                    >
                      View
                    </a>
                  )}
                  <button
                    onClick={() => void handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="text-[10px] text-red-400 hover:text-red-300 border border-red-900/40 px-2 py-1 rounded-md transition-colors disabled:opacity-50"
                  >
                    {deletingId === doc.id ? "…" : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Upload area */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Document Label (optional)
          </label>
          <input
            type="text"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            placeholder="e.g. General Liability Certificate 2025"
            disabled={uploading}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-slate-500 disabled:opacity-50 mb-2"
          />

          <div
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => !uploading && fileRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors select-none ${
              dragging
                ? `border-${category.color}-500 bg-${category.color}-900/10`
                : uploading
                ? "border-slate-700 bg-slate-900/30 cursor-not-allowed"
                : "border-slate-700 hover:border-slate-600 bg-slate-900/30"
            }`}
          >
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx,.xls"
              onChange={(e) => handleFiles(e.target.files)}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 border-slate-600 border-t-white rounded-full animate-spin" />
                <p className="text-xs text-slate-400">Uploading…</p>
              </div>
            ) : status.state === "done" ? (
              <div className="flex flex-col items-center gap-1">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-xs text-emerald-400 font-semibold">Uploaded!</p>
              </div>
            ) : (
              <>
                <svg className="w-6 h-6 text-slate-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <p className="text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Click to upload</span> or drag & drop
                </p>
                <p className="text-[10px] text-slate-600 mt-1">PDF, DOC, DOCX, PNG, JPG, XLSX</p>
              </>
            )}
          </div>
          {status.state === "error" && (
            <p className="text-[10px] text-red-400 mt-1.5">{status.error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type TabId = "bids" | "projects" | "profile" | "plan";

export default function VendorDashboardPage() {
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [subscription, setSubscription] = useState<VendorSubscription | null>(null);
  const [myBids, setMyBids] = useState<(VendorBid & { listing?: ProjectListing })[]>([]);
  const [availableProjects, setAvailableProjects] = useState<ProjectListing[]>([]);
  const [vendorDocs, setVendorDocs] = useState<VendorDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("bids");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [profileRes, listingsRes] = await Promise.all([
          fetch("/api/vendor/profile"),
          fetch("/api/marketplace/listings?status=open"),
        ]);

        if (profileRes.ok) {
          const { profile: p, subscription: sub } = await profileRes.json() as {
            profile: VendorProfile | null;
            subscription: VendorSubscription | null;
          };
          setProfile(p);
          setSubscription(sub);

          if (p) {
            const [bidsRes, ...docResults] = await Promise.all([
              fetch("/api/marketplace/bids/my"),
              ...DOC_CATEGORIES.map((cat) => fetch(`/api/documents?folder_path=${cat.id}`)),
            ]);

            if (bidsRes.ok) {
              const { bids } = await bidsRes.json() as { bids: (VendorBid & { listing?: ProjectListing })[] };
              setMyBids(bids);
            }

            const allDocs: VendorDoc[] = [];
            for (const res of docResults) {
              if (res.ok) {
                const { documents } = await res.json() as { documents: VendorDoc[] };
                allDocs.push(...documents);
              }
            }
            setVendorDocs(allDocs);
          }
        }

        if (listingsRes.ok) {
          const { listings } = await listingsRes.json() as { listings: ProjectListing[] };
          setAvailableProjects(listings);
        }
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const matchingProjects = profile
    ? availableProjects.filter((l) => l.services_needed.includes(profile.vendor_type))
    : availableProjects;

  function docsFor(folderId: string) {
    return vendorDocs.filter((d) => d.folder_path === folderId);
  }

  function handleUploaded(doc: VendorDoc) {
    setVendorDocs((prev) => [doc, ...prev]);
  }

  function handleDeleted(id: string) {
    setVendorDocs((prev) => prev.filter((d) => d.id !== id));
  }

  const TABS: { id: TabId; label: string }[] = [
    { id: "bids", label: `My Bids (${myBids.length})` },
    { id: "projects", label: `Available (${matchingProjects.length})` },
    { id: "profile", label: `Company Profile (${vendorDocs.length})` },
    { id: "plan", label: "Subscription" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080E1A] text-white flex items-center justify-center">
        <div className="text-slate-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080E1A] text-white">
      <header className="border-b border-amber-900/30 bg-gradient-to-b from-amber-950/20 to-transparent px-6 py-6">
        <div className="max-w-5xl mx-auto flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/marketplace" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Marketplace</Link>
              <span className="text-slate-700">/</span>
              <span className="text-amber-400 text-sm font-semibold">Vendor Dashboard</span>
            </div>
            <h1 className="text-xl font-bold text-white">
              {profile ? profile.company_name : "Vendor Dashboard"}
            </h1>
            {profile && (
              <p className="text-slate-400 text-sm mt-0.5">{profile.vendor_type} · {profile.contact_name}</p>
            )}
          </div>
          {!profile && (
            <Link
              href="/vendor/register"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
            >
              Complete Registration
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {!profile ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🏢</div>
            <p className="text-slate-300 font-semibold mb-2">You haven&apos;t registered as a vendor yet</p>
            <p className="text-slate-500 text-sm mb-6">
              Create your vendor profile to start bidding on affordable housing projects.
            </p>
            <Link
              href="/vendor/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-colors"
            >
              Register as a Vendor
            </Link>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Bids", value: myBids.length },
                { label: "Shortlisted", value: myBids.filter((b) => b.status === "shortlisted").length },
                { label: "Awarded", value: myBids.filter((b) => b.status === "awarded").length },
                { label: "Profile Docs", value: vendorDocs.length },
              ].map((stat) => (
                <div key={stat.label} className="bg-[#0F1729] border border-slate-800 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-amber-400">{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Subscription status */}
            {!subscription && (
              <div className="bg-amber-950/30 border border-amber-700/40 rounded-xl px-5 py-4 flex items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm font-semibold text-amber-300">No Active Subscription</p>
                  <p className="text-xs text-amber-400/70 mt-0.5">Subscribe to start submitting bids on projects.</p>
                </div>
                <button
                  onClick={() => setTab("plan")}
                  className="shrink-0 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
                >
                  View Plans
                </button>
              </div>
            )}
            {subscription && (
              <div className="bg-[#0F1729] border border-amber-800/40 rounded-xl px-5 py-4 flex items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm font-semibold text-amber-300">
                    {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Status: <span className={subscription.status === "active" ? "text-emerald-400" : "text-red-400"}>{subscription.status}</span>
                    {subscription.current_period_end && ` · Renews ${fmtDate(subscription.current_period_end)}`}
                  </p>
                </div>
                <button
                  onClick={() => setTab("plan")}
                  className="shrink-0 text-xs text-amber-500 hover:text-amber-400 transition-colors"
                >
                  Manage →
                </button>
              </div>
            )}

            {/* Tabs */}
            <div className="flex flex-wrap gap-1 mb-6 bg-slate-900/50 rounded-xl p-1 border border-slate-800">
              {TABS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    tab === id
                      ? "bg-amber-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* My Bids */}
            {tab === "bids" && (
              <div className="space-y-3">
                {myBids.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500 text-sm mb-3">No bids submitted yet.</p>
                    <Link href="/marketplace" className="text-amber-400 hover:text-amber-300 text-sm">Browse Projects →</Link>
                  </div>
                ) : (
                  myBids.map((bid) => (
                    <div key={bid.id} className="bg-[#0F1729] border border-slate-800 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link
                            href={`/marketplace/projects/${bid.listing_id}`}
                            className="text-sm font-semibold text-white hover:text-amber-300 transition-colors"
                          >
                            {bid.listing?.project_name ?? "Project"}
                          </Link>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Submitted {fmtDate(bid.submitted_at)}
                            {bid.bid_amount && ` · ${fmtCurrency(bid.bid_amount)}`}
                          </p>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${BID_STATUS_STYLE[bid.status]}`}>
                          {bid.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2">{bid.proposal_text}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Available Projects */}
            {tab === "projects" && (
              <div className="space-y-3">
                {matchingProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500 text-sm">No matching projects available right now.</p>
                  </div>
                ) : (
                  matchingProjects.map((listing) => (
                    <Link key={listing.id} href={`/marketplace/projects/${listing.id}`}>
                      <div className="bg-[#0F1729] border border-slate-800 hover:border-amber-800/50 rounded-xl p-4 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">{listing.project_name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {listing.project_address ?? listing.project_type}
                              {listing.unit_count && ` · ${listing.unit_count} units`}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs text-slate-500">
                            {listing.bid_count ?? 0} bids
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2">{listing.description}</p>
                        {listing.deadline && (
                          <p className="text-xs text-amber-400 mt-2">
                            Deadline: {fmtDate(listing.deadline)}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* Company Profile */}
            {tab === "profile" && (
              <div className="space-y-6">
                <div className="bg-[#0F1729] border border-slate-800 rounded-xl px-5 py-4">
                  <p className="text-sm font-semibold text-white mb-1">Company Documents</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Upload your insurance certificates, bonding documents, and project experience portfolio.
                    These documents are stored securely and can be referenced when submitting bids.
                    Developers reviewing your bids may request access to verify your qualifications.
                  </p>
                  <div className="flex gap-4 mt-3 pt-3 border-t border-slate-800">
                    {DOC_CATEGORIES.map((cat) => (
                      <div key={cat.id} className="text-center">
                        <p className={`text-lg font-bold ${COLOR_MAP[cat.color].icon}`}>
                          {docsFor(cat.id).length}
                        </p>
                        <p className="text-[10px] text-slate-500">{cat.label}</p>
                      </div>
                    ))}
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-300">{vendorDocs.length}</p>
                      <p className="text-[10px] text-slate-500">Total Files</p>
                    </div>
                  </div>
                </div>

                {DOC_CATEGORIES.map((cat) => (
                  <DocUploadCard
                    key={cat.id}
                    category={cat}
                    docs={docsFor(cat.id)}
                    onUploaded={handleUploaded}
                    onDeleted={handleDeleted}
                  />
                ))}

                <p className="text-[10px] text-slate-600 text-center leading-relaxed">
                  Files are stored securely in Supabase Storage and are only accessible to you.
                  Signed links expire after 1 hour.
                </p>
              </div>
            )}

            {/* Subscription Plans */}
            {tab === "plan" && (
              <div className="space-y-4">
                <p className="text-sm text-slate-400">
                  Choose a plan to submit bids on project listings. All plans include a vendor profile in the directory.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {(["basic", "professional", "premium"] as const).map((plan) => {
                    const info = PLAN_FEATURES[plan];
                    const isCurrent = subscription?.plan === plan && subscription?.status === "active";
                    return (
                      <div
                        key={plan}
                        className={`bg-[#0F1729] border rounded-xl p-5 flex flex-col gap-3 ${
                          plan === "professional"
                            ? "border-amber-600/60"
                            : "border-slate-800"
                        }`}
                      >
                        {plan === "professional" && (
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Most Popular</span>
                        )}
                        <div>
                          <p className="font-bold text-white text-lg capitalize">{plan}</p>
                          <p className="text-2xl font-bold text-amber-400">{info.price}</p>
                        </div>
                        <ul className="space-y-1.5 flex-1">
                          {info.features.map((f) => (
                            <li key={f} className="flex items-start gap-1.5 text-xs text-slate-400">
                              <span className="text-amber-500 shrink-0 mt-0.5">✓</span>
                              {f}
                            </li>
                          ))}
                        </ul>
                        {isCurrent ? (
                          <div className="text-center py-2 text-xs font-semibold text-emerald-400">Current Plan</div>
                        ) : (
                          <Link
                            href="/dashboard/billing"
                            className="block text-center px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
                          >
                            {subscription ? "Upgrade" : "Subscribe"}
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
