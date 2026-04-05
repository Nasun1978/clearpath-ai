"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { Project, ProjectType } from "@/types";

const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  lihtc_9pct: "LIHTC 9%",
  lihtc_4pct: "LIHTC 4%",
  home: "HOME",
  htf: "HTF",
  cdbg: "CDBG",
  mixed_use: "Mixed Use",
  market_rate: "Market Rate",
  other: "Other",
};

const TYPE_COLORS: Record<ProjectType, string> = {
  lihtc_9pct: "text-teal-300 bg-teal-900/30 border-teal-700/40",
  lihtc_4pct: "text-emerald-300 bg-emerald-900/30 border-emerald-700/40",
  home: "text-blue-300 bg-blue-900/30 border-blue-700/40",
  htf: "text-purple-300 bg-purple-900/30 border-purple-700/40",
  cdbg: "text-orange-300 bg-orange-900/30 border-orange-700/40",
  mixed_use: "text-pink-300 bg-pink-900/30 border-pink-700/40",
  market_rate: "text-slate-300 bg-slate-800/50 border-slate-700/40",
  other: "text-slate-400 bg-slate-800/30 border-slate-700/30",
};

const EMPTY_FORM = {
  name: "",
  address: "",
  type: "lihtc_9pct" as ProjectType,
  budget: "",
  timeline: "",
  notes: "",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.projects ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          budget: form.budget ? parseFloat(form.budget) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error as string);
        return;
      }
      setProjects((prev) => [data.project as Project, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch {
      setFormError("Request failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-[#080E1A]/90 backdrop-blur-sm sticky top-0 z-20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm">
              Back
            </Link>
            <h1 className="text-lg font-bold">
              <span className="text-teal-400">Projects</span>
            </h1>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-teal-600 text-white hover:bg-teal-500 transition-colors"
          >
            {showForm ? "Cancel" : "+ New Project"}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Create form */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="bg-[#0F1729] border border-slate-700 rounded-2xl p-6 space-y-4"
          >
            <h2 className="text-base font-bold text-white">New Project</h2>

            {formError && (
              <div className="p-3 bg-red-900/20 border border-red-700/40 rounded-lg text-sm text-red-300">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-400 mb-1">
                  Project Name <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Riverside Commons"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs text-slate-400 mb-1">Address</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="e.g. 1340 Poydras St, New Orleans, LA"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Project Type <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ProjectType }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                >
                  {(Object.keys(PROJECT_TYPE_LABELS) as ProjectType[]).map((t) => (
                    <option key={t} value={t}>
                      {PROJECT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Budget (TDC, $)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.budget}
                  onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                  placeholder="e.g. 12500000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Timeline</label>
                <input
                  value={form.timeline}
                  onChange={(e) => setForm((f) => ({ ...f, timeline: e.target.value }))}
                  placeholder="e.g. Q4 2027 or 2027-12-01"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Notes</label>
                <input
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional notes"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setFormError(null); }}
                className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-lg text-sm font-semibold bg-teal-600 text-white disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Project"}
              </button>
            </div>
          </form>
        )}

        {/* Project cards */}
        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 mb-2">No projects yet</p>
            <p className="text-sm text-slate-600">
              Click &quot;+ New Project&quot; to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p) => (
              <div
                key={p.id}
                className="bg-[#0F1729] border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-white leading-snug">{p.name}</h3>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold border ${TYPE_COLORS[p.type]}`}
                  >
                    {PROJECT_TYPE_LABELS[p.type]}
                  </span>
                </div>

                {p.address && (
                  <p className="text-sm text-slate-400">{p.address}</p>
                )}

                <div className="flex flex-wrap gap-4 mt-auto pt-2 border-t border-slate-800">
                  {p.budget != null && (
                    <div>
                      <p className="text-xs text-slate-500">Budget</p>
                      <p className="text-sm font-semibold text-white">
                        ${p.budget.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {p.timeline && (
                    <div>
                      <p className="text-xs text-slate-500">Timeline</p>
                      <p className="text-sm font-semibold text-white">{p.timeline}</p>
                    </div>
                  )}
                  <div className="ml-auto">
                    <p className="text-xs text-slate-500">Created</p>
                    <p className="text-xs text-slate-400">
                      {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {p.notes && (
                  <p className="text-xs text-slate-500 italic">{p.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
