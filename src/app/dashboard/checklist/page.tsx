"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { CHECKLIST_SECTIONS, buildDefaultItems, getItemGuidance } from "./data";
import type { ChecklistItemState } from "./data";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProjectInfo {
  project_name: string;
  developer: string;
  location_parish: string;
  total_units: string;
  project_type: string;
  date_prepared: string;
}

const EMPTY_PROJECT: ProjectInfo = {
  project_name: "",
  developer: "",
  location_parish: "",
  total_units: "",
  project_type: "new_construction",
  date_prepared: new Date().toISOString().slice(0, 10),
};

const PROJECT_TYPES = [
  { value: "new_construction",     label: "New Construction" },
  { value: "acquisition_rehab",    label: "Acquisition / Rehab" },
  { value: "rehab_only",           label: "Rehab Only" },
  { value: "adaptive_reuse",       label: "Adaptive Reuse" },
  { value: "new_construction_bond",label: "New Construction (4% Bond)" },
  { value: "preservation",         label: "Preservation" },
];

const LS_KEY = "ripespot_lihtc_checklist_v1";
type SaveState = "idle" | "saving" | "saved" | "local" | "error";

// ── Helpers ───────────────────────────────────────────────────────────────────

function sectionProgress(items: ChecklistItemState[], sectionNum: number) {
  const sectionItems = items.filter((i) => i.section === sectionNum);
  const checked = sectionItems.filter((i) => i.checked).length;
  return { checked, total: sectionItems.length };
}

function overallProgress(items: ChecklistItemState[]) {
  const checked = items.filter((i) => i.checked).length;
  return { checked, total: items.length };
}

// ── Item row ──────────────────────────────────────────────────────────────────

interface ItemRowProps {
  item: ChecklistItemState;
  onChange: (id: string, field: keyof ChecklistItemState, value: unknown) => void;
  onUpload: (id: string, file: File) => void;
  uploading: boolean;
}

