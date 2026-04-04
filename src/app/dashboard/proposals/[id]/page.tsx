"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import type { Proposal, ComplianceCheck, QapScore } from "@/types";
import {
  formatCurrency,
  formatPercent,
  formatDscr,
  STATUS_CONFIG,
  RESULT_CONFIG,
  SEVERITY_CONFIG,
  CREDIT_TYPE_LABELS,
} from "@/lib/utils";

export default function ProposalDetailPage() {
  const params = useParams();
  const proposalId = params.id as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [checks, setChecks] = useState<ComplianceCheck[]>([]);
  const [qapScores, setQapScores] = useState<QapScore[]>([]);
  const [activeTab, setActiveTab] = useState<"compliance" | "qap" | "financial">("compliance");
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProposal();
  }, [proposalId]);

  async function loadProposal() {
    try {
      // In production, use the get_proposal_review RPC for a single call
      // For now, fetch separately
      const res = await fetch(`/api/proposals/${proposalId}`);
      const data = await res.json();
      setProposal(data.proposal);
      setChecks(data.compliance_checks || []);
      setQapScores(data.qap_scores || []);
    } catch (error) {
      console.error("Failed to load proposal:", error);
    } finally {
      setLoading(false);
    }
  }

  async function runAnalysis() {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal_id: proposalId }),
      });
      const result = await res.json();
      if (result.success) {
        // Reload proposal data with fresh analysis results
        await loadProposal();
      } else {
        alert("Analysis failed: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      alert("Analysis request failed");
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400">Loading proposal...</div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-400">Proposal not found</div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[proposal.status];
  const passedChecks = checks.filter((c) => c.result === "pass").length;
  const failedChecks = checks.filter((c) => c.result === "fail").length;
  const totalQapAwarded = qapScores.reduce((s, q) => s + q.awarded_points, 0);
  const totalQapMax = qapScores.reduce((s, q) => s + q.max_points, 0);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#080E1A]/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-slate-500 hover:text-teal-400 text-sm transition-colors">
              ← Dashboard
            </a>
            <div>
              <h1 className="text-xl font-bold">{proposal.project_name}</h1>
              <p className="text-xs text-slate-500">{proposal.proposal_number} · {proposal.developer_entity}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusCfg.bgColor} ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
            {!proposal.ai_analysis_completed && (
              <button
                onClick={runAnalysis}
                disabled={analyzing}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-brand-light disabled:opacity-50 transition-colors"
              >
                {analyzing ? "Analyzing..." : "Run AI Analysis"}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-6 gap-4 mb-8">
          {[
            { label: "Credit Type", value: CREDIT_TYPE_LABELS[proposal.credit_type] },
            { label: "Total Units", value: proposal.total_units?.toString() || "—" },
            { label: "TDC", value: formatCurrency(proposal.total_development_cost) },
            { label: "DSCR", value: formatDscr(proposal.dscr) },
            { label: "Compliance", value: proposal.compliance_score != null ? formatPercent(proposal.compliance_score, 0) : "Pending" },
            { label: "QAP Score", value: totalQapMax > 0 ? `${totalQapAwarded}/${totalQapMax}` : "Pending" },
          ].map((s, i) => (
            <div key={i} className="bg-[#0F1729] border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">{s.label}</div>
              <div className="text-lg font-bold text-white">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-slate-800 pb-3">
          {[
            { key: "compliance" as const, label: `Compliance Checks (${checks.length})` },
            { key: "qap" as const, label: `QAP Scoring (${qapScores.length})` },
            { key: "financial" as const, label: "Financial Summary" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === t.key
                  ? "bg-brand/20 text-teal-300 border border-brand/40"
                  : "text-slate-500 hover:text-slate-300 border border-transparent"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Compliance Checks Tab */}
        {activeTab === "compliance" && (
          <div className="space-y-3">
            {checks.length === 0 ? (
              <div className="bg-[#0F1729] border border-slate-800 rounded-xl p-12 text-center">
                <p className="text-slate-500 mb-4">No compliance analysis has been run yet.</p>
                <button
                  onClick={runAnalysis}
                  disabled={analyzing}
                  className="px-6 py-3 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-brand-light disabled:opacity-50"
                >
                  {analyzing ? "Running Analysis..." : "Run AI Compliance Analysis"}
                </button>
              </div>
            ) : (
              checks.map((check) => {
                const resultCfg = RESULT_CONFIG[check.result];
                const severityCfg = SEVERITY_CONFIG[check.severity];
                return (
                  <div
                    key={check.id}
                    className={`bg-[#0F1729] border rounded-xl p-5 ${
                      check.result === "fail"
                        ? "border-red-900/40"
                        : check.result === "needs_review"
                        ? "border-amber-900/40"
                        : "border-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold ${resultCfg.color}`}>
                          {resultCfg.icon}
                        </span>
                        <div>
                          <h3 className="text-sm font-semibold text-white">{check.check_name}</h3>
                          <span className="text-xs text-slate-500">{check.regulatory_citation}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${severityCfg.color}`}>
                          {severityCfg.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${resultCfg.color}`}>
                          {resultCfg.label}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{check.finding_detail}</p>
                    {check.expected_value && (
                      <div className="mt-2 flex gap-4 text-xs text-slate-500">
                        <span>Expected: <span className="text-slate-400">{check.expected_value}</span></span>
                        <span>Actual: <span className="text-slate-400">{check.actual_value}</span></span>
                      </div>
                    )}
                    {check.recommendation && (
                      <div className="mt-3 p-3 bg-slate-900/50 rounded-lg">
                        <span className="text-xs font-semibold text-amber-400">Recommendation: </span>
                        <span className="text-xs text-slate-400">{check.recommendation}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* QAP Scoring Tab */}
        {activeTab === "qap" && (
          <div className="space-y-3">
            {qapScores.length === 0 ? (
              <div className="bg-[#0F1729] border border-slate-800 rounded-xl p-12 text-center text-slate-500">
                QAP scoring will appear after AI analysis is run.
              </div>
            ) : (
              qapScores.map((score) => (
                <div key={score.id} className="bg-[#0F1729] border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white">{score.category_name}</h3>
                    <div className="flex items-center gap-3">
                      {score.confidence != null && (
                        <span className="text-xs text-slate-500">
                          {Math.round(score.confidence * 100)}% confidence
                        </span>
                      )}
                      <span className="text-lg font-bold text-teal-400">
                        {score.awarded_points}
                        <span className="text-sm text-slate-500">/{score.max_points}</span>
                      </span>
                    </div>
                  </div>
                  {/* Score bar */}
                  <div className="w-full bg-slate-800 rounded-full h-2 mb-3">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-emerald-400 h-2 rounded-full transition-all"
                      style={{ width: `${(score.awarded_points / score.max_points) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm text-slate-400 mb-2">{score.rationale}</p>
                  {score.recommendation && score.point_gap > 0 && (
                    <div className="p-3 bg-amber-900/10 border border-amber-900/20 rounded-lg">
                      <span className="text-xs font-semibold text-amber-400">
                        +{score.point_gap} points possible:{" "}
                      </span>
                      <span className="text-xs text-slate-400">{score.recommendation}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Financial Summary Tab */}
        {activeTab === "financial" && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-[#0F1729] border border-slate-800 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wider mb-4">
                Project Structure
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Total Development Cost", value: formatCurrency(proposal.total_development_cost) },
                  { label: "Eligible Basis", value: formatCurrency(proposal.eligible_basis) },
                  { label: "Tax Credit Equity", value: formatCurrency(proposal.tax_credit_equity) },
                  { label: "Credit Price", value: proposal.credit_price ? `$${proposal.credit_price.toFixed(4)}` : "—" },
                  { label: "Bond Amount", value: formatCurrency(proposal.bond_amount) },
                  { label: "Permanent Loan", value: formatCurrency(proposal.permanent_loan_amount) },
                  { label: "Permanent Rate", value: proposal.permanent_loan_rate ? `${(proposal.permanent_loan_rate * 100).toFixed(2)}%` : "—" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="text-white font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#0F1729] border border-slate-800 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wider mb-4">
                Key Metrics
              </h3>
              <div className="space-y-3">
                {[
                  { label: "DSCR", value: formatDscr(proposal.dscr) },
                  { label: "Developer Fee", value: formatCurrency(proposal.developer_fee) },
                  { label: "Developer Fee %", value: proposal.developer_fee_pct ? formatPercent(proposal.developer_fee_pct * 100) : "—" },
                  { label: "Total Units", value: proposal.total_units?.toString() || "—" },
                  { label: "Per-Unit TDC", value: proposal.total_units && proposal.total_development_cost ? formatCurrency(proposal.total_development_cost / proposal.total_units) : "—" },
                  { label: "QCT/DDA", value: proposal.is_qct ? "QCT" : proposal.is_dda ? "DDA" : "Neither" },
                  { label: "Set-Aside", value: proposal.set_aside_election?.replace("_", "/") || "—" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="text-white font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
