"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { Deal, DealStage } from "@/types";

// ── Column config ─────────────────────────────────────────────────────────────

interface ColumnConfig {
  label: string;
  accent: string;        // border + dot color
  headerBg: string;
  countBg: string;
}

const COLUMNS: { stage: DealStage; config: ColumnConfig }[] = [
  {
    stage: "prospecting",
    config: {
      label: "Prospecting",
      accent: "border-slate-600",
      headerBg: "bg-slate-800/60",
      countBg: "bg-slate-700 text-slate-300",
    },
  },
  {
    stage: "due_diligence",
    config: {
      label: "Due Diligence",
      accent: "border-amber-600/70",
      headerBg: "bg-amber-900/20",
      countBg: "bg-amber-800/50 text-amber-300",
    },
  },
  {
    stage: "under_contract",
    config: {
      label: "Under Contract",
      accent: "border-teal-600/70",
      headerBg: "bg-teal-900/20",
      countBg: "bg-teal-800/50 text-teal-300",
    },
  },
  {
    stage: "closed",
    config: {
      label: "Closed",
      accent: "border-emerald-600/70",
      headerBg: "bg-emerald-900/20",
      countBg: "bg-emerald-800/50 text-emerald-300",
    },
  },
];

// ── Add-deal form ─────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  address: "",
  price: "",
  projected_roi: "",
  stage: "prospecting" as DealStage,
  notes: "",
};

interface AddFormProps {
  onCreated: (deal: Deal) => void;
  defaultStage: DealStage;
  onClose: () => void;
}

function AddDealForm({ onCreated, defaultStage, onClose }: AddFormProps) {
  const [form, setForm] = useState({ ...EMPTY_FORM, stage: defaultStage });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: form.price ? parseFloat(form.price) : null,
          projected_roi: form.projected_roi ? parseFloat(form.projected_roi) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error as string); return; }
      onCreated(data.deal as Deal);
    } catch {
      setError("Request failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#0F1729] border border-slate-700 rounded-xl p-4 space-y-3 mb-3"
    >
      {error && (
        <p className="text-xs text-red-400 bg-red-900/20 border border-red-700/30 rounded px-2 py-1">
          {error}
        </p>
      )}
      <input
        ref={ref}
        required
        value={form.address}
        onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
        placeholder="Address *"
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          min="0"
          step="1"
          value={form.price}
          onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
          placeholder="Price ($)"
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
        />
        <input
          type="number"
          min="0"
          step="0.01"
          value={form.projected_roi}
          onChange={(e) => setForm((f) => ({ ...f, projected_roi: e.target.value }))}
          placeholder="ROI (%)"
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
        />
      </div>
      <input
        value={form.notes}
        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        placeholder="Notes (optional)"
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
      />
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 text-white disabled:opacity-50"
        >
          {submitting ? "Adding..." : "Add Deal"}
        </button>
      </div>
    </form>
  );
}

// ── Deal card ─────────────────────────────────────────────────────────────────

interface DealCardProps {
  deal: Deal;
  onDragStart: (deal: Deal) => void;
  onDelete: (id: string) => void;
}

