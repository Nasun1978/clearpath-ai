// ============================================================================
// LIHTC Checklist — Section & Item Definitions (LHC 2025 QAP)
// ============================================================================

export interface ItemDef {
  id: string;
  text: string;
  guidance?: string; // pre-populated hint shown under notes
}

export interface SectionDef {
  number: number;
  title: string;
  description: string;
  items: ItemDef[];
}

export const CHECKLIST_SECTIONS: SectionDef[] = [
  {
    number: 1,
    title: "Application Submission Requirements",
    description: "Fees, certifications, and disclosure requirements due at application",
    items: [
      {
        id: "s1_1",
        text: "Application fee submitted ($500 non-refundable for 9% credits; $1,000 for 4% bond applications)",
        guidance: "Payable to Louisiana Housing Corporation. Check/wire details in LHC application portal.",
      },
      {
        id: "s1_2",
        text: "Signed Applicant Certification Form (all principals) submitted",
      },
      {
        id: "s1_3",
        text: "Cost Containment Certification signed by developer and general contractor",
        guidance: "GC signature required even if GC not yet selected — use estimated TDC at time of application.",
      },
      {
        id: "s1_4",
        text: "Lien priority documentation — first mortgage lender subordination agreements included",
      },
      {
        id: "s1_5",
        text: "Development Team Disclosure Form completed (all entities and principals > 10% ownership interest)",
      },
      {
        id: "s1_6",
        text: "Previous Participation Certification submitted for all principals",
        guidance: "Covers all LIHTC, HOME, HTF, and CDBG projects within the past 10 years.",
      },
      {
        id: "s1_7",
        text: "Disclosure of interest / identity-of-interest certification submitted",
      },
    ],
  },
  {
    number: 2,
    title: "Community Notification",
    description: "Public notice, elected official notification, and public hearing requirements",
    items: [
      {
        id: "s2_1",
        text: "Public notice published in newspaper of general circulation serving the project area (minimum 30 days prior to application deadline)",
      },
      {
        id: "s2_2",
        text: "Proof of publication / affidavit from newspaper submitted",
      },
      {
        id: "s2_3",
        text: "Certified mail notice sent to chief elected official of the governing jurisdiction (mayor or parish president)",
        guidance: "Include signed USPS green card (return receipt) as proof of delivery.",
      },
      {
        id: "s2_4",
        text: "Certified mail notice sent to State Representative(s) for the project district",
      },
      {
        id: "s2_5",
        text: "Certified mail notice sent to State Senator(s) for the project district",
      },
      {
        id: "s2_6",
        text: "Public hearing held OR written waiver obtained from local elected official",
      },
      {
        id: "s2_7",
        text: "Copy of public hearing minutes or sign-in sheet submitted (if hearing held)",
      },
      {
        id: "s2_8",
        text: "Response letters from elected officials included (if any received)",
      },
    ],
  },
  {
    number: 3,
    title: "Project Threshold Requirements",
    description: "Site, environmental, zoning, resiliency, and design threshold items",
    items: [
      {
        id: "s3_1",
        text: "Resiliency features documentation (storm shutters/impact windows, elevated HVAC ≥12\" above BFE, impact-resistant roofing, emergency backup power for common areas)",
        guidance: "At least 2 resiliency features required per LHC 2025 QAP §7.1.1.",
      },
      {
        id: "s3_2",
        text: "FEMA flood zone determination — project is not in a 100-year (Zone A/AE) floodplain, OR Letter of Map Amendment (LOMA/LOMR) provided",
      },
      {
        id: "s3_3",
        text: "Flood insurance commitment letter (if project is in a flood zone)",
      },
      {
        id: "s3_4",
        text: "30% AMI set-aside — minimum 10% of total units at or below 30% AMI; OR Project-Based Voucher (PBV) / PBRA commitment letter provided",
        guidance: "PBV/PBRA commitment from a PHA substitutes for the 30% AMI set-aside requirement.",
      },
      {
        id: "s3_5",
        text: "Site control documentation (executed purchase agreement, option agreement, ground lease, or recorded deed)",
        guidance: "Must be in the applicant entity's name or include assignment provisions to the to-be-formed LP.",
      },
      {
        id: "s3_6",
        text: "Zoning confirmation letter from local planning/zoning authority confirming the proposed use is permitted as-of-right or by special use permit",
      },
      {
        id: "s3_7",
        text: "Infrastructure capacity confirmation — letter from water/sewer utility confirming adequate capacity to serve the project",
      },
      {
        id: "s3_8",
        text: "Phase I Environmental Site Assessment (ESA) dated within 12 months of application deadline",
        guidance: "Must be conducted by a qualified environmental professional (QEP) per ASTM E1527-21.",
      },
      {
        id: "s3_9",
        text: "Phase II ESA completed (required if Phase I identified Recognized Environmental Conditions)",
      },
      {
        id: "s3_10",
        text: "Design features compliance certification (minimum unit sizes per LHC standards; accessibility per Fair Housing Act and ADA; visitability for ground-floor units)",
      },
      {
        id: "s3_11",
        text: "Energy efficiency commitment (Energy Star Multifamily, EarthCraft, LEED, or equivalent green building certification committed)",
      },
      {
        id: "s3_12",
        text: "Confirmation that project is not on LHC's restricted/debarred projects list and has no unresolved prior-year compliance issues",
      },
    ],
  },
  {
    number: 4,
    title: "Acquisition / Rehab Threshold",
    description: "Additional threshold requirements specific to acquisition and rehabilitation projects",
    items: [
      {
        id: "s4_1",
        text: "Audited financial statements for the existing property (most recent 2 fiscal years)",
        guidance: "Must be prepared by a CPA. Compilation or review is not acceptable for this threshold item.",
      },
      {
        id: "s4_2",
        text: "Complete chain of title / title commitment issued by a licensed title company",
      },
      {
        id: "s4_3",
        text: "Capital Needs Assessment (CNA) prepared by a qualified independent inspector — identifies all repairs needed within 20 years",
        guidance: "CNA must include a unit-by-unit inspection and conform to Fannie Mae / LHC format.",
      },
      {
        id: "s4_4",
        text: "Property appraisal (as-is value) by MAI-certified appraiser dated within 6 months of application",
      },
      {
        id: "s4_5",
        text: "Documentation that existing property is at least 15 years old (original certificate of occupancy or equivalent)",
      },
      {
        id: "s4_6",
        text: "Historic rehabilitation certification / Part 1 determination (if claiming federal or state historic tax credits)",
      },
      {
        id: "s4_7",
        text: "Tenant Relocation Plan and relocation budget (required if any occupied units will be temporarily or permanently displaced)",
        guidance: "Must comply with Uniform Relocation Act (URA) if federal financing involved.",
      },
      {
        id: "s4_8",
        text: "Lead-based paint and asbestos survey results (required for properties built before 1978 and 1981 respectively)",
      },
    ],
  },
  {
    number: 5,
    title: "Project Team / Developer Requirements",
    description: "Experience, standing, and qualification requirements for the development team",
    items: [
      {
        id: "s5_1",
        text: "Developer/principal experience documentation — at least 3 completed comparable LIHTC projects (certificates of occupancy, 8609s, or LHC completion letters)",
        guidance: "Comparable = similar size (± 50%), similar type (new construction vs. rehab), and completed within the last 10 years.",
      },
      {
        id: "s5_2",
        text: "Property management company qualifications — documentation of active LIHTC portfolio under management (minimum 150 units)",
      },
      {
        id: "s5_3",
        text: "Good Standing Certificates from Louisiana Secretary of State for all development entities (dated within 90 days of application)",
      },
      {
        id: "s5_4",
        text: "Organizational documents — articles of incorporation/formation, operating agreement, partnership agreement",
      },
      {
        id: "s5_5",
        text: "Certification of no outstanding LHC compliance findings or unresolved monitoring issues for any entity or principal",
      },
      {
        id: "s5_6",
        text: "Architect license verification (current state license) and prior LIHTC/affordable housing project experience",
      },
      {
        id: "s5_7",
        text: "General contractor license (current Louisiana contractor's license) and bonding capacity documentation (performance and payment bond commitment)",
      },
      {
        id: "s5_8",
        text: "Key personnel resumes — project manager, compliance officer / asset manager",
      },
      {
        id: "s5_9",
        text: "Property management agreement (or commitment letter) with qualified management company",
      },
    ],
  },
  {
    number: 6,
    title: "Underwriting Requirements",
    description: "Financial feasibility, cost, pro forma, and debt coverage requirements",
    items: [
      {
        id: "s6_1",
        text: "Third-party construction cost estimate (by independent estimator) OR executed GC contract / letter of intent with itemized budget",
      },
      {
        id: "s6_2",
        text: "Balanced permanent Sources & Uses statement (total sources = total uses; funding gap = $0)",
      },
      {
        id: "s6_3",
        text: "20-year operating cash flow pro forma with annual income and expense projections",
        guidance: "LHC standard: income growth ≤ 2%/yr; expense growth ≤ 3%/yr; vacancy ≥ 7% for LIHTC units.",
      },
      {
        id: "s6_4",
        text: "Debt Service Coverage Ratio (DSCR) ≥ 1.15x for first mortgage; ≥ 1.00x for all debt combined in Year 1",
      },
      {
        id: "s6_5",
        text: "Operating expense reserve — minimum 3 months of stabilized operating expenses funded at closing",
      },
      {
        id: "s6_6",
        text: "Replacement reserves — minimum $300/unit/year (new construction); $350/unit/year (rehabilitation)",
      },
      {
        id: "s6_7",
        text: "Developer fee within LHC limits: ≤ $1,800,000 for 9% credits; ≤ $2,500,000 for 4% bonds (2025 QAP caps)",
        guidance: "Deferred developer fee must be repayable within 15 years from cash flow or residual receipts.",
      },
      {
        id: "s6_8",
        text: "Operating deficit reserve funding commitment (typically 6–12 months of projected operating shortfall during lease-up)",
      },
      {
        id: "s6_9",
        text: "Firm debt commitment letters from all permanent lenders (rate, term, amortization, conditions)",
      },
      {
        id: "s6_10",
        text: "Equity commitment letter from LIHTC syndicator/investor (pricing, pay-in schedule, investor requirements)",
      },
      {
        id: "s6_11",
        text: "Market study by LHC-approved independent market analyst (dated within 6 months of application)",
        guidance: "Must include capture rate analysis, comparable properties, absorption projection, and AMI band analysis.",
      },
      {
        id: "s6_12",
        text: "Utility allowance documentation — current utility company letter, HUD Utility Schedule, or energy consumption model",
      },
    ],
  },
  {
    number: 7,
    title: "Tax-Exempt Bond Specific Requirements",
    description: "TEFRA, bond counsel, volume cap, and 50% test requirements for 4% bond projects",
    items: [
      {
        id: "s7_1",
        text: "TEFRA public hearing — notice published in local newspaper at least 14 days before the hearing",
        guidance: "Required under IRC §147(f). Issuer (bond authority) typically conducts the hearing.",
      },
      {
        id: "s7_2",
        text: "TEFRA hearing conducted and approved; hearing minutes and approval resolution submitted",
      },
      {
        id: "s7_3",
        text: "Issuer (bond authority / LHC) inducement / approval resolution submitted",
      },
      {
        id: "s7_4",
        text: "Bond counsel legal opinion letter confirming tax-exempt status and compliance with IRC §142",
      },
      {
        id: "s7_5",
        text: "50% test documentation — at least 50% of aggregate basis of the project financed by tax-exempt bonds (IRC §42(h)(4))",
        guidance: "Calculated as: land + depreciable basis financed by bonds ÷ total land + depreciable basis. Must exceed 50%.",
      },
      {
        id: "s7_6",
        text: "Private activity bond (PAB) volume cap reservation confirmed from Louisiana bond commission",
      },
      {
        id: "s7_7",
        text: "Construction period bond issuance documents (if bonds issued during construction phase)",
      },
      {
        id: "s7_8",
        text: "Permanent bond conversion / take-out plan documented (Freddie TEL, Fannie MTEB, or permanent bond structure)",
      },
    ],
  },
  {
    number: 8,
    title: "Post-Award Requirements",
    description: "Carryover, tenant policies, regulatory agreements, and compliance training",
    items: [
      {
        id: "s8_1",
        text: "Carryover Allocation Agreement executed and submitted to LHC by December 31 of the credit award year",
        guidance: "Required under IRC §42(h)(1)(E). Failure to execute carryover forfeits the credit allocation.",
      },
      {
        id: "s8_2",
        text: "10% Test Certification — evidence that at least 10% of reasonably expected basis has been incurred within 12 months of carryover date",
      },
      {
        id: "s8_3",
        text: "Tenant Selection Plan (TSP) submitted to LHC for review and approval prior to marketing",
        guidance: "Must include waitlist procedures, VAWA policies, preferences, and non-discrimination language.",
      },
      {
        id: "s8_4",
        text: "Eviction Prevention Policy adopted and submitted to LHC",
      },
      {
        id: "s8_5",
        text: "Affirmative Fair Housing Marketing Plan (AFHMP) submitted to LHC",
      },
      {
        id: "s8_6",
        text: "Land Use Restriction Agreement (LURA) / Regulatory Agreement reviewed, executed, and submitted for recording",
      },
      {
        id: "s8_7",
        text: "Extended Use Agreement recorded with parish clerk of court; recorded copy provided to LHC",
      },
      {
        id: "s8_8",
        text: "Final LP/partnership agreement and ownership structure documents submitted to LHC",
      },
      {
        id: "s8_9",
        text: "LIHTC compliance monitoring training completed by owner and on-site management agent (LHC-approved training)",
      },
      {
        id: "s8_10",
        text: "Construction commencement evidence submitted to LHC within required deadline after award",
      },
    ],
  },
  {
    number: 9,
    title: "Placed in Service Requirements",
    description: "Cost certification, financing, subsidy layering, and 8609 issuance",
    items: [
      {
        id: "s9_1",
        text: "Cost certification audit prepared by an independent CPA and submitted to LHC",
        guidance: "Must be submitted within 6 months of the last building being placed in service.",
      },
      {
        id: "s9_2",
        text: "Financing certification from all permanent lenders confirming permanent financing is in place and construction loan has been converted",
      },
      {
        id: "s9_3",
        text: "Subsidy Layering Review (SLR) completed by HUD or LHC (required if project receives federal rental assistance — HAP, PBV, or RAD)",
      },
      {
        id: "s9_4",
        text: "Form 8609 application package submitted to LHC (IRS Form 8609 request with cost certification and required exhibits)",
      },
      {
        id: "s9_5",
        text: "Certificate(s) of Occupancy for all buildings submitted to LHC",
      },
      {
        id: "s9_6",
        text: "As-built survey submitted",
      },
      {
        id: "s9_7",
        text: "Final sources and uses reconciliation (actual vs. projected) submitted",
      },
      {
        id: "s9_8",
        text: "Final equity pay-in documentation and investor closing statement submitted",
      },
    ],
  },
  {
    number: 10,
    title: "Construction Monitoring",
    description: "Plans, permits, draw requests, inspections, and lien waivers",
    items: [
      {
        id: "s10_1",
        text: "Approved construction plans and specifications on file with LHC and lender's construction inspector",
      },
      {
        id: "s10_2",
        text: "All required building permits obtained; copies submitted to LHC",
      },
      {
        id: "s10_3",
        text: "Monthly pay application review and approval process established with lender and LHC",
      },
      {
        id: "s10_4",
        text: "Change order approval protocol in place — all material changes (>$25,000 or scope changes) submitted to LHC for approval",
      },
      {
        id: "s10_5",
        text: "Construction inspection reports from third-party inspector (lender's inspector or LHC inspector) current",
      },
      {
        id: "s10_6",
        text: "Conditional and unconditional lien waivers obtained for each draw request (all contractors and major subcontractors)",
      },
      {
        id: "s10_7",
        text: "Construction completion certificate from architect of record submitted",
      },
      {
        id: "s10_8",
        text: "LHC final construction inspection completed and any punch list items resolved",
      },
      {
        id: "s10_9",
        text: "Davis-Bacon certified payroll records maintained and submitted (required if ≥ 12 HOME-assisted units — 29 CFR Part 5)",
        guidance: "Not required for LIHTC-only projects unless HOME or other federal funds are layered.",
      },
      {
        id: "s10_10",
        text: "Construction progress photos submitted with each monthly draw request",
      },
    ],
  },
  {
    number: 11,
    title: "Ongoing Compliance",
    description: "Annual fees, VAWA, fair housing, owner certifications, and physical inspections",
    items: [
      {
        id: "s11_1",
        text: "Annual compliance monitoring fee paid to LHC (due each January 1 for the prior year)",
      },
      {
        id: "s11_2",
        text: "VAWA (Violence Against Women Act) lease addendum and Notice of Occupancy Rights provided to all tenants",
        guidance: "Required under 24 CFR Part 5, Subpart L. Updated notice forms must be used.",
      },
      {
        id: "s11_3",
        text: "Fair Housing and Equal Opportunity (FHEO) policy posted in all common areas; staff training completed annually",
      },
      {
        id: "s11_4",
        text: "Annual Owner Certification (AOC) submitted to LHC by March 1 covering the prior calendar year",
      },
      {
        id: "s11_5",
        text: "Annual Tenant Income Certifications (TICs) completed for all households at each anniversary of move-in",
      },
      {
        id: "s11_6",
        text: "Rent and utility allowance compliance verified annually — rents do not exceed IRC §42(g) limits for each household's AMI",
      },
      {
        id: "s11_7",
        text: "Annual physical inspection (UPCS or LHC equivalent) passed; corrective action plan submitted for any findings",
      },
      {
        id: "s11_8",
        text: "IRS Form 8823 correction plan submitted and all non-compliance issues resolved within LHC-specified cure period",
      },
      {
        id: "s11_9",
        text: "Resident services program operational and documented (if included in QAP scoring application)",
      },
      {
        id: "s11_10",
        text: "Annual audited financial statements submitted to LHC within 120 days of fiscal year end",
      },
    ],
  },
  {
    number: 12,
    title: "Non-Profit / CHDO Set-Aside",
    description: "501(c)(3) and CHDO qualification requirements for non-profit applicants",
    items: [
      {
        id: "s12_1",
        text: "IRS 501(c)(3) determination letter (current — not pending) submitted",
        guidance: "Pending letters are not acceptable. Organization must have received final IRS determination.",
      },
      {
        id: "s12_2",
        text: "Articles of incorporation demonstrating that affordable housing is a primary organizational purpose",
      },
      {
        id: "s12_3",
        text: "CHDO Approval Letter from LHC (required only if applying under the CHDO set-aside for HOME funds)",
      },
      {
        id: "s12_4",
        text: "Board resolution authorizing the development and designating authorized signatories",
      },
      {
        id: "s12_5",
        text: "Non-profit experience documentation — prior affordable housing development projects (at least 1 completed project)",
      },
      {
        id: "s12_6",
        text: "Organization chart showing non-profit's role in the development entity, ownership structure, and management oversight",
      },
      {
        id: "s12_7",
        text: "Non-profit material participation documentation — Development Services Agreement or GP documents demonstrating active role in development",
        guidance: "Material participation required under IRC §469(h) — non-profit must be involved on a regular, continuous, and substantial basis.",
      },
      {
        id: "s12_8",
        text: "Conflict of Interest Policy adopted by the non-profit board and submitted to LHC",
      },
    ],
  },
];

