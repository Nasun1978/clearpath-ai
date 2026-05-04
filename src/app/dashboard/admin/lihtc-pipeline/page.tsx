"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  totalUnits: number;
  liUnits: number;
  yearPlaced: number | null;
  year15Ends: number | null;
  year30Ends: number | null;
  yearsSince15: number;
  complianceStatus: string;
  complianceWindow: string;
  resyndPriority: string;
  priorityScore: number;
  priorityTier: string;
  outreachStatus: string;
  loiStage: string;
  primaryContact: string;
  contactInfo: string;
  qctDda: string;
  bondDeal: string;
  section8Hap: string;
  dealNotes: string;
  nextAction: string;
  lat: number | null;
  lng: number | null;
  allocAmt?: number;          // HUD annual LIHTC allocation
  creditType?: string;        // "9%" | "4%" | "Both" | "Unknown"
  tdcEstimate?: number;       // Total dev cost estimate from allocation × applicable %
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TIER_COLOR: Record<string, { dot: string; badge: string; label: string }> = {
  "1 — Immediate outreach": { dot: "#ef4444", badge: "bg-red-900/50 text-red-300 border-red-700/50", label: "Tier 1" },
  "2 — High priority":      { dot: "#f97316", badge: "bg-orange-900/50 text-orange-300 border-orange-700/50", label: "Tier 2" },
  "3 — Active pipeline":    { dot: "#eab308", badge: "bg-yellow-900/50 text-yellow-300 border-yellow-700/50", label: "Tier 3" },
  "4 — Watch list":         { dot: "#64748b", badge: "bg-slate-800 text-slate-400 border-slate-700", label: "Tier 4" },
};

const OUTREACH_OPTIONS = ["Not Started", "Contacted", "Meeting Scheduled", "In Negotiation", "LOI Submitted", "Under Contract", "Closed", "Dead"];

const DATA_PACKAGES = [
  { id: "tier1", label: "Tier 1 — Immediate Pipeline", desc: "All Tier 1 properties with full contact, compliance, and deal data", price: 1500, tier: "1 — Immediate outreach" },
  { id: "tier2", label: "Tier 2 — High Priority Pipeline", desc: "Tier 1 + 2 properties — extended use window closing soon", price: 2500, tier: "2 — High priority" },
  { id: "full", label: "Full Houston LIHTC Database", desc: "All 275 properties across all tiers with geocoded map data", price: 5000, tier: null },
  { id: "custom", label: "Custom Selection", desc: "Export only properties you select from the table below", price: null, tier: null },
];

// ── Admin check ───────────────────────────────────────────────────────────────

const ADMIN_EMAILS = [
  "admin@ripespot.com",
  "steven@ripespotdevelopment.com",
  "stevenkennedy78@gmail.com",
];

// ── Leaflet map ───────────────────────────────────────────────────────────────