function DealCard({ deal, onDragStart, onDelete }: DealCardProps) {
  const roiColor =
    deal.projected_roi == null
      ? "text-slate-500"
      : deal.projected_roi >= 15
      ? "text-emerald-400"
      : deal.projected_roi >= 8
      ? "text-teal-400"
      : "text-amber-400";

  return (
    <div
      draggable
      onDragStart={() => onDragStart(deal)}
      className="bg-[#0B1222] border border-slate-800 rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-slate-700 transition-colors select-none group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm font-semibold text-white leading-snug">{deal.address}</p>
        <button
          onClick={() => onDelete(deal.id)}
          className="shrink-0 text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-lg leading-none"
          aria-label="Delete deal"
        >
          ×
        </button>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">Price</p>
          <p className="text-sm font-bold text-white">
            {deal.price != null ? formatCurrency(deal.price) : "—"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Proj. ROI</p>
          <p className={`text-sm font-bold ${roiColor}`}>
            {deal.projected_roi != null ? `${deal.projected_roi}%` : "—"}
          </p>
        </div>
      </div>
      {deal.notes && (
        <p className="mt-3 text-xs text-slate-500 border-t border-slate-800 pt-2 line-clamp-2">
          {deal.notes}
        </p>
      )}
    </div>
  );
}

// ── Kanban column ─────────────────────────────────────────────────────────────

interface ColumnProps {
  stage: DealStage;
  config: ColumnConfig;
  deals: Deal[];
  onDrop: (stage: DealStage) => void;
  onDragStart: (deal: Deal) => void;
  onDelete: (id: string) => void;
}

function KanbanColumn({ stage, config, deals, onDrop, onDragStart, onDelete }: ColumnProps) {
  const [addingDeal, setAddingDeal] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const totalValue = deals.reduce((sum, d) => sum + (d.price ?? 0), 0);

  return (
    <div
      className={`flex flex-col min-h-[60vh] rounded-2xl border ${config.accent} transition-colors ${
        isDragOver ? "bg-slate-800/40" : "bg-slate-900/30"
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={() => { setIsDragOver(false); onDrop(stage); }}
    >
      {/* Column header */}
      <div className={`${config.headerBg} rounded-t-2xl px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">{config.label}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.countBg}`}>
            {deals.length}
          </span>
        </div>
        {totalValue > 0 && (
          <span className="text-xs text-slate-400">{formatCurrency(totalValue)}</span>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-3">
        {addingDeal && (
          <AddDealForm
            defaultStage={stage}
            onCreated={(deal) => {
              onDrop(stage); // re-triggers parent refresh via a noop; we handle in parent
              // propagate upward by calling a synthetic drop — simpler to lift state
              // We use a custom event instead
              window.dispatchEvent(new CustomEvent("deal:created", { detail: deal }));
              setAddingDeal(false);
            }}
            onClose={() => setAddingDeal(false)}
          />
        )}

        {deals.map((d) => (
          <DealCard
            key={d.id}
            deal={d}
            onDragStart={onDragStart}
            onDelete={onDelete}
          />
        ))}

        {deals.length === 0 && !addingDeal && (
          <div className="text-center py-8 text-slate-700 text-xs">
            Drop deals here
          </div>
        )}
      </div>

      {/* Add button */}
      <div className="p-3 pt-0">
        <button
          onClick={() => setAddingDeal(true)}
          className="w-full py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-colors"
        >
          + Add deal
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const dragging = useRef<Deal | null>(null);

  useEffect(() => {
    fetch("/api/deals")
      .then((r) => r.json())
      .then((d) => setDeals(d.deals ?? []))
      .finally(() => setLoading(false));

    // Listen for deals created inside column forms
    function onCreated(e: Event) {
      const deal = (e as CustomEvent<Deal>).detail;
      setDeals((prev) => [...prev, deal]);
    }
    window.addEventListener("deal:created", onCreated);
    return () => window.removeEventListener("deal:created", onCreated);
  }, []);

  function dealsForStage(stage: DealStage) {
    return deals.filter((d) => d.stage === stage);
  }

  async function handleDrop(targetStage: DealStage) {
    const deal = dragging.current;
    if (!deal || deal.stage === targetStage) return;
    dragging.current = null;

    // Optimistic update
    setDeals((prev) =>
      prev.map((d) => (d.id === deal.id ? { ...d, stage: targetStage } : d))
    );

    const res = await fetch(`/api/deals/${deal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: targetStage }),
    });
    if (!res.ok) {
      // Revert on failure
      setDeals((prev) =>
        prev.map((d) => (d.id === deal.id ? { ...d, stage: deal.stage } : d))
      );
    }
  }

  async function handleDelete(id: string) {
    const deal = deals.find((d) => d.id === id);
    if (!deal) return;

    // Optimistic remove
    setDeals((prev) => prev.filter((d) => d.id !== id));

    const res = await fetch(`/api/deals/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setDeals((prev) => [...prev, deal]);
    }
  }

  const totalPipeline = deals.reduce((sum, d) => sum + (d.price ?? 0), 0);
  const closedDeals = deals.filter((d) => d.stage === "closed");
  const closedValue = closedDeals.reduce((sum, d) => sum + (d.price ?? 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-[#080E1A]/90 backdrop-blur-sm sticky top-0 z-20 px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm">
              Back
            </Link>
            <h1 className="text-lg font-bold">
              <span className="text-teal-400">Deal</span> Pipeline
            </h1>
          </div>
          {!loading && (
            <div className="flex items-center gap-6 text-sm">
              <div className="text-right">
                <p className="text-xs text-slate-500">Total Pipeline</p>
                <p className="font-bold text-white">{formatCurrency(totalPipeline)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Closed</p>
                <p className="font-bold text-emerald-400">{formatCurrency(closedValue)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Deals</p>
                <p className="font-bold text-white">{deals.length}</p>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading pipeline...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {COLUMNS.map(({ stage, config }) => (
              <KanbanColumn
                key={stage}
                stage={stage}
                config={config}
                deals={dealsForStage(stage)}
                onDragStart={(d) => { dragging.current = d; }}
                onDrop={handleDrop}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