// Build the flat default items array for a new checklist
export interface ChecklistItemState {
  id: string;
  section: number;
  text: string;
  checked: boolean;
  notes: string;
  uploaded_file_url: string | null;
  uploaded_file_name: string | null;
  due_date: string | null;
}

// ── LHC 2025 QAP Suggested Deadlines ─────────────────────────────────────────
// Keyed by item ID. Dates sourced from the LHC 2025 QAP timeline:
//   Application deadline:  March 28, 2025
//   Carryover allocation:  December 31, 2025
//   10% cost test:         December 31, 2026
//   Annual monitoring fee: January 1 (recurring)
//   Annual Owner Cert:     March 1 (recurring)
export const LHC_SUGGESTED_DEADLINES: Record<string, string> = {
  // Section 1 — Application Submission (all items due at application deadline)
  s1_1: "2025-03-28",
  s1_2: "2025-03-28",
  s1_3: "2025-03-28",
  s1_4: "2025-03-28",
  s1_5: "2025-03-28",
  s1_6: "2025-03-28",
  s1_7: "2025-03-28",

  // Section 2 — Community Notification (must precede application deadline)
  s2_1: "2025-02-26", // public notice: ≥30 days before March 28 deadline
  s2_2: "2025-03-28", // proof of publication due with application
  s2_3: "2025-03-14", // certified mail: allow 14 days for USPS delivery
  s2_4: "2025-03-14",
  s2_5: "2025-03-14",
  s2_6: "2025-03-21", // hearing: complete 1 week before application deadline
  s2_7: "2025-03-28",

  // Section 3 — Threshold items with currency requirements
  s3_5: "2025-03-28", // site control: must be in place at application
  s3_8: "2025-03-28", // Phase I ESA: must be dated within 12 months of deadline

  // Section 4 — Acquisition/Rehab thresholds with date requirements
  s4_4: "2025-03-28", // appraisal: within 6 months of application deadline

  // Section 5 — Team documents with 90-day currency window
  s5_3: "2025-01-17", // good standing cert: must be dated within 90 days of March 28

  // Section 6 — Financial commitments required at application
  s6_9:  "2025-03-28", // firm debt commitment letters
  s6_10: "2025-03-28", // equity commitment letter
  s6_11: "2025-03-28", // market study: within 6 months of application deadline

  // Section 7 — Bond requirements (4% projects)
  s7_1: "2025-02-28", // TEFRA notice: ≥14 days before the hearing date
  s7_6: "2025-03-28", // PAB volume cap reservation

  // Section 8 — Post-award milestones
  s8_1:  "2025-12-31", // carryover allocation: IRC §42(h)(1)(E) hard deadline
  s8_2:  "2026-12-31", // 10% cost incurred test: 12 months after carryover
  s8_3:  "2026-06-30", // tenant selection plan: before marketing / lease-up
  s8_10: "2025-12-31", // construction commencement: per LHC award letter

  // Section 9 — Placed-in-service (estimated timeline)
  s9_1: "2028-06-30", // cost certification: within 6 months of final PIS

  // Section 11 — Ongoing annual compliance deadlines
  s11_1: "2026-01-01", // annual monitoring fee: due January 1 each year
  s11_4: "2026-03-01", // annual owner certification: due March 1 each year
  s11_10: "2026-04-30", // audited financials: 120 days after December 31 year-end
};

export function buildDefaultItems(): ChecklistItemState[] {
  return CHECKLIST_SECTIONS.flatMap((section) =>
    section.items.map((item) => ({
      id: item.id,
      section: section.number,
      text: item.text,
      checked: false,
      notes: "",
      uploaded_file_url: null,
      uploaded_file_name: null,
      due_date: LHC_SUGGESTED_DEADLINES[item.id] ?? null,
    }))
  );
}

export function getItemGuidance(id: string): string | undefined {
  for (const section of CHECKLIST_SECTIONS) {
    const item = section.items.find((i) => i.id === id);
    if (item) return item.guidance;
  }
  return undefined;
}
