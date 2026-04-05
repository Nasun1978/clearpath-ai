"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CreditType, SetAsideElection } from "@/types";

export default function SubmitProposalPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    project_name: "",
    developer_entity: "",
    developer_contact_name: "",
    developer_contact_email: "",
    credit_type: "lihtc_4pct" as CreditType,
    set_aside_election: "40_60" as SetAsideElection,
    project_address: "",
    city: "",
    county: "",
    state: "TX",
    total_units: "",
    ami_30_pct_units: "",
    ami_50_pct_units: "",
    ami_60_pct_units: "",
    ami_80_pct_units: "",
    total_development_cost: "",
    eligible_basis: "",
    bond_amount: "",
    permanent_loan_amount: "",
    permanent_loan_rate: "",
    dscr: "",
    developer_fee: "",
    credit_price: "",
    is_qct: false,
    is_dda: false,
    is_new_construction: true,
    qap_state: "TX",
    qap_year: new Date().getFullYear(),
  });

  function updateField(field: string, value: string | boolean | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Convert numeric string fields to numbers
      const payload = {
        ...form,
        total_units: form.total_units ? parseInt(form.total_units) : null,
        ami_30_pct_units: form.ami_30_pct_units ? parseInt(form.ami_30_pct_units) : 0,
        ami_50_pct_units: form.ami_50_pct_units ? parseInt(form.ami_50_pct_units) : 0,
        ami_60_pct_units: form.ami_60_pct_units ? parseInt(form.ami_60_pct_units) : 0,
        ami_80_pct_units: form.ami_80_pct_units ? parseInt(form.ami_80_pct_units) : 0,
        total_development_cost: form.total_development_cost ? parseFloat(form.total_development_cost) : null,
        eligible_basis: form.eligible_basis ? parseFloat(form.eligible_basis) : null,
        bond_amount: form.bond_amount ? parseFloat(form.bond_amount) : null,
        permanent_loan_amount: form.permanent_loan_amount ? parseFloat(form.permanent_loan_amount) : null,
        permanent_loan_rate: form.permanent_loan_rate ? parseFloat(form.permanent_loan_rate) / 100 : null,
        dscr: form.dscr ? parseFloat(form.dscr) : null,
        developer_fee: form.developer_fee ? parseFloat(form.developer_fee) : null,
        credit_price: form.credit_price ? parseFloat(form.credit_price) : null,
      };

      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.proposal?.id) {
        router.push(`/dashboard/proposals/${data.proposal.id}`);
      } else {
        alert("Submission failed: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      alert("Failed to submit proposal");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30";
  const labelClass = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5";
  const sectionClass = "bg-[#0F1729] border border-slate-800 rounded-xl p-6 mb-6";

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-[#080E1A]/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Submit Development Proposal</h1>
            <p className="text-xs text-slate-500 mt-0.5">RipeSpot — Compliance Review Platform</p>
          </div>
          <a href="/dashboard" className="text-sm text-slate-500 hover:text-teal-400">← Dashboard</a>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-6 py-8">
        {/* Project & Developer Info */}
        <div className={sectionClass}>
          <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wider mb-4">Project Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelClass}>Project Name *</label>
              <input className={inputClass} required value={form.project_name} onChange={(e) => updateField("project_name", e.target.value)} placeholder="e.g., Live Oak Residences" />
            </div>
            <div>
              <label className={labelClass}>Developer Entity *</label>
              <input className={inputClass} required value={form.developer_entity} onChange={(e) => updateField("developer_entity", e.target.value)} placeholder="e.g., REO, LLC" />
            </div>
            <div>
              <label className={labelClass}>Contact Email</label>
              <input className={inputClass} type="email" value={form.developer_contact_email} onChange={(e) => updateField("developer_contact_email", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <input className={inputClass} value={form.project_address} onChange={(e) => updateField("project_address", e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={labelClass}>City</label><input className={inputClass} value={form.city} onChange={(e) => updateField("city", e.target.value)} /></div>
              <div><label className={labelClass}>County</label><input className={inputClass} value={form.county} onChange={(e) => updateField("county", e.target.value)} /></div>
              <div><label className={labelClass}>State</label><input className={inputClass} value={form.state} onChange={(e) => updateField("state", e.target.value)} /></div>
            </div>
          </div>
        </div>

        {/* Program Structure */}
        <div className={sectionClass}>
          <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wider mb-4">Program Structure</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Credit Type *</label>
              <select className={inputClass} value={form.credit_type} onChange={(e) => updateField("credit_type", e.target.value)}>
                <option value="lihtc_4pct">4% LIHTC</option>
                <option value="lihtc_9pct">9% LIHTC</option>
                <option value="home">HOME</option>
                <option value="htf">HTF</option>
                <option value="cdbg">CDBG</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Set-Aside Election</label>
              <select className={inputClass} value={form.set_aside_election} onChange={(e) => updateField("set_aside_election", e.target.value)}>
                <option value="20_50">20/50</option>
                <option value="40_60">40/60</option>
                <option value="income_average">Income Average</option>
                <option value="not_applicable">N/A</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>QAP State</label>
              <select className={inputClass} value={form.qap_state} onChange={(e) => updateField("qap_state", e.target.value)}>
                <option value="TX">Texas (TDHCA)</option>
                <option value="LA">Louisiana (LHC)</option>
              </select>
            </div>
            <div className="flex items-center gap-6 col-span-3">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={form.is_new_construction} onChange={(e) => updateField("is_new_construction", e.target.checked)} className="rounded" /> New Construction
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={form.is_qct} onChange={(e) => updateField("is_qct", e.target.checked)} className="rounded" /> QCT
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={form.is_dda} onChange={(e) => updateField("is_dda", e.target.checked)} className="rounded" /> DDA
              </label>
            </div>
          </div>
        </div>

        {/* Unit Mix */}
        <div className={sectionClass}>
          <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wider mb-4">Unit Mix</h2>
          <div className="grid grid-cols-5 gap-4">
            <div><label className={labelClass}>Total Units</label><input className={inputClass} type="number" value={form.total_units} onChange={(e) => updateField("total_units", e.target.value)} /></div>
            <div><label className={labelClass}>30% AMI Units</label><input className={inputClass} type="number" value={form.ami_30_pct_units} onChange={(e) => updateField("ami_30_pct_units", e.target.value)} /></div>
            <div><label className={labelClass}>50% AMI Units</label><input className={inputClass} type="number" value={form.ami_50_pct_units} onChange={(e) => updateField("ami_50_pct_units", e.target.value)} /></div>
            <div><label className={labelClass}>60% AMI Units</label><input className={inputClass} type="number" value={form.ami_60_pct_units} onChange={(e) => updateField("ami_60_pct_units", e.target.value)} /></div>
            <div><label className={labelClass}>80% AMI Units</label><input className={inputClass} type="number" value={form.ami_80_pct_units} onChange={(e) => updateField("ami_80_pct_units", e.target.value)} /></div>
          </div>
        </div>

        {/* Financials */}
        <div className={sectionClass}>
          <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wider mb-4">Financial Summary</h2>
          <div className="grid grid-cols-3 gap-4">
            <div><label className={labelClass}>Total Development Cost ($)</label><input className={inputClass} type="number" value={form.total_development_cost} onChange={(e) => updateField("total_development_cost", e.target.value)} placeholder="24600000" /></div>
            <div><label className={labelClass}>Eligible Basis ($)</label><input className={inputClass} type="number" value={form.eligible_basis} onChange={(e) => updateField("eligible_basis", e.target.value)} /></div>
            <div><label className={labelClass}>Bond Amount ($) (4% deals)</label><input className={inputClass} type="number" value={form.bond_amount} onChange={(e) => updateField("bond_amount", e.target.value)} /></div>
            <div><label className={labelClass}>Permanent Loan ($)</label><input className={inputClass} type="number" value={form.permanent_loan_amount} onChange={(e) => updateField("permanent_loan_amount", e.target.value)} /></div>
            <div><label className={labelClass}>Permanent Rate (%)</label><input className={inputClass} type="number" step="0.01" value={form.permanent_loan_rate} onChange={(e) => updateField("permanent_loan_rate", e.target.value)} placeholder="3.75" /></div>
            <div><label className={labelClass}>DSCR</label><input className={inputClass} type="number" step="0.01" value={form.dscr} onChange={(e) => updateField("dscr", e.target.value)} placeholder="1.25" /></div>
            <div><label className={labelClass}>Developer Fee ($)</label><input className={inputClass} type="number" value={form.developer_fee} onChange={(e) => updateField("developer_fee", e.target.value)} /></div>
            <div><label className={labelClass}>Credit Price ($)</label><input className={inputClass} type="number" step="0.0001" value={form.credit_price} onChange={(e) => updateField("credit_price", e.target.value)} placeholder="0.9200" /></div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <a href="/dashboard" className="px-6 py-3 rounded-lg text-sm font-semibold text-slate-400 border border-slate-700 hover:text-white hover:border-slate-500 transition-colors">
            Cancel
          </a>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-brand-light disabled:opacity-50 transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Proposal"}
          </button>
        </div>
      </form>
    </div>
  );
}