function ItemRow({ item, onChange, onUpload, uploading }: ItemRowProps) {
  const [notesOpen, setNotesOpen] = useState(false);
  const guidance = getItemGuidance(item.id);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`rounded-xl border transition-colors ${
        item.checked
          ? "bg-emerald-950/20 border-emerald-800/30"
          : "bg-slate-900/40 border-slate-800/60"
      } p-4`}
    >
      {/* Checkbox + text */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => onChange(item.id, "checked", !item.checked)}
          className={`mt-0.5 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            item.checked
              ? "bg-teal-500 border-teal-500"
              : "border-slate-600 hover:border-teal-500"
          }`}
          aria-label={item.checked ? "Uncheck item" : "Check item"}
        >
          {item.checked && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-snug ${item.checked ? "text-slate-400 line-through" : "text-slate-200"}`}>
            {item.text}
          </p>

          {guidance && (
            <p className="text-xs text-slate-500 mt-1 italic">{guidance}</p>
          )}

          {/* Inline actions */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <button
              onClick={() => setNotesOpen((o) => !o)}
              className="text-xs text-slate-500 hover:text-teal-400 transition-colors"
            >
              {notesOpen ? "Hide notes" : item.notes ? "Edit notes ✎" : "+ Add notes"}
            </button>

            {item.uploaded_file_url ? (
              <a
                href={item.uploaded_file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                {item.uploaded_file_name ?? "View file"}
              </a>
            ) : null}

            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              {uploading ? (
                "Uploading…"
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {item.uploaded_file_url ? "Replace file" : "Upload doc"}
                </>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => { if (e.target.files?.[0]) onUpload(item.id, e.target.files[0]); }}
            />
          </div>

          {/* Notes textarea */}
          {notesOpen && (
            <textarea
              value={item.notes}
              onChange={(e) => onChange(item.id, "notes", e.target.value)}
              placeholder="Add notes, references, or status updates…"
              rows={3}
              className="mt-2 w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 resize-none"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Section accordion ─────────────────────────────────────────────────────────

interface SectionProps {
  sectionNum: number;
  title: string;
  description: string;
  items: ChecklistItemState[];
  expanded: boolean;
  onToggle: () => void;
  onItemChange: (id: string, field: keyof ChecklistItemState, value: unknown) => void;
  onUpload: (id: string, file: File) => void;
  uploadingItems: Record<string, boolean>;
}

function ChecklistSection({
  sectionNum, title, description, items, expanded, onToggle,
  onItemChange, onUpload, uploadingItems,
}: SectionProps) {
  const { checked, total } = sectionProgress(items, sectionNum);
  const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
  const allDone = checked === total;

  return (
    <div className={`rounded-2xl border transition-colors ${allDone ? "border-emerald-800/50" : "border-slate-800"}`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
      >
        {/* Section number badge */}
        <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
          allDone ? "bg-emerald-700/40 text-emerald-300" : "bg-slate-800 text-slate-400"
        }`}>
          {allDone ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : sectionNum}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <p className="text-sm font-bold text-white truncate">{title}</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              allDone
                ? "bg-emerald-800/40 text-emerald-300"
                : checked > 0
                ? "bg-teal-800/40 text-teal-300"
                : "bg-slate-800 text-slate-400"
            }`}>
              {checked}/{total}
            </span>
          </div>
          {/* Per-section progress bar */}
          <div className="mt-1.5 h-1 bg-slate-800 rounded-full overflow-hidden w-full max-w-xs">
            <div
              className={`h-full rounded-full transition-all duration-500 ${allDone ? "bg-emerald-500" : "bg-teal-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <svg
          className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Body */}
      {expanded && (
        <div className="px-5 pb-5">
          <p className="text-xs text-slate-500 mb-4">{description}</p>
          <div className="space-y-3">
            {items
              .filter((i) => i.section === sectionNum)
              .map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onChange={onItemChange}
                  onUpload={onUpload}
                  uploading={!!uploadingItems[item.id]}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ChecklistPage() {
  const [checklistId, setChecklistId] = useState<string | null>(null);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>(EMPTY_PROJECT);
  const [items, setItems] = useState<ChecklistItemState[]>(() => buildDefaultItems());
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([1]));
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [uploadingItems, setUploadingItems] = useState<Record<string, boolean>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [initializing, setInitializing] = useState(true);
  const [supabaseAvailable, setSupabaseAvailable] = useState(true);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Load on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/checklist");
        if (res.status === 503) {
          // Supabase not configured — try localStorage
          setSupabaseAvailable(false);
          const saved = localStorage.getItem(LS_KEY);
          if (saved) {
            const parsed = JSON.parse(saved) as { projectInfo: ProjectInfo; items: ChecklistItemState[] };
            setProjectInfo(parsed.projectInfo ?? EMPTY_PROJECT);
            // Merge saved state onto default items (preserves any new items added in updates)
            const defaults = buildDefaultItems();
            const savedMap = new Map((parsed.items ?? []).map((i) => [i.id, i]));
            setItems(defaults.map((d) => savedMap.get(d.id) ?? d));
          }
          setInitializing(false);
          return;
        }
        const data = await res.json() as { checklists?: { id: string; project_name: string }[] };
        if (data.checklists && data.checklists.length > 0) {
          // Load the most recent checklist
          const latest = data.checklists[0];
          const detail = await fetch(`/api/checklist/${latest.id}`);
          const detailData = await detail.json() as {
            checklist?: {
              id: string;
              project_name: string;
              developer: string;
              location_parish: string;
              total_units: number | null;
              project_type: string;
              date_prepared: string;
              checklist_items: ChecklistItemState[];
            };
          };
          if (detailData.checklist) {
            const c = detailData.checklist;
            setChecklistId(c.id);
            setProjectInfo({
              project_name: c.project_name,
              developer: c.developer,
              location_parish: c.location_parish,
              total_units: c.total_units?.toString() ?? "",
              project_type: c.project_type,
              date_prepared: c.date_prepared,
            });
            // Merge saved items
            const defaults = buildDefaultItems();
            const savedMap = new Map((c.checklist_items ?? []).map((i) => [i.id, i]));
            setItems(defaults.map((d) => savedMap.get(d.id) ?? d));
          }
        }
      } catch {
        // Network error — fall through with defaults
      }
      setInitializing(false);
    }
    init();
  }, []);

  // ── Save logic ─────────────────────────────────────────────────────────────
  const doSave = useCallback(async (
    currentItems: ChecklistItemState[],
    currentInfo: ProjectInfo,
    currentId: string | null,
    supAvail: boolean
  ) => {
    setSaveState("saving");

    if (!supAvail) {
      // Save to localStorage
      localStorage.setItem(LS_KEY, JSON.stringify({ projectInfo: currentInfo, items: currentItems }));
      setSaveState("local");
      setTimeout(() => setSaveState("idle"), 2000);
      return;
    }

    const payload = {
      project_name: currentInfo.project_name,
      developer: currentInfo.developer,
      location_parish: currentInfo.location_parish,
      total_units: currentInfo.total_units ? parseInt(currentInfo.total_units) : null,
      project_type: currentInfo.project_type,
      date_prepared: currentInfo.date_prepared,
      checklist_items: currentItems,
    };

    try {
      let res: Response;
      let newId = currentId;
      if (currentId) {
        res = await fetch(`/api/checklist/${currentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/checklist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json() as { checklist?: { id: string } };
          newId = data.checklist?.id ?? null;
          if (newId) setChecklistId(newId);
        }
      }
      setSaveState(res.ok ? "saved" : "error");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 2500);
    }
  }, []);

  const scheduleSave = useCallback((
    nextItems: ChecklistItemState[],
    nextInfo: ProjectInfo,
    cId: string | null,
    supAvail: boolean
  ) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => doSave(nextItems, nextInfo, cId, supAvail), 1200);
  }, [doSave]);

  // ── Item change handler ────────────────────────────────────────────────────
  function handleItemChange(id: string, field: keyof ChecklistItemState, value: unknown) {
    setItems((prev) => {
      const next = prev.map((item) => item.id === id ? { ...item, [field]: value } : item);
      scheduleSave(next, projectInfo, checklistId, supabaseAvailable);
      return next;
    });
  }

  function handleInfoChange(field: keyof ProjectInfo, value: string) {
    setProjectInfo((prev) => {
      const next = { ...prev, [field]: value };
      scheduleSave(items, next, checklistId, supabaseAvailable);
      return next;
    });
  }

  // ── File upload ────────────────────────────────────────────────────────────
  async function handleUpload(itemId: string, file: File) {
    setUploadingItems((prev) => ({ ...prev, [itemId]: true }));
    setUploadErrors((prev) => { const n = { ...prev }; delete n[itemId]; return n; });

    // If no checklist ID yet, save first to get one
    let cId = checklistId;
    if (!cId && supabaseAvailable) {
      try {
        const res = await fetch("/api/checklist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_name: projectInfo.project_name,
            developer: projectInfo.developer,
            location_parish: projectInfo.location_parish,
            total_units: projectInfo.total_units ? parseInt(projectInfo.total_units) : null,
            project_type: projectInfo.project_type,
            date_prepared: projectInfo.date_prepared,
            checklist_items: items,
          }),
        });
        const d = await res.json() as { checklist?: { id: string } };
        cId = d.checklist?.id ?? null;
        if (cId) setChecklistId(cId);
      } catch {
        setUploadErrors((prev) => ({ ...prev, [itemId]: "Could not create checklist record before uploading." }));
        setUploadingItems((prev) => { const n = { ...prev }; delete n[itemId]; return n; });
        return;
      }
    }

    if (!cId) {
      setUploadErrors((prev) => ({ ...prev, [itemId]: "File uploads require Supabase to be configured." }));
      setUploadingItems((prev) => { const n = { ...prev }; delete n[itemId]; return n; });
      return;
    }

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("checklist_id", cId);
      fd.append("item_id", itemId);
      const res = await fetch("/api/checklist/upload", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; file_name?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      // Update item with file URL
      setItems((prev) => {
        const next = prev.map((item) =>
          item.id === itemId
            ? { ...item, uploaded_file_url: data.url ?? null, uploaded_file_name: data.file_name ?? file.name }
            : item
        );
        scheduleSave(next, projectInfo, cId, supabaseAvailable);
        return next;
      });
    } catch (err) {
      setUploadErrors((prev) => ({ ...prev, [itemId]: err instanceof Error ? err.message : "Upload failed" }));
    } finally {
      setUploadingItems((prev) => { const n = { ...prev }; delete n[itemId]; return n; });
    }
  }

  function toggleSection(num: number) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  }

  function expandAll() { setExpandedSections(new Set(CHECKLIST_SECTIONS.map((s) => s.number))); }
  function collapseAll() { setExpandedSections(new Set()); }

  // ── Render ─────────────────────────────────────────────────────────────────
  const { checked: totalChecked, total: totalItems } = overallProgress(items);
  const overallPct = totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : 0;

  const saveLabel =
    saveState === "saving" ? "Saving…" :
    saveState === "saved"  ? "✓ Saved" :
    saveState === "local"  ? "✓ Saved locally" :
    saveState === "error"  ? "Save failed" :
    null;

  const saveLabelColor =
    saveState === "saved" || saveState === "local" ? "text-emerald-400" :
    saveState === "error" ? "text-red-400" :
    "text-slate-500";

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading checklist…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#080E1A]/90 backdrop-blur-sm sticky top-0 z-20 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm">Back</Link>
            <h1 className="text-lg font-bold">
              <span className="text-teal-400">LIHTC</span> Checklist
            </h1>
            <span className="text-xs text-slate-500 hidden sm:inline">LHC 2025 QAP</span>
          </div>
          <div className="flex items-center gap-4">
            {saveLabel && (
              <span className={`text-xs ${saveLabelColor} transition-colors`}>{saveLabel}</span>
            )}
            {!supabaseAvailable && (
              <span className="text-xs text-amber-400 bg-amber-900/20 border border-amber-800/30 px-2 py-0.5 rounded">
                Saving locally (Supabase not configured)
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Project info */}
        <section className="bg-[#0F1729] border border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wide">Project Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(
              [
                { field: "project_name",    label: "Project Name",       placeholder: "e.g. Live Oak Manor Residences" },
                { field: "developer",       label: "Developer / Applicant", placeholder: "Developer entity name" },
                { field: "location_parish", label: "Location / Parish",   placeholder: "e.g. New Orleans / Orleans Parish" },
                { field: "total_units",     label: "Total Units",         placeholder: "e.g. 61", type: "number" },
              ] as { field: keyof ProjectInfo; label: string; placeholder: string; type?: string }[]
            ).map(({ field, label, placeholder, type }) => (
              <div key={field}>
                <label className="block text-xs text-slate-500 mb-1">{label}</label>
                <input
                  type={type ?? "text"}
                  value={projectInfo[field]}
                  onChange={(e) => handleInfoChange(field, e.target.value)}
                  placeholder={placeholder}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Project Type</label>
              <select
                value={projectInfo.project_type}
                onChange={(e) => handleInfoChange("project_type", e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
              >
                {PROJECT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Date Prepared</label>
              <input
                type="date"
                value={projectInfo.date_prepared}
                onChange={(e) => handleInfoChange("date_prepared", e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </section>

        {/* Overall progress */}
        <section className="bg-[#0F1729] border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-white">
                Overall Progress —{" "}
                <span className={overallPct === 100 ? "text-emerald-400" : "text-teal-400"}>
                  {overallPct}%
                </span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {totalChecked} of {totalItems} items complete
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={expandAll} className="text-xs text-slate-400 hover:text-white transition-colors">Expand all</button>
              <span className="text-slate-700">|</span>
              <button onClick={collapseAll} className="text-xs text-slate-400 hover:text-white transition-colors">Collapse all</button>
            </div>
          </div>

          {/* Master progress bar */}
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${overallPct === 100 ? "bg-emerald-500" : "bg-teal-500"}`}
              style={{ width: `${overallPct}%` }}
            />
          </div>

          {/* Per-section mini progress */}
          <div className="mt-4 grid grid-cols-6 sm:grid-cols-12 gap-1">
            {CHECKLIST_SECTIONS.map((s) => {
              const { checked, total } = sectionProgress(items, s.number);
              const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
              const done = checked === total;
              return (
                <button
                  key={s.number}
                  onClick={() => toggleSection(s.number)}
                  title={`${s.title} (${checked}/${total})`}
                  className="group flex flex-col items-center gap-1"
                >
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${done ? "bg-emerald-500" : pct > 0 ? "bg-teal-500" : "bg-slate-700"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-600 group-hover:text-slate-400 transition-colors">{s.number}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Upload errors */}
        {Object.entries(uploadErrors).length > 0 && (
          <div className="space-y-2">
            {Object.entries(uploadErrors).map(([id, msg]) => (
              <div key={id} className="text-xs text-red-400 bg-red-900/20 border border-red-700/30 rounded px-3 py-2 flex items-start justify-between gap-2">
                <span>{msg}</span>
                <button onClick={() => setUploadErrors((p) => { const n = { ...p }; delete n[id]; return n; })} className="shrink-0 text-red-500 hover:text-red-300">×</button>
              </div>
            ))}
          </div>
        )}

        {/* Sections */}
        <div className="space-y-3">
          {CHECKLIST_SECTIONS.map((section) => (
            <ChecklistSection
              key={section.number}
              sectionNum={section.number}
              title={section.title}
              description={section.description}
              items={items}
              expanded={expandedSections.has(section.number)}
              onToggle={() => toggleSection(section.number)}
              onItemChange={handleItemChange}
              onUpload={handleUpload}
              uploadingItems={uploadingItems}
            />
          ))}
        </div>

        {/* Completion banner */}
        {overallPct === 100 && (
          <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-2xl p-6 text-center">
            <p className="text-2xl mb-1">🎉</p>
            <p className="text-emerald-300 font-bold">All {totalItems} checklist items complete!</p>
            <p className="text-emerald-400/70 text-sm mt-1">
              {projectInfo.project_name || "Your project"} is ready for LHC submission.
            </p>
          </div>
        )}

        <p className="text-center text-xs text-slate-600 pb-8">
          Based on Louisiana Housing Corporation 2025 Qualified Allocation Plan (QAP) •{" "}
          <a href="https://lhc.la.gov" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">lhc.la.gov</a>
        </p>
      </main>
    </div>
  );
}
