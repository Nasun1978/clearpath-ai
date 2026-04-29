"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { ProposalListItem, DashboardStats, ChecklistItem, TaskAssignment } from "@/types";
import TrialBanner from "@/components/TrialBanner";
import {
  formatCurrency,
  formatPercent,
  STATUS_CONFIG,
  CREDIT_TYPE_LABELS,
  timeAgo,
} from "@/lib/utils";

// ── Deadline notification types & helpers ──────────────────────────────────────

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
  // Sort: overdue first, then urgent, then warning; within each group by due_date asc
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

export default function DashboardPage() {
  const [proposals, setProposals] = useState<ProposalListItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [deadlines, setDeadlines] = useState<DeadlineNotif[]>([]);
  const [myAssignments, setMyAssignments] = useState<TaskAssignment[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [proposalsRes, statsRes, checklistRes, myAssignRes] = await Promise.all([
          fetch("/api/proposals" + (statusFilter !== "all" ? `?status=${statusFilter}` : "")),
          fetch("/api/dashboard-stats"),
          fetch("/api/checklist"),
          fetch("/api/my-assignments"),
        ]);
        const proposalsData = await proposalsRes.json();
        const statsData = await statsRes.json();
        setProposals(proposalsData.proposals || []);
        setStats(statsData);

        if (checklistRes.ok) {
          const checklistData = await checklistRes.json() as { checklists?: { project_name: string; checklist_items: ChecklistItem[] }[] };
          setDeadlines(classifyDeadlines(checklistData.checklists ?? []));
        }

        if (myAssignRes.ok) {
          const assignData = await myAssignRes.json() as { assignments?: TaskAssignment[] };
          setMyAssignments(assignData.assignments ?? []);
        }
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <header className="border-b border-slate-800 bg-[#080E1A]/90 backdrop-blur-sm sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Proposal overview</p>
        </div>
        <a
          href="/submit"
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-brand-light transition-colors"
        >
          + New Proposal
        </a>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Admin shortcuts */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link href="/dashboard/admin"
            className="flex items-center gap-3 bg-amber-950/40 border border-amber-800/50 rounded-xl px-4 py-3 hover:border-amber-600/60 hover:bg-amber-950/60 transition-colors group">
            <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <p className="text-sm font-bold text-amber-300">Admin Panel</p>
              <p className="text-[10px] text-amber-600">Users, stats, platform management</p>
            </div>
          </Link>
          <Link href="/dashboard/admin/lihtc-pipeline"
            className="flex items-center gap-3 bg-amber-950/40 border border-amber-800/50 rounded-xl px-4 py-3 hover:border-amber-600/60 hover:bg-amber-950/60 transition-colors group">
            <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <div>
              <p className="text-sm font-bold text-amber-300">LIHTC Pipeline</p>
              <p className="text-[10px] text-amber-600">275 Houston properties · Map · Sell data</p>
            </div>
          </Link>
        </div>

        {/* Trial expiry banner — only renders when trial ends within 3 days */}
        <div className="mb-6">
          <TrialBanner />
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-5 gap-4 mb-8">
            {[
              { label: "Total Proposals", value: stats.total_proposals },
              { label: "In Review", value: stats.in_review },
              { label: "Approved", value: stats.approved },
              { label: "Avg Compliance", value: stats.avg_compliance_score ? `${stats.avg_compliance_score}%` : "—" },
              { label: "Units in Pipeline", value: stats.total_units_in_pipeline?.toLocaleString() || "0" },
            ].map((s, i) => (
              <div
                key={i}
                className="bg-[#0F1729] border border-slate-800 rounded-xl p-5"
              >
                <div className="text-3xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
                  {s.value}
                </div>
                <div className="text-sm text-slate-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Deadline Notifications Widget */}
        {deadlines.length > 0 && (
          <div className="mb-8 bg-[#0F1729] border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">LIHTC Checklist Deadlines</span>
                <span className="text-xs text-slate-500">
                  {deadlines.filter((d) => d.urgency === "overdue").length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-red-900/40 text-red-400 border border-red-700/30">
                      {deadlines.filter((d) => d.urgency === "overdue").length} overdue
                    </span>
                  )}
                  {deadlines.filter((d) => d.urgency === "urgent").length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 border border-red-700/20">
                      {deadlines.filter((d) => d.urgency === "urgent").length} due today
                    </span>
                  )}
                  {deadlines.filter((d) => d.urgency === "warning").length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-400 border border-amber-700/20">
                      {deadlines.filter((d) => d.urgency === "warning").length} this week
                    </span>
                  )}
                </span>
              </div>
              <Link href="/dashboard/checklist" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
                Open checklist →
              </Link>
            </div>
            <div className="divide-y divide-slate-800/50">
              {deadlines.map((n) => (
                <div key={n.itemId} className={`px-5 py-3 flex items-center gap-4 ${
                  n.urgency === "overdue" ? "bg-red-950/10" :
                  n.urgency === "urgent" ? "bg-red-950/10" : "bg-amber-950/10"
                }`}>
                  {/* Urgency indicator */}
                  <div className={`shrink-0 w-1 self-stretch rounded-full ${
                    n.urgency === "overdue" ? "bg-red-500" :
                    n.urgency === "urgent" ? "bg-red-400" : "bg-amber-400"
                  }`} />
                  {/* Item text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{n.itemText}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.checklistName}</p>
                  </div>
                  {/* Due date label */}
                  <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded border ${
                    n.urgency === "overdue"
                      ? "bg-red-900/30 text-red-400 border-red-700/30"
                      : n.urgency === "urgent"
                      ? "bg-red-900/20 text-red-400 border-red-700/20"
                      : "bg-amber-900/20 text-amber-400 border-amber-700/20"
                  }`}>
                    {n.urgency === "overdue" ? "⚠ " : n.urgency === "urgent" ? "⚡ " : ""}
                    {formatNotifDate(n.due_date)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Assigned Tasks widget */}
        {myAssignments.length > 0 && (
          <div className="mb-8 bg-[#0F1729] border border-teal-800/30 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">My Assigned Tasks</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-900/40 text-teal-300 border border-teal-800/50 font-semibold">
                  {myAssignments.filter((a) => a.status !== "complete").length} open
                </span>
              </div>
              <Link href="/dashboard/checklist" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
                Open checklist →
              </Link>
            </div>
            <div className="divide-y divide-slate-800/50">
              {myAssignments.map((a) => {
                const isComplete = a.status === "complete";
                const isOverdue  = a.due_date && new Date(a.due_date + "T23:59:59") < new Date();
                return (
                  <div
                    key={a.id}
                    className={`px-5 py-3 flex items-center gap-4 ${isComplete ? "opacity-50" : isOverdue ? "bg-red-950/10" : ""}`}
                  >
                    <div className={`shrink-0 w-1 self-stretch rounded-full ${
                      isComplete ? "bg-emerald-600" : isOverdue ? "bg-red-500" : "bg-teal-500"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${isComplete ? "text-slate-500 line-through" : "text-slate-200"}`}>
                        {a.item_text}
                      </p>
                      {a.checklist_name && (
                        <p className="text-xs text-slate-500 mt-0.5">{a.checklist_name}</p>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {a.due_date && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                          isOverdue
                            ? "bg-red-900/30 text-red-400 border-red-700/30"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}>
                          {new Date(a.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        a.status === "complete"   ? "bg-emerald-900/30 text-emerald-400 border-emerald-700/30" :
                        a.status === "in_progress"? "bg-blue-900/30 text-blue-400 border-blue-700/30" :
                        "bg-slate-800 text-slate-500 border-slate-700"
                      }`}>
                        {a.status === "in_progress" ? "In Progress" : a.status === "complete" ? "Done" : "Pending"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm text-slate-500">Filter:</span>
          {["all", "received", "in_review", "deficiency", "approved", "denied"].map(
            (f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  statusFilter === f
                    ? "bg-brand/20 text-teal-300 border-brand/40"
                    : "bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300"
                }`}
              >
                {f === "all" ? "All" : STATUS_CONFIG[f as keyof typeof STATUS_CONFIG]?.label || f}
              </button>
            )
          )}
        </div>

        {/* Proposals Table */}
        <div className="bg-[#0F1729] border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-5 py-3 text-xs font-semibold text-teal-400 uppercase tracking-wider">
                  Project
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-teal-400 uppercase tracking-wider">
                  Developer
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-teal-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-teal-400 uppercase tracking-wider">
                  TDC
                </th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-teal-400 uppercase tracking-wider">
                  Compliance
                </th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-teal-400 uppercase tracking-wider">
                  QAP Score
                </th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-teal-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-teal-400 uppercase tracking-wider">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((p, i) => {
                const statusCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.draft;
                return (
                  <tr
                    key={p.id}
                    className={`border-b border-slate-800/50 hover:bg-slate-800/30 cursor-pointer transition-colors ${
                      i % 2 === 0 ? "bg-[#0B1222]/30" : ""
                    }`}
                    onClick={() => (window.location.href = `/dashboard/proposals/${p.id}`)}
                  >
                    <td className="px-5 py-3">
                      <div className="text-sm font-semibold text-white">
                        {p.project_name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {p.proposal_number}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-300">
                      {p.developer_entity}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-400 border border-slate-700">
                        {CREDIT_TYPE_LABELS[p.credit_type] || p.credit_type}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-right text-slate-300">
                      {formatCurrency(p.total_development_cost)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {p.compliance_score != null ? (
                        <span
                          className={`text-sm font-semibold ${
                            p.compliance_score >= 80
                              ? "text-emerald-400"
                              : p.compliance_score >= 60
                              ? "text-amber-400"
                              : "text-red-400"
                          }`}
                        >
                          {formatPercent(p.compliance_score, 0)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">Pending</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {p.preliminary_qap_score != null ? (
                        <span className="text-sm text-slate-300">
                          {p.preliminary_qap_score}/{p.max_qap_score}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.bgColor} ${statusCfg.color}`}
                      >
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-slate-500">
                      {timeAgo(p.submitted_at)}
                    </td>
                  </tr>
                );
              })}
              {proposals.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    No proposals found. Submit one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 mt-8 py-6 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} RipeSpot Development</p>
          <a
            href="mailto:steven@ripespotdevelopment.com?subject=RipeSpot%20Question"
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact Support
          </a>
        </div>
      </footer>
    </div>
  );
}