function PipelineMap({ properties, selected, onSelect }: {
  properties: Property[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || mapInstance.current) return;

    // Load Leaflet from CDN
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = (window as any).L;
      if (!mapRef.current) return;

      const map = L.map(mapRef.current, { zoomControl: true }).setView([31.0, -91.5], 6);
      mapInstance.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap © CARTO",
        maxZoom: 18,
      }).addTo(map);

      const withCoords = properties.filter((p) => p.lat && p.lng);

      withCoords.forEach((p) => {
        const tier = TIER_COLOR[p.priorityTier] ?? TIER_COLOR["4 — Watch list"];
        const svgIcon = L.divIcon({
          className: "",
          iconSize: [14, 14],
          iconAnchor: [7, 7],
          html: `<div style="width:14px;height:14px;border-radius:50%;background:${tier.dot};border:2px solid rgba(255,255,255,0.3);cursor:pointer;transition:transform 0.1s;box-shadow:0 0 6px ${tier.dot}88;"></div>`,
        });
        const marker = L.marker([p.lat!, p.lng!], { icon: svgIcon })
          .addTo(map)
          .bindPopup(
            `<div style="font-family:sans-serif;min-width:220px">
              <p style="font-weight:700;font-size:13px;margin:0 0 4px">${p.name}</p>
              <p style="color:#94a3b8;font-size:11px;margin:0 0 6px">${p.address}</p>
              <p style="font-size:11px;margin:0 0 2px"><b>Units:</b> ${p.totalUnits} total, ${p.liUnits} LI</p>
              <p style="font-size:11px;margin:0 0 2px"><b>Year-15 ends:</b> ${p.year15Ends ?? "—"} | <b>Year-30:</b> ${p.year30Ends ?? "—"}</p>
              <p style="font-size:11px;margin:0"><b>Status:</b> ${p.outreachStatus}</p>
            </div>`,
            { maxWidth: 260 }
          );
        marker.on("click", () => onSelect(p.id));
        markersRef.current.push(marker);
      });
    };
    document.head.appendChild(script);

    return () => {
      if (mapInstance.current) {
        (mapInstance.current as { remove: () => void }).remove();
        mapInstance.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-800" style={{ height: 480 }}>
      <div ref={mapRef} style={{ height: "100%", width: "100%", background: "#0a1628" }} />
      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-1.5">
        {Object.entries(TIER_COLOR).map(([tier, c]) => (
          <div key={tier} className="flex items-center gap-1.5 bg-[#080E1A]/90 px-2 py-1 rounded-lg border border-slate-800">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.dot }} />
            <span className="text-[10px] text-slate-300 font-semibold">{c.label}</span>
          </div>
        ))}
      </div>
      <div className="absolute bottom-3 right-3 z-[1000] bg-[#080E1A]/90 px-2 py-1 rounded-lg border border-slate-800 text-[10px] text-slate-500">
        {properties.filter((p) => p.lat).length} / {properties.length} geocoded
      </div>
    </div>
  );
}

// ── Sell to Developer modal ───────────────────────────────────────────────────

