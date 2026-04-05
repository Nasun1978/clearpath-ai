"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { ProposalListItem, DashboardStats } from "@/types";
import {
  formatCurrency,
  formatPercent,
  STATUS_CONFIG,
  CREDIT_TYPE_LABELS,
  timeAgo,
} from "@/lib/utils";

export default function DashboardPage() {
  const [proposals, setProposals] = useState<ProposalListItem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [proposalsRes, statsRes] = await Promise.all([
          fetch("/api/proposals" + (statusFilter !== "all" ? `?status=${statusFilter}` : "")),
          fetch("/api/dashboard-stats"),
        ]);
        const proposalsData = await proposalsRes.json();
        const statsData = await statsRes.json();
        setProposals(proposalsData.proposals || []);
        setStats(statsData);
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
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#080E1A]/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-serif tracking-tight">
              RipeSpot
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 tracking-wide uppercase">
              Real Estate Development Platform
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/dashboard/deals" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors">
              Deal Pipeline
            </Link>
            <Link href="/dashboard/projects" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors">
              Projects
            </Link>
            <Link href="/dashboard/financial" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors">
              Financial Analysis
            </Link>
            <Link href="/dashboard/zoning" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors">
              Zoning Lookup
            </Link>
            <Link href="/dashboard/compliance" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors">
              HOME Compliance
            </Link>
            <Link href="/dashboard/checklist" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-900/40 text-teal-300 hover:bg-teal-800/50 border border-teal-800/50 transition-colors">
              LIHTC Checklist
            </Link>
            <a
              href="/submit"
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-brand-light transition-colors"
            >
              + New Proposal
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
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
    </div>
  );
}
