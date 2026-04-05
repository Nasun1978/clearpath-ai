"use client";
import { useState } from "react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

type SectionId =
  | "affordability"
  | "davis-bacon"
  | "income"
  | "property"
  | "checker";

type ProjectUse = "rental_new" | "rental_rehab" | "homebuyer_new" | "homebuyer_rehab";

interface CheckerInputs {
  projectUse: ProjectUse;
  totalUnits: string;
  homeAssistedUnits: string;
  homeAmountPerUnit: string;
}

interface CheckerResult {
  affordabilityPeriod: number;
  affordabilityBasis: string;
  davisBaconApplies: boolean;
  davisBaconBasis: string;
  incomeTargeting: string[];
  rentLimits: string[];
  propertyStandards: string[];
  warnings: string[];
}

// ── Compliance calculation ────────────────────────────────────────────────────

function calculateCompliance(inputs: CheckerInputs): CheckerResult | null {
  const homeAmt = parseFloat(inputs.homeAmountPerUnit);
  const assistedUnits = parseInt(inputs.homeAssistedUnits);
  const totalUnits = parseInt(inputs.totalUnits);

  if (isNaN(homeAmt) || isNaN(assistedUnits) || isNaN(totalUnits)) return null;

  // ── Affordability period ──
  let affordabilityPeriod: number;
  let affordabilityBasis: string;

  if (inputs.projectUse === "rental_new") {
    affordabilityPeriod = 20;
    affordabilityBasis =
      "24 CFR §92.252(e)(1): New construction rental projects require a minimum 20-year affordability period.";
  } else if (inputs.projectUse === "rental_rehab") {
    if (homeAmt <= 50000) {
      affordabilityPeriod = 5;
      affordabilityBasis =
        "24 CFR §92.252(e)(2): Rental rehabilitation with HOME investment of $15,000–$50,000 per unit requires a 5-year affordability period.";
    } else if (homeAmt <= 75000) {
      affordabilityPeriod = 10;
      affordabilityBasis =
        "24 CFR §92.252(e)(2): Rental rehabilitation with HOME investment of $50,001–$75,000 per unit requires a 10-year affordability period.";
    } else {
      affordabilityPeriod = 15;
      affordabilityBasis =
        "24 CFR §92.252(e)(2): Rental rehabilitation with HOME investment over $75,000 per unit requires a 15-year affordability period.";
    }
  } else if (inputs.projectUse === "homebuyer_new") {
    affordabilityPeriod = 20;
    affordabilityBasis =
      "24 CFR §92.254(a)(4): Homebuyer new construction requires a 20-year affordability period (2025 final rule).";
  } else {
    // homebuyer_rehab — 2025 final rule thresholds mirror rental rehab
    if (homeAmt < 15000) {
      affordabilityPeriod = 5;
      affordabilityBasis =
        "24 CFR §92.254(a)(4): Homebuyer acquisition/rehab with HOME investment under $15,000 requires a 5-year affordability period.";
    } else if (homeAmt <= 40000) {
      affordabilityPeriod = 10;
      affordabilityBasis =
        "24 CFR §92.254(a)(4): Homebuyer acquisition/rehab with HOME investment of $15,000–$40,000 requires a 10-year affordability period.";
    } else {
      affordabilityPeriod = 15;
      affordabilityBasis =
        "24 CFR §92.254(a)(4): Homebuyer acquisition/rehab with HOME investment over $40,000 requires a 15-year affordability period.";
    }
  }

  // ── Davis-Bacon ──
  // Applies to projects with 12+ HOME-assisted units; threshold is based on
  // assisted units across the entire project, not contracts or buildings.
  const davisBaconApplies = assistedUnits >= 12;
  const davisBaconBasis = davisBaconApplies
    ? `Davis-Bacon Act applies. Your project has ${assistedUnits} HOME-assisted units (≥12). Prevailing wages must be paid to ALL construction workers on the entire project, including non-HOME units. See 40 U.S.C. §3142 and 24 CFR §92.354.`
    : `Davis-Bacon Act does NOT apply. Your project has ${assistedUnits} HOME-assisted units (<12 threshold). Note: You cannot split the project into multiple contracts or phases to circumvent this threshold.`;

  // ── Income targeting ──
  const isRental =
    inputs.projectUse === "rental_new" || inputs.projectUse === "rental_rehab";

  const incomeTargeting: string[] = [];
  if (isRental) {
    const lowHomeUnits = Math.ceil(assistedUnits * 0.2);
    incomeTargeting.push(
      `At least ${lowHomeUnits} unit${lowHomeUnits > 1 ? "s" : ""} (20% of ${assistedUnits} HOME-assisted units) must be reserved for families at or below 50% AMI — these are "Low HOME" units.`
    );
    incomeTargeting.push(
      `Remaining ${assistedUnits - lowHomeUnits} HOME-assisted unit${assistedUnits - lowHomeUnits !== 1 ? "s" : ""} may serve families up to 80% AMI — these are "High HOME" units.`
    );
    incomeTargeting.push(
      "Income must be verified at initial occupancy; recertification required annually for rental projects."
    );
  } else {
    incomeTargeting.push(
      "Homebuyer must be an income-eligible household at or below 80% AMI at time of purchase."
    );
    incomeTargeting.push(
      "Purchase price may not exceed HUD-established maximum purchase price limits for the area."
    );
  }

  // ── Rent limits ──
  const rentLimits: string[] = [];
  if (isRental) {
    rentLimits.push(
      "Low HOME rent (50% AMI units): lesser of (a) Fair Market Rent or (b) 30% of 50% AMI adjusted for unit size."
    );
    rentLimits.push(
      "High HOME rent (80% AMI units): lesser of (a) Fair Market Rent or (b) 30% of 65% AMI adjusted for unit size."
    );
    rentLimits.push(
      "Utility allowances must be subtracted from gross rent to determine tenant payment. HUD publishes annual HOME rent limits."
    );
  }

  // ── Property standards ──
  const propertyStandards: string[] = [
    "Must meet applicable local building codes and ordinances at completion.",
  ];
  if (inputs.projectUse === "rental_new" || inputs.projectUse === "homebuyer_new") {
    propertyStandards.push(
      "New construction must comply with HUD-identified green building standards (e.g., ENERGY STAR, Enterprise Green Communities, or equivalent) per 24 CFR §92.251(b)(1)."
    );
  }
  propertyStandards.push(
    "HQS or local equivalents must be met at initial occupancy and maintained throughout the affordability period."
  );
  propertyStandards.push(
    "Lead-based paint requirements under 24 CFR Part 35 apply to all pre-1978 construction; visual assessment required at minimum."
  );

  // ── Warnings ──
  const warnings: string[] = [];
  if (assistedUnits > totalUnits) {
    warnings.push(
      "HOME-assisted units cannot exceed total project units. Please verify your inputs."
    );
  }
  if (homeAmt < 1000 && inputs.projectUse === "rental_rehab") {
    warnings.push(
      "HOME investment under $1,000 per unit is unusually low for rehabilitation. Verify the per-unit amount."
    );
  }
  if (inputs.projectUse === "rental_rehab" && homeAmt < 15000) {
    warnings.push(
      "Per-unit HOME investment under $15,000 may not meet the minimum threshold required for the HOME program to establish an affordability period in some PJ interpretations. Confirm with your Participating Jurisdiction."
    );
  }
  if (davisBaconApplies && totalUnits > assistedUnits) {
    warnings.push(
      `Davis-Bacon prevailing wages apply to ALL ${totalUnits} units in the project (including the ${totalUnits - assistedUnits} non-HOME unit${totalUnits - assistedUnits !== 1 ? "s" : ""}), not just the ${assistedUnits} HOME-assisted units.`
    );
  }

  return {
    affordabilityPeriod,
    affordabilityBasis,
    davisBaconApplies,
    davisBaconBasis,
    incomeTargeting,
    rentLimits,
    propertyStandards,
    warnings,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-[#0F1729] border border-slate-800 rounded-2xl p-6 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
      {children}
    </h2>
  );
}

function Badge({
  children,
  color = "teal",
}: {
  children: React.ReactNode;
  color?: "teal" | "amber" | "red" | "slate" | "emerald" | "purple";
}) {
  const colors = {
    teal: "bg-teal-900/40 text-teal-300 border-teal-700/40",
    amber: "bg-amber-900/40 text-amber-300 border-amber-700/40",
    red: "bg-red-900/40 text-red-300 border-red-700/40",
    slate: "bg-slate-800 text-slate-400 border-slate-700/40",
    emerald: "bg-emerald-900/40 text-emerald-300 border-emerald-700/40",
    purple: "bg-purple-900/40 text-purple-300 border-purple-700/40",
  };
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[color]}`}
    >
      {children}
    </span>
  );
}

function Citation({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs text-slate-500 font-mono">
      {children}
    </span>
  );
}

// ── Nav tabs ──────────────────────────────────────────────────────────────────

const NAV: { id: SectionId; label: string; icon: string }[] = [
  { id: "affordability", label: "Affordability", icon: "📅" },
  { id: "davis-bacon", label: "Davis-Bacon", icon: "🔨" },
  { id: "income", label: "Income Targeting", icon: "👥" },
  { id: "property", label: "Property Standards", icon: "🏗️" },
  { id: "checker", label: "Compliance Checker", icon: "✅" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CompliancePage() {
  const [activeSection, setActiveSection] = useState<SectionId>("affordability");
  const [inputs, setInputs] = useState<CheckerInputs>({
    projectUse: "rental_new",
    totalUnits: "",
    homeAssistedUnits: "",
    homeAmountPerUnit: "",
  });
  const result = calculateCompliance(inputs);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#080E1A]/90 backdrop-blur-sm sticky top-0 z-20 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm">
              Back
            </Link>
            <div>
              <h1 className="text-lg font-bold">
                <span className="text-teal-400">HUD HOME</span> Compliance Guide
              </h1>
              <p className="text-xs text-slate-500">
                2025 Final Rule · 24 CFR Part 92
              </p>
            </div>
          </div>
          <Badge color="teal">Reference Tool</Badge>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Nav tabs */}
        <nav className="flex flex-wrap gap-2 mb-8">
          {NAV.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeSection === id
                  ? "bg-teal-600 text-white shadow-lg shadow-teal-900/30"
                  : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700"
              }`}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        {/* ── Section: Affordability Periods ─────────────────────────────── */}
        {activeSection === "affordability" && (
          <div className="space-y-6">
            <SectionCard>
              <SectionTitle>
                Affordability Period Requirements
                <Badge color="teal">2025 Final Rule</Badge>
              </SectionTitle>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                HOME-assisted units must remain affordable for a mandatory period following
                project completion or occupancy. The period is determined by the type of
                activity and the amount of HOME investment per unit. Violations during
                this period require repayment of HOME funds to the Participating Jurisdiction (PJ).
              </p>

              {/* Rental table */}
              <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider mb-3">
                Rental Projects
              </h3>
              <div className="overflow-x-auto mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 pr-4 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                        Activity
                      </th>
                      <th className="text-left py-2 pr-4 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                        Per-Unit HOME Investment
                      </th>
                      <th className="text-center py-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                        Required Period
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr>
                      <td className="py-3 pr-4 text-white font-medium">
                        New Construction
                      </td>
                      <td className="py-3 pr-4 text-slate-400">Any amount</td>
                      <td className="py-3 text-center">
                        <Badge color="purple">20 years</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 text-white font-medium">Rehabilitation</td>
                      <td className="py-3 pr-4 text-slate-400">$15,000 – $50,000</td>
                      <td className="py-3 text-center">
                        <Badge color="teal">5 years</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 text-white font-medium">Rehabilitation</td>
                      <td className="py-3 pr-4 text-slate-400">$50,001 – $75,000</td>
                      <td className="py-3 text-center">
                        <Badge color="amber">10 years</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 text-white font-medium">Rehabilitation</td>
                      <td className="py-3 pr-4 text-slate-400">Over $75,000</td>
                      <td className="py-3 text-center">
                        <Badge color="red">15 years</Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500 mb-6">
                <Citation>24 CFR §92.252(e)</Citation> — Period begins at project completion for
                rental projects (date of last disbursement of HOME funds).
              </p>

              {/* Homebuyer table */}
              <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider mb-3">
                Homebuyer Programs
              </h3>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 pr-4 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                        Activity
                      </th>
                      <th className="text-left py-2 pr-4 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                        Per-Unit HOME Investment
                      </th>
                      <th className="text-center py-2 text-xs text-slate-500 uppercase tracking-wider font-semibold">
                        Required Period
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr>
                      <td className="py-3 pr-4 text-white font-medium">
                        New Construction
                      </td>
                      <td className="py-3 pr-4 text-slate-400">Any amount</td>
                      <td className="py-3 text-center">
                        <Badge color="purple">20 years</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 text-white font-medium">
                        Acquisition / Rehab
                      </td>
                      <td className="py-3 pr-4 text-slate-400">Under $15,000</td>
                      <td className="py-3 text-center">
                        <Badge color="teal">5 years</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 text-white font-medium">
                        Acquisition / Rehab
                      </td>
                      <td className="py-3 pr-4 text-slate-400">$15,000 – $40,000</td>
                      <td className="py-3 text-center">
                        <Badge color="amber">10 years</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 text-white font-medium">
                        Acquisition / Rehab
                      </td>
                      <td className="py-3 pr-4 text-slate-400">Over $40,000</td>
                      <td className="py-3 text-center">
                        <Badge color="red">15 years</Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500">
                <Citation>24 CFR §92.254(a)(4)</Citation> — Period begins at date of initial
                purchase for homebuyer projects. The deed restriction or other legal instrument
                must be recorded with the property.
              </p>
            </SectionCard>

            <SectionCard>
              <SectionTitle>Enforcement & Recapture</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                {[
                  {
                    title: "Resale Restriction",
                    body: "Property may only be sold to an income-eligible buyer at an affordable price during the period. PJ must enforce through a deed restriction.",
                    color: "border-teal-700/40",
                  },
                  {
                    title: "Recapture Provision",
                    body: "Upon sale, PJ recaptures the HOME investment (or a share of net proceeds) if the home is sold before the period expires. Amount may be prorated.",
                    color: "border-amber-700/40",
                  },
                  {
                    title: "Rental Compliance",
                    body: "Rental owners must maintain rents at or below HOME limits and occupy with income-eligible tenants. Annual monitoring required by the PJ.",
                    color: "border-purple-700/40",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className={`bg-slate-900/50 border ${item.color} rounded-xl p-4`}
                  >
                    <p className="font-semibold text-white mb-2">{item.title}</p>
                    <p className="text-slate-400 text-xs leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {/* ── Section: Davis-Bacon ────────────────────────────────────────── */}
        {activeSection === "davis-bacon" && (
          <div className="space-y-6">
            <SectionCard>
              <SectionTitle>
                Davis-Bacon Act Requirements
                <Badge color="amber">Labor Standards</Badge>
              </SectionTitle>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                The Davis-Bacon Act requires that workers on federally funded construction
                projects be paid locally prevailing wages. For HOME-funded projects, the
                threshold and scope are specifically defined in{" "}
                <Citation>24 CFR §92.354</Citation> and differ from other HUD programs
                like CDBG.
              </p>

              {/* Threshold callout */}
              <div className="bg-amber-900/20 border border-amber-700/40 rounded-2xl p-5 mb-6">
                <p className="text-amber-300 font-bold text-lg mb-1">
                  12-Unit Threshold
                </p>
                <p className="text-sm text-amber-200/80 leading-relaxed">
                  Davis-Bacon applies when the project has{" "}
                  <strong className="text-amber-200">12 or more HOME-assisted units</strong>.
                  The count is based on HOME-<em>assisted</em> units, not total project units.
                </p>
              </div>

              {/* Key rules grid */}
              <div className="space-y-4">
                {[
                  {
                    icon: "⚠️",
                    title: "Entire Project Scope",
                    body: 'When Davis-Bacon applies, prevailing wages must be paid to ALL laborers and mechanics on the entire project — including construction on non-HOME units. This is a critical distinction: it is not limited to the HOME-funded portion of work.',
                    color: "border-amber-700/30",
                  },
                  {
                    icon: "🔍",
                    title: '"Assisted" vs. "Financed" — Broader Than CDBG',
                    body: 'The HOME standard is based on "assisted" units — any unit receiving HOME funds counts. CDBG uses a narrower "financed" standard. As a result, Davis-Bacon under HOME can apply more broadly, particularly in mixed-finance developments where HOME funds assist specific units that may not be the primary financing source.',
                    color: "border-teal-700/30",
                  },
                  {
                    icon: "🙌",
                    title: "Sweat Equity Exemption",
                    body: "Bona fide sweat equity participants — homebuyers who contribute their own labor toward construction or rehabilitation of their own home — are exempt from Davis-Bacon prevailing wage requirements. This exemption does not extend to hired contractors working alongside sweat equity participants.",
                    color: "border-emerald-700/30",
                  },
                  {
                    icon: "🚫",
                    title: "Anti-Splitting Rule",
                    body: 'Projects may NOT be divided into multiple contracts, phases, or separate buildings to reduce the HOME-assisted unit count below the 12-unit threshold. HUD and HUD OIG actively scrutinize contract structures that appear designed to circumvent Davis-Bacon. The relevant question is whether the work is part of a single "project" as defined in 24 CFR §92.2.',
                    color: "border-red-700/30",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className={`bg-slate-900/40 border ${item.color} rounded-xl p-5`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-0.5">{item.icon}</span>
                      <div>
                        <p className="font-semibold text-white mb-2">{item.title}</p>
                        <p className="text-sm text-slate-400 leading-relaxed">{item.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard>
              <SectionTitle>Compliance Checklist</SectionTitle>
              <div className="space-y-3">
                {[
                  "Obtain applicable wage determinations from SAM.gov / Wage Determinations Online before bid",
                  "Include Davis-Bacon wage rates and Federal Labor Standards in all prime contracts and subcontracts",
                  "Post wage determinations on the job site in a prominent location",
                  "Collect certified payrolls weekly from all contractors and subcontractors (Form WH-347)",
                  "Conduct employee interviews to verify reported wages",
                  "Resolve any underpayments or back-wage findings promptly — uncorrected violations can trigger debarment",
                  "Retain all payroll records and interview documentation for at least 3 years after project completion",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-teal-900/50 border border-teal-700/40 flex items-center justify-center text-teal-400 text-xs font-bold mt-0.5">
                      {i + 1}
                    </span>
                    {item}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-4">
                <Citation>29 CFR Parts 1, 3, 5</Citation> ·{" "}
                <Citation>24 CFR §92.354</Citation> ·{" "}
                <Citation>40 U.S.C. §3142</Citation>
              </p>
            </SectionCard>
          </div>
        )}

        {/* ── Section: Income Targeting ───────────────────────────────────── */}
        {activeSection === "income" && (
          <div className="space-y-6">
            <SectionCard>
              <SectionTitle>
                Income Targeting Requirements
                <Badge color="purple">Rental</Badge>
              </SectionTitle>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                HOME rental projects must target income-eligible households and maintain rent
                limits throughout the affordability period.{" "}
                <Citation>24 CFR §92.252</Citation> establishes two tiers of HOME-assisted units.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-purple-900/20 border border-purple-700/40 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-purple-300">Low HOME Units</p>
                    <Badge color="purple">≥ 20% of assisted units</Badge>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed mb-3">
                    At least <strong className="text-white">20%</strong> of HOME-assisted units
                    must be reserved for households at or below{" "}
                    <strong className="text-white">50% Area Median Income (AMI)</strong>.
                  </p>
                  <div className="bg-slate-900/60 rounded-lg px-3 py-2">
                    <p className="text-xs text-slate-500 mb-1">Rent Limit</p>
                    <p className="text-xs text-slate-300">
                      Lesser of (a) HUD Fair Market Rent or (b) 30% × 50% AMI for unit size
                    </p>
                  </div>
                </div>
                <div className="bg-teal-900/20 border border-teal-700/40 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-teal-300">High HOME Units</p>
                    <Badge color="teal">Remaining assisted units</Badge>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed mb-3">
                    Remaining HOME-assisted units may serve households up to{" "}
                    <strong className="text-white">80% AMI</strong>.
                  </p>
                  <div className="bg-slate-900/60 rounded-lg px-3 py-2">
                    <p className="text-xs text-slate-500 mb-1">Rent Limit</p>
                    <p className="text-xs text-slate-300">
                      Lesser of (a) HUD Fair Market Rent or (b) 30% × 65% AMI for unit size
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-4 text-sm">
                <p className="text-amber-300 font-semibold mb-1">Utility Allowances</p>
                <p className="text-amber-200/80 text-xs leading-relaxed">
                  Utility allowances must be subtracted from gross rent to determine the
                  tenant&rsquo;s payment. The PHA Utility Allowance Schedule or an HUD-approved
                  alternative method must be used. Gross rent (tenant payment + utility
                  allowance) may not exceed the applicable HOME rent limit.
                </p>
              </div>
            </SectionCard>

            <SectionCard>
              <SectionTitle>
                Homebuyer Eligibility
                <Badge color="emerald">Ownership</Badge>
              </SectionTitle>
              <div className="space-y-4 text-sm text-slate-300">
                {[
                  {
                    label: "Income Limit",
                    value:
                      "Household income must be at or below 80% AMI at the time of purchase. Income is calculated using the HUD Part 5 (Section 8) definition.",
                  },
                  {
                    label: "Purchase Price Limits",
                    value:
                      "The purchase price may not exceed HUD-established limits for the area (95% of median purchase price of existing or new homes). PJs set these limits annually.",
                  },
                  {
                    label: "First-Time Homebuyer",
                    value:
                      "Buyer must generally be a first-time homebuyer (no ownership interest in a principal residence in the past 3 years), unless funds are used for rehabilitation only.",
                  },
                  {
                    label: "Principal Residence",
                    value:
                      "The HOME-assisted unit must be the buyer's principal place of residence throughout the affordability period.",
                  },
                ].map((item) => (
                  <div key={item.label} className="flex gap-4">
                    <p className="shrink-0 w-36 text-xs text-slate-500 pt-0.5 font-semibold uppercase tracking-wider">
                      {item.label}
                    </p>
                    <p className="leading-relaxed">{item.value}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-4">
                <Citation>24 CFR §92.254</Citation>
              </p>
            </SectionCard>

            <SectionCard>
              <SectionTitle>Annual Monitoring</SectionTitle>
              <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                PJs must monitor rental projects annually throughout the affordability period.
                Owners must certify and re-verify tenant incomes each year.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-sm">
                {[
                  { label: "Initial Certification", color: "text-teal-400" },
                  { label: "Annual Recertification", color: "text-teal-400" },
                  { label: "On-site Inspection", color: "text-amber-400" },
                  { label: "Rent Limit Review", color: "text-slate-300" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-slate-900/50 border border-slate-800 rounded-xl p-3"
                  >
                    <p className={`font-semibold ${item.color} text-xs`}>{item.label}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {/* ── Section: Property Standards ─────────────────────────────────── */}
        {activeSection === "property" && (
          <div className="space-y-6">
            <SectionCard>
              <SectionTitle>
                Property Standards Overview
                <Badge color="emerald">24 CFR §92.251</Badge>
              </SectionTitle>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                All HOME-assisted properties must meet HUD property standards at the time of
                project completion and throughout the affordability period. Standards vary by
                activity type.
              </p>

              <div className="space-y-5">
                {/* New construction */}
                <div className="bg-slate-900/50 border border-teal-700/30 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🏗️</span>
                    <p className="font-bold text-white">New Construction</p>
                    <Badge color="teal">24 CFR §92.251(b)(1)</Badge>
                  </div>
                  <div className="space-y-3 text-sm">
                    {[
                      {
                        title: "Green Building Standard (Required)",
                        body: "All new construction must meet a HUD-recognized green building standard. Acceptable standards include: ENERGY STAR Certified Homes/Multifamily, EPA's Indoor airPLUS, Enterprise Green Communities Criteria, EarthCraft, and LEED. The PJ selects which standard(s) apply.",
                      },
                      {
                        title: "International Building Code / Local Codes",
                        body: "Must meet applicable local building codes and ordinances. Where local codes are more stringent than HUD standards, local codes govern.",
                      },
                      {
                        title: "Model Energy Code",
                        body: "Must meet the energy efficiency standards of the applicable edition of the International Energy Conservation Code (IECC).",
                      },
                    ].map((s) => (
                      <div key={s.title}>
                        <p className="font-semibold text-slate-200 mb-1">
                          {s.title}
                        </p>
                        <p className="text-slate-400 leading-relaxed">{s.body}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rehabilitation */}
                <div className="bg-slate-900/50 border border-amber-700/30 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🔧</span>
                    <p className="font-bold text-white">Rehabilitation</p>
                    <Badge color="amber">24 CFR §92.251(b)(2)</Badge>
                  </div>
                  <div className="space-y-3 text-sm">
                    {[
                      {
                        title: "Rehabilitation Standards",
                        body: "PJs must establish written standards for rehabilitation. At minimum, work must bring the property into compliance with applicable local housing quality standards or HUD's Housing Quality Standards (HQS).",
                      },
                      {
                        title: "Common Areas & Systems",
                        body: "Rehabilitation must address all life-threatening deficiencies identified in the inspection. Systems serving HOME-assisted units must be repaired or replaced as necessary.",
                      },
                      {
                        title: "Accessibility",
                        body: "Alterations to existing housing must comply with Section 504 of the Rehabilitation Act. Projects with 15+ units must have accessible common areas; projects with 5+ units must have accessible units.",
                      },
                    ].map((s) => (
                      <div key={s.title}>
                        <p className="font-semibold text-slate-200 mb-1">{s.title}</p>
                        <p className="text-slate-400 leading-relaxed">{s.body}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lead-based paint */}
                <div className="bg-slate-900/50 border border-red-700/30 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">⚠️</span>
                    <p className="font-bold text-white">Lead-Based Paint</p>
                    <Badge color="red">24 CFR Part 35</Badge>
                  </div>
                  <div className="space-y-3 text-sm">
                    <p className="text-slate-400 leading-relaxed">
                      Lead-based paint requirements apply to all HOME-assisted housing built
                      before 1978. Requirements scale with the level of intervention:
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left py-2 pr-3 text-slate-500 uppercase font-semibold">
                              Intervention Level
                            </th>
                            <th className="text-left py-2 text-slate-500 uppercase font-semibold">
                              Required Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {[
                            [
                              "Acquisition / Leasing",
                              "Disclosure + Visual Assessment",
                            ],
                            [
                              "Rehab < $5,000/unit",
                              "Disclosure + Paint Testing + Safe Work Practices",
                            ],
                            [
                              "Rehab $5,000–$25,000/unit",
                              "Above + Interim Controls on all identified LBP hazards",
                            ],
                            [
                              "Rehab > $25,000/unit",
                              "Above + Abatement of all identified LBP hazards",
                            ],
                          ].map(([level, action]) => (
                            <tr key={level}>
                              <td className="py-2 pr-3 text-slate-300">{level}</td>
                              <td className="py-2 text-slate-400">{action}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-slate-500">
                      Abatement and interim control work must be performed by certified
                      renovators or abatement contractors. Clearance testing required after
                      abatement. <Citation>24 CFR §35.930</Citation>
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ── Section: Compliance Checker ─────────────────────────────────── */}
        {activeSection === "checker" && (
          <div className="space-y-6">
            <SectionCard>
              <SectionTitle>
                Interactive Compliance Checker
                <Badge color="teal">Instant Analysis</Badge>
              </SectionTitle>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Enter your project details to calculate the affordability period, determine
                whether Davis-Bacon applies, and identify key compliance requirements.
                This tool is for preliminary reference only — consult your Participating
                Jurisdiction and legal counsel for binding determinations.
              </p>

              {/* Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">
                    Project Type
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(
                      [
                        ["rental_new", "Rental — New Construction"],
                        ["rental_rehab", "Rental — Rehabilitation"],
                        ["homebuyer_new", "Homebuyer — New Construction"],
                        ["homebuyer_rehab", "Homebuyer — Acquisition/Rehab"],
                      ] as [ProjectUse, string][]
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        onClick={() =>
                          setInputs((prev) => ({ ...prev, projectUse: value }))
                        }
                        className={`px-3 py-2.5 rounded-xl text-xs font-semibold text-center transition-all ${
                          inputs.projectUse === value
                            ? "bg-teal-600 text-white"
                            : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:border-slate-700"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">
                    Total Project Units
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={inputs.totalUnits}
                    onChange={(e) =>
                      setInputs((prev) => ({ ...prev, totalUnits: e.target.value }))
                    }
                    placeholder="e.g. 48"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">
                    HOME-Assisted Units
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={inputs.homeAssistedUnits}
                    onChange={(e) =>
                      setInputs((prev) => ({
                        ...prev,
                        homeAssistedUnits: e.target.value,
                      }))
                    }
                    placeholder="e.g. 20"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">
                    HOME Investment Per Unit ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={inputs.homeAmountPerUnit}
                    onChange={(e) =>
                      setInputs((prev) => ({
                        ...prev,
                        homeAmountPerUnit: e.target.value,
                      }))
                    }
                    placeholder="e.g. 65000"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                  />
                  <p className="text-xs text-slate-600 mt-1">
                    Total HOME investment divided by number of HOME-assisted units
                  </p>
                </div>
              </div>

              {/* Results */}
              {result ? (
                <div className="space-y-4">
                  <div className="border-t border-slate-800 pt-6">
                    <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-4">
                      Analysis Results
                    </p>
                  </div>

                  {/* Warnings */}
                  {result.warnings.length > 0 && (
                    <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-4 space-y-2">
                      {result.warnings.map((w, i) => (
                        <p key={i} className="text-sm text-amber-300 flex items-start gap-2">
                          <span className="shrink-0 mt-0.5">⚠️</span>
                          {w}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Key metrics row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      className={`rounded-2xl p-5 border ${
                        result.affordabilityPeriod === 20
                          ? "bg-purple-900/20 border-purple-700/40"
                          : result.affordabilityPeriod >= 15
                          ? "bg-red-900/20 border-red-700/40"
                          : result.affordabilityPeriod >= 10
                          ? "bg-amber-900/20 border-amber-700/40"
                          : "bg-teal-900/20 border-teal-700/40"
                      }`}
                    >
                      <p className="text-xs text-slate-400 uppercase font-semibold mb-1">
                        Affordability Period
                      </p>
                      <p
                        className={`text-4xl font-bold mb-2 ${
                          result.affordabilityPeriod === 20
                            ? "text-purple-300"
                            : result.affordabilityPeriod >= 15
                            ? "text-red-300"
                            : result.affordabilityPeriod >= 10
                            ? "text-amber-300"
                            : "text-teal-300"
                        }`}
                      >
                        {result.affordabilityPeriod}{" "}
                        <span className="text-lg font-normal">years</span>
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {result.affordabilityBasis}
                      </p>
                    </div>

                    <div
                      className={`rounded-2xl p-5 border ${
                        result.davisBaconApplies
                          ? "bg-amber-900/20 border-amber-700/40"
                          : "bg-emerald-900/20 border-emerald-700/40"
                      }`}
                    >
                      <p className="text-xs text-slate-400 uppercase font-semibold mb-1">
                        Davis-Bacon
                      </p>
                      <p
                        className={`text-2xl font-bold mb-2 ${
                          result.davisBaconApplies
                            ? "text-amber-300"
                            : "text-emerald-300"
                        }`}
                      >
                        {result.davisBaconApplies ? "Applies" : "Does Not Apply"}
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {result.davisBaconBasis}
                      </p>
                    </div>
                  </div>

                  {/* Income targeting */}
                  {result.incomeTargeting.length > 0 && (
                    <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-5">
                      <p className="text-xs text-slate-400 uppercase font-semibold mb-3">
                        Income Targeting
                      </p>
                      <ul className="space-y-2">
                        {result.incomeTargeting.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                            <span className="shrink-0 text-teal-400 mt-0.5">›</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Rent limits */}
                  {result.rentLimits.length > 0 && (
                    <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-5">
                      <p className="text-xs text-slate-400 uppercase font-semibold mb-3">
                        Rent Limits
                      </p>
                      <ul className="space-y-2">
                        {result.rentLimits.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                            <span className="shrink-0 text-purple-400 mt-0.5">›</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Property standards */}
                  <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-5">
                    <p className="text-xs text-slate-400 uppercase font-semibold mb-3">
                      Property Standards
                    </p>
                    <ul className="space-y-2">
                      {result.propertyStandards.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="shrink-0 text-emerald-400 mt-0.5">›</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-xs text-slate-600 text-center pt-2">
                    Preliminary reference only · Consult your PJ and legal counsel ·{" "}
                    <Citation>24 CFR Part 92 (2025 Final Rule)</Citation>
                  </p>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-600 text-sm border-t border-slate-800">
                  Enter project details above to generate your compliance analysis
                </div>
              )}
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
}
