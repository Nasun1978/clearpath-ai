"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import DashboardSidebar from "@/components/DashboardSidebar";
import type { ChecklistItem } from "@/types";

interface DeadlineNotif {
  itemId: string;
  itemText: string;
  checklistName: string;
  due_date: string;
  urgency: "overdue" | "urgent" | "warning";
}

function classifyDeadlines(checklists: { project_name: string; checklist_items: ChecklistItem[] }[]): DeadlineNotif[] {
  const now = new Date();
  const notifs: DeadlineNotif[] = [];
  for (const cl of checklists) {
    for (const item of cl.checklist_items ?? []) {
      if (!item.due_date || item.checked) continue;
      const due = new Date(item.due_date + "T23:59:59");
      const diffMs = due.getTime() - now.getTime();
      let urgency: DeadlineNotif["urgency"] | null = null;
      if (diffMs < 0) urgency = "overdue";
      else if (diffMs < 24 * 60 * 60 * 1000) urgency = "urgent";
      else if (diffMs < 7 * 24 * 60 * 60 * 1000) urgency = "warning";
      if (urgency) notifs.push({ itemId: item.id, itemText: item.text, checklistName: cl.project_name || "Untitled", due_date: item.due_date, urgency });
    }
  }
  const order = { overdue: 0, urgent: 1, warning: 2 };
  return notifs.sort((a, b) => order[a.urgency] - order[b.urgency] || a.due_date.localeCompare(b.due_date));
}

function formatNotifDate(dateStr: string): string {
  const due = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const diffMs = new Date(dateStr + "T23:59:59").getTime() - now.getTime();
  const diffDays = Math.round(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
  if (diffMs < 0) return diffDays === 1 ? "Yesterday" : `${diffDays}d overdue`;
  if (diffMs < 24 * 60 * 60 * 1000) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [deadlines, setDeadlines] = useState<DeadlineNotif[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadDeadlines() {
      try {
        const res = await fetch("/api/checklist");
        if (!res.ok) return;
        const data = await res.json() as { checklists?: { project_name: string; checklist_items: ChecklistItem[] }[] };
        setDeadlines(classifyDeadlines(data.checklists ?? []));
      } catch {
        // non-critical
      }
    }
    loadDeadlines();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const urgentCount = deadlines.filter((d) => d.urgency === "overdue" || d.urgency === "urgent").length;

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar
        deadlineCount={urgentCount}
        onBellClick={() => setBellOpen((o) => !o)}
      />

      {/* Bell dropdown — rendered at layout level so it's above page content */}
      {bellOpen && (
        <div ref={bellRef} className="fixed left-56 bottom-16 w-80 bg-[#0F1729] border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Deadline Alerts</span>
            <Link href="/dashboard/checklist" onClick={() => setBellOpen(false)} className="text-xs text-teal-400 hover:text-teal-300">
              View checklist →
            </Link>
          </div>
          {deadlines.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-slate-500">No upcoming deadlines</div>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
              {deadlines.slice(0, 8).map((n) => (
                <div key={n.itemId} className="px-4 py-3 flex items-start gap-3">
                  <span className={`mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full ${
                    n.urgency === "overdue" ? "bg-red-500" :
                    n.urgency === "urgent" ? "bg-red-400" : "bg-amber-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 leading-snug truncate">{n.itemText}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{n.checklistName}</p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-semibold ${
                    n.urgency === "overdue" ? "text-red-400" :
                    n.urgency === "urgent" ? "text-red-400" : "text-amber-400"
                  }`}>
                    {formatNotifDate(n.due_date)}
                  </span>
                </div>
              ))}
            </div>
          )}
          {deadlines.length > 8 && (
            <div className="px-4 py-2 border-t border-slate-800 text-center text-xs text-slate-500">
              +{deadlines.length - 8} more —{" "}
              <Link href="/dashboard/checklist" onClick={() => setBellOpen(false)} className="text-teal-400 hover:text-teal-300">
                view all
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Main content — offset by sidebar width (w-56 = 224px, collapsed w-14 = 56px) */}
      <main className="flex-1 ml-56 min-w-0">
        {children}
      </main>
    </div>
  );
}