function SellModal({ onClose, selectedIds, properties }: { onClose: () => void; selectedIds: string[]; properties: Property[] }) {
  const [pkg, setPkg] = useState<string>("tier1");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [customPrice, setCustomPrice] = useState("2000");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ url: string; count: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const selected = DATA_PACKAGES.find((p) => p.id === pkg)!;
  const price = pkg === "custom" ? parseInt(customPrice) || 0 : selected.price!;
  const count = pkg === "custom"
    ? selectedIds.length
    : pkg === "full"
    ? 275
    : properties.filter((p) => {
        if (pkg === "tier1") return p.priorityTier === "1 — Immediate outreach";
        if (pkg === "tier2") return ["1 — Immediate outreach", "2 — High priority"].includes(p.priorityTier);
        return true;
      }).length;

  async function generate() {
    if (!buyerEmail.trim()) { setErr("Buyer email is required"); return; }
    setGenerating(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/lihtc-pipeline/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package: pkg, buyerEmail: buyerEmail.trim(), buyerName: buyerName.trim(), price, selectedIds }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Failed");
      setResult({ url: data.url!, count });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to generate link");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#0F1729] border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-white">Sell Data Package</h2>
            <p className="text-xs text-slate-500 mt-0.5">Generate a Stripe payment link for a developer</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {result ? (
          <div className="space-y-4">
            <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-xl p-4">
              <p className="text-sm font-semibold text-emerald-300 mb-1">Payment Link Created</p>
              <p className="text-xs text-slate-400">{count} properties · ${price.toLocaleString()}</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3">
              <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Stripe checkout URL</p>
              <a href={result.url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-teal-400 hover:text-teal-300 break-all underline">
                {result.url}
              </a>
            </div>
            <button
              onClick={() => { void navigator.clipboard.writeText(result.url); }}
              className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-sm font-semibold transition-colors"
            >
              Copy Link to Clipboard
            </button>
            <button onClick={onClose} className="w-full py-2 text-xs text-slate-500 hover:text-slate-300">Close</button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Package selector */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Data Package</label>
              <div className="space-y-2">
                {DATA_PACKAGES.map((p) => {
                  const cnt = p.id === "custom"
                    ? selectedIds.length
                    : p.id === "full"
                    ? 275
                    : properties.filter((pr) => p.tier ? pr.priorityTier === p.tier || (p.id === "tier2" && pr.priorityTier === "1 — Immediate outreach") : true).length;
                  return (
                    <label key={p.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        pkg === p.id ? "border-amber-600/60 bg-amber-900/20" : "border-slate-800 hover:border-slate-700"
                      }`}>
                      <input type="radio" name="pkg" value={p.id} checked={pkg === p.id} onChange={() => setPkg(p.id)} className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-white">{p.label}</p>
                          <p className="text-xs font-bold text-amber-400 shrink-0">
                            {p.id === "custom" ? "Custom" : `$${p.price!.toLocaleString()}`}
                          </p>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">{p.desc}</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">{cnt} properties included</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {pkg === "custom" && (
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Custom Price ($)</label>
                <input
                  type="number"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-600"
                  placeholder="2000"
                />
                {selectedIds.length === 0 && (
                  <p className="text-[10px] text-amber-500 mt-1">Select properties in the table first using the checkboxes.</p>
                )}
              </div>
            )}

            {/* Buyer info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Buyer Name</label>
                <input type="text" value={buyerName} onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-600"
                  placeholder="John Smith" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Buyer Email *</label>
                <input type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-600"
                  placeholder="developer@firm.com" />
              </div>
            </div>

            {err && <p className="text-xs text-red-400">{err}</p>}

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div>
                <p className="text-sm font-bold text-white">${price.toLocaleString()}</p>
                <p className="text-[10px] text-slate-500">{count} properties · Stripe checkout</p>
              </div>
              <button
                onClick={() => void generate()}
                disabled={generating}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {generating ? "Generating…" : "Generate Payment Link"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Property detail drawer ────────────────────────────────────────────────────

function PropertyDrawer({ property, onClose, onUpdate }: {
  property: Property;
  onClose: () => void;
  onUpdate: (id: string, field: string, value: string) => void;
}) {
  const tier = TIER_COLOR[property.priorityTier] ?? TIER_COLOR["4 — Watch list"];
  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-sm bg-[#0C1525] border-l border-slate-800 overflow-y-auto shadow-2xl flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-[#0C1525]">
        <div>
          <h3 className="font-bold text-white text-sm leading-tight">{property.name}</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">{property.id}</p>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 p-5 space-y-5">
        {/* Priority tier */}
        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${tier.badge}`}>
          {tier.label} · Score {property.priorityScore}
        </span>

        {/* Address */}
        <div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Address</p>
          <p className="text-sm text-slate-200">{property.address}</p>
          <p className="text-xs text-slate-500">{property.city}, {property.state} {property.zip}</p>
          <a
            href={`https://www.google.com/maps/search/${encodeURIComponent(`${property.address}, ${property.city}, ${property.state}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-teal-400 hover:text-teal-300 mt-1 inline-flex items-center gap-1"
          >
            Open in Google Maps ↗
          </a>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Total Units", value: property.totalUnits || "—" },
            { label: "LI Units", value: property.liUnits || "—" },
            { label: "Year Placed", value: property.yearPlaced ?? "—" },
            { label: "Year-15 Ends", value: property.year15Ends ?? "—" },
            { label: "Year-30 Ends", value: property.year30Ends ?? "—" },
            { label: "Yrs Since 15", value: property.yearsSince15 || "—" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
              <p className="text-[10px] text-slate-500">{label}</p>
              <p className="text-sm font-bold text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Compliance */}
        <div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Compliance</p>
          <p className="text-xs text-slate-300">{property.complianceStatus}</p>
          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{property.complianceWindow}</p>
        </div>

        {/* Flags */}
        <div className="flex flex-wrap gap-2">
          {property.qctDda && <span className="text-[10px] bg-purple-900/40 text-purple-300 border border-purple-700/40 px-2 py-0.5 rounded-full">{property.qctDda}</span>}
          {property.bondDeal === "Y" && <span className="text-[10px] bg-teal-900/40 text-teal-300 border border-teal-700/40 px-2 py-0.5 rounded-full">Bond Deal</span>}
          {property.section8Hap && <span className="text-[10px] bg-blue-900/40 text-blue-300 border border-blue-700/40 px-2 py-0.5 rounded-full">HAP Contract</span>}
        </div>

        {/* Editable fields */}
        <div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Outreach Status</p>
          <select
            value={property.outreachStatus}
            onChange={(e) => onUpdate(property.id, "outreachStatus", e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-600"
          >
            {OUTREACH_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Deal Notes</p>
          <textarea
            defaultValue={property.dealNotes}
            onBlur={(e) => onUpdate(property.id, "dealNotes", e.target.value)}
            rows={3}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-600 resize-none"
            placeholder="Add notes…"
          />
        </div>

        <div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Next Action</p>
          <input
            defaultValue={property.nextAction}
            onBlur={(e) => onUpdate(property.id, "nextAction", e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-600"
            placeholder="e.g. Send outreach letter"
          />
        </div>

        {property.resyndPriority && (
          <div className="bg-amber-900/10 border border-amber-800/30 rounded-xl p-3">
            <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-1">Resynd Assessment</p>
            <p className="text-[10px] text-amber-400/80 leading-relaxed">{property.resyndPriority}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type ViewMode = "map" | "table";
type TierFilter = "all" | "1" | "2" | "3" | "4";
type StateFilter = "all" | "TX" | "LA" | "MS";

export default function LIHTCPipelinePage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [view, setView] = useState<ViewMode>("table");
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [search, setSearch] = useState("");
  const [outreachFilter, setOutreachFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [properties, setProperties] = useState<Property[]>([]);
  const [showSell, setShowSell] = useState(false);
  const [sortCol, setSortCol] = useState<"name" | "priorityScore" | "totalUnits" | "year15Ends" | "year30Ends">("priorityScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Admin gate + load properties
  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => {
        if (r.status === 403 || r.status === 401) setAuthorized(false);
        else setAuthorized(true);
      })
      .catch(() => setAuthorized(false));

    fetch("/api/admin/lihtc-pipeline")
      .then((r) => r.json())
      .then((d: { properties?: Property[]; error?: string }) => {
        if (d.properties) setProperties(d.properties);
      })
      .catch(() => { /* swallow — admin gate will show error */ });
  }, []);

  function updateProperty(id: string, field: string, value: string) {
    setProperties((prev) => prev.map((p) => p.id === id ? { ...p, [field]: value } : p));
  }

  const filtered = useMemo(() => {
    return properties
      .filter((p) => {
        if (stateFilter !== "all" && p.state !== stateFilter) return false;
        if (tierFilter !== "all" && !p.priorityTier.startsWith(tierFilter)) return false;
        if (outreachFilter !== "all" && p.outreachStatus !== outreachFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          return p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        let va: number | string = 0, vb: number | string = 0;
        if (sortCol === "name") { va = a.name; vb = b.name; }
        else if (sortCol === "priorityScore") { va = a.priorityScore; vb = b.priorityScore; }
        else if (sortCol === "totalUnits") { va = a.totalUnits; vb = b.totalUnits; }
        else if (sortCol === "year15Ends") { va = a.year15Ends ?? 9999; vb = b.year15Ends ?? 9999; }
        else if (sortCol === "year30Ends") { va = a.year30Ends ?? 9999; vb = b.year30Ends ?? 9999; }
        if (typeof va === "string") return sortDir === "asc" ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
        return sortDir === "asc" ? va - (vb as number) : (vb as number) - va;
      });
  }, [properties, tierFilter, outreachFilter, search, sortCol, sortDir]);

  function toggleSort(col: typeof sortCol) {
    if (sortCol === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  }

  function toggleCheck(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function checkAll() {
    if (checkedIds.size === filtered.length) setCheckedIds(new Set());
    else setCheckedIds(new Set(filtered.map((p) => p.id)));
  }

  const selectedProperty = selectedId ? properties.find((p) => p.id === selectedId) ?? null : null;

  // Summary stats
  const tier1 = properties.filter((p) => p.priorityTier.startsWith("1")).length;
  const tier2 = properties.filter((p) => p.priorityTier.startsWith("2")).length;
  const totalUnits = properties.reduce((s, p) => s + p.totalUnits, 0);
  const mapped = properties.filter((p) => p.lat).length;
  const stateCount = { TX: properties.filter(p => p.state === "TX").length, LA: properties.filter(p => p.state === "LA").length, MS: properties.filter(p => p.state === "MS").length };

  if (authorized === null) {
    return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center"><div className="text-slate-500">Verifying access…</div></div>;
  }
  if (authorized === false) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 font-semibold mb-2">Access Denied</p>
          <p className="text-slate-500 text-sm">This page is restricted to RipeSpot administrators.</p>
          <Link href="/dashboard" className="text-teal-400 text-sm mt-4 inline-block hover:text-teal-300">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#080E1A]/95 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/admin" className="text-slate-500 hover:text-white text-sm">← Admin</Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white">LIHTC Pipeline</h1>
                <span className="text-[10px] font-bold bg-red-900/50 text-red-400 border border-red-700/40 px-2 py-0.5 rounded-full uppercase tracking-wider">Admin Only</span>
              </div>
              <p className="text-xs text-slate-500">TX · LA · MS · {properties.length.toLocaleString()} properties · {totalUnits.toLocaleString()} units</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {checkedIds.size > 0 && (
              <button
                onClick={() => setShowSell(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Sell ({checkedIds.size} selected)
              </button>
            )}
            <button
              onClick={() => setShowSell(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold border border-slate-700 transition-colors"
            >
              Sell Data Package
            </button>
            <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-0.5">
              {(["table", "map"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${view === v ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  {v === "table" ? "📋 Table" : "🗺️ Map"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Tier 1 — Immediate", value: tier1.toLocaleString(), color: "text-red-400" },
            { label: "Tier 2 — High Priority", value: tier2.toLocaleString(), color: "text-orange-400" },
            { label: "Total Units", value: totalUnits.toLocaleString(), color: "text-teal-400" },
            { label: "Geocoded on Map", value: `${mapped.toLocaleString()} / ${properties.length.toLocaleString()}`, color: "text-blue-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#0F1729] border border-slate-800 rounded-xl p-4">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search property name, address, HUD ID…"
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-slate-500 w-64"
          />
          {/* State filter */}
          <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
            {(["all", "TX", "LA", "MS"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStateFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  stateFilter === s ? "bg-amber-700 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {s === "all" ? "All States" : `${s} (${stateCount[s as keyof typeof stateCount] ?? 0})`}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
            {(["all", "1", "2", "3", "4"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  tierFilter === t ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {t === "all" ? "All Tiers" : `Tier ${t}`}
              </button>
            ))}
          </div>
          <select
            value={outreachFilter}
            onChange={(e) => setOutreachFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="all">All Outreach</option>
            {OUTREACH_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <p className="text-xs text-slate-500 ml-auto">{filtered.length} shown</p>
        </div>

        {/* Map */}
        {view === "map" && (
          <PipelineMap
            properties={filtered}
            selected={selectedId}
            onSelect={setSelectedId}
          />
        )}

        {/* Table */}
        {view === "table" && (
          <div className="bg-[#0F1729] border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#080E1A]/80 border-b border-slate-800">
                    <th className="pl-4 pr-2 py-3 w-8">
                      <input type="checkbox" checked={checkedIds.size === filtered.length && filtered.length > 0}
                        onChange={checkAll}
                        className="rounded border-slate-600 bg-slate-900 text-amber-500 focus:ring-0" />
                    </th>
                    <th className="px-3 py-3 text-left">
                      <button onClick={() => toggleSort("name")} className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-white">
                        Property {sortCol === "name" && (sortDir === "asc" ? "↑" : "↓")}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tier</th>
                    <th className="px-3 py-3 text-center">
                      <button onClick={() => toggleSort("totalUnits")} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-white">
                        Units {sortCol === "totalUnits" && (sortDir === "asc" ? "↑" : "↓")}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-center">
                      <button onClick={() => toggleSort("year15Ends")} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-white">
                        Yr-15 {sortCol === "year15Ends" && (sortDir === "asc" ? "↑" : "↓")}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-center">
                      <button onClick={() => toggleSort("year30Ends")} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-white">
                        Yr-30 {sortCol === "year30Ends" && (sortDir === "asc" ? "↑" : "↓")}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider" title="Estimated total development cost — derived from HUD allocation × applicable %">
                      Est. TDC
                    </th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Compliance</th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Outreach</th>
                    <th className="px-3 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filtered.map((p) => {
                    const tier = TIER_COLOR[p.priorityTier] ?? TIER_COLOR["4 — Watch list"];
                    return (
                      <tr key={p.id}
                        className={`hover:bg-slate-800/30 cursor-pointer transition-colors ${selectedId === p.id ? "bg-slate-800/40" : ""} ${checkedIds.has(p.id) ? "bg-amber-900/10" : ""}`}
                        onClick={() => setSelectedId(p.id === selectedId ? null : p.id)}
                      >
                        <td className="pl-4 pr-2 py-3" onClick={(e) => { e.stopPropagation(); toggleCheck(p.id); }}>
                          <input type="checkbox" checked={checkedIds.has(p.id)} onChange={() => toggleCheck(p.id)}
                            className="rounded border-slate-600 bg-slate-900 text-amber-500 focus:ring-0" />
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-sm font-semibold text-white">{p.name}</p>
                          <p className="text-[10px] text-slate-500">{p.address} · {p.id}</p>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.badge}`}>
                            {tier.label}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center text-xs text-slate-300">
                          {p.totalUnits}<span className="text-slate-600 text-[10px]">/{p.liUnits}</span>
                        </td>
                        <td className="px-3 py-3 text-center text-xs text-slate-300">{p.year15Ends ?? "—"}</td>
                        <td className={`px-3 py-3 text-center text-xs font-semibold ${p.year30Ends && p.year30Ends <= 2026 ? "text-red-400" : "text-slate-300"}`}>
                          {p.year30Ends ?? "—"}
                        </td>
                        <td className="px-3 py-3 text-right text-xs">
                          {p.tdcEstimate ? (
                            <div>
                              <span className="font-semibold text-emerald-300">
                                ${(p.tdcEstimate / 1e6).toFixed(1)}M
                              </span>
                              <span className="block text-[9px] text-slate-600">
                                ~${Math.round(p.tdcEstimate / p.totalUnits / 1000)}K/unit · {p.creditType}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-700">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs text-slate-400 max-w-[160px] truncate">{p.complianceStatus}</td>
                        <td className="px-3 py-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                            p.outreachStatus === "Not Started" ? "bg-slate-800 text-slate-500 border-slate-700" :
                            p.outreachStatus === "Closed" ? "bg-emerald-900/40 text-emerald-300 border-emerald-700/40" :
                            p.outreachStatus === "Dead" ? "bg-red-900/30 text-red-400 border-red-700/30" :
                            "bg-amber-900/30 text-amber-300 border-amber-700/30"
                          }`}>
                            {p.outreachStatus}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          {p.lat && (
                            <span title="Geocoded" className="text-[10px] text-slate-600">📍</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Property drawer */}
      {selectedProperty && (
        <PropertyDrawer
          property={selectedProperty}
          onClose={() => setSelectedId(null)}
          onUpdate={updateProperty}
        />
      )}

      {/* Sell modal */}
      {showSell && (
        <SellModal
          onClose={() => setShowSell(false)}
          selectedIds={[...checkedIds]}
          properties={properties}
        />
      )}
    </div>
  );
}
