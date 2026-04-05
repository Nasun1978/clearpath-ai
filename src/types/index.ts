// ============================================================================
// RipeSpot — TypeScript Type Definitions
// ============================================================================
// These types mirror the Supabase database schema exactly.
// If you change the database, update these types to match.
// ============================================================================

// --- Enums (match PostgreSQL ENUM types) ---

export type ProposalStatus =
  | "draft"
  | "received"
  | "processing"
  | "in_review"
  | "deficiency"
  | "approved"
  | "approved_with_conditions"
  | "denied"
  | "withdrawn";

export type CreditType =
  | "lihtc_4pct"
  | "lihtc_9pct"
  | "home"
  | "htf"
  | "cdbg"
  | "rad"
  | "mixed"
  | "other";

export type SetAsideElection = "20_50" | "40_60" | "income_average" | "not_applicable";

export type ComplianceResult = "pass" | "fail" | "needs_review" | "not_applicable";

export type SeverityLevel = "critical" | "warning" | "informational";

export type ComplianceCategory =
  | "section_42"
  | "home"
  | "htf"
  | "cdbg"
  | "rad"
  | "qap"
  | "financial"
  | "environmental"
  | "fair_housing"
  | "local_zoning"
  | "general";

export type UserRole = "admin" | "reviewer" | "developer" | "read_only";

export type DocumentType =
  | "application"
  | "pro_forma"
  | "market_study"
  | "environmental_report"
  | "site_plan"
  | "architectural_drawings"
  | "legal_entity_docs"
  | "support_letters"
  | "appraisal"
  | "phase_i_esa"
  | "title_report"
  | "other";

export type DeficiencyStatus = "open" | "submitted" | "under_review" | "resolved" | "waived";

// --- Database Table Types ---

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  organization: string | null;
  title: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Agency {
  id: string;
  name: string;
  abbreviation: string | null;
  agency_type: string;
  state: string | null;
  city: string | null;
  address: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  qap_state: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Proposal {
  id: string;
  proposal_number: string;
  project_name: string;
  project_address: string | null;
  city: string | null;
  county: string | null;
  state: string;
  zip_code: string | null;

  // Developer Info
  developer_entity: string;
  developer_contact_name: string | null;
  developer_contact_email: string | null;
  developer_contact_phone: string | null;

  // Program & Structure
  credit_type: CreditType;
  set_aside_election: SetAsideElection;
  is_new_construction: boolean;
  is_rehab: boolean;
  is_acquisition: boolean;

  // Units
  total_units: number | null;
  affordable_units: number | null;
  market_rate_units: number;
  ami_30_pct_units: number;
  ami_50_pct_units: number;
  ami_60_pct_units: number;
  ami_80_pct_units: number;
  ami_120_pct_units: number;

  // Financials
  total_development_cost: number | null;
  eligible_basis: number | null;
  qualified_basis: number | null;
  annual_credit_amount: number | null;
  credit_price: number | null;
  tax_credit_equity: number | null;
  bond_amount: number | null;
  permanent_loan_amount: number | null;
  permanent_loan_rate: number | null;
  permanent_loan_term: number | null;
  dscr: number | null;
  developer_fee: number | null;
  developer_fee_pct: number | null;
  deferred_developer_fee: number | null;

  // Site
  is_qct: boolean;
  is_dda: boolean;
  is_opportunity_zone: boolean;
  is_r_ecap: boolean;
  census_tract: string | null;
  fema_flood_zone: string | null;
  zoning_designation: string | null;
  acreage: number | null;

  // QAP
  qap_state: string | null;
  qap_year: number | null;
  preliminary_qap_score: number | null;
  max_qap_score: number | null;

  // Compliance Summary (auto-populated)
  compliance_score: number | null;
  total_checks: number;
  passed_checks: number;
  failed_checks: number;
  critical_findings: number;

  // Workflow
  status: ProposalStatus;
  assigned_reviewer_id: string | null;
  submitted_by_id: string | null;
  agency_id: string | null;

  // Files
  google_drive_folder_url: string | null;

  // AI Processing
  ai_analysis_completed: boolean;
  ai_analysis_timestamp: string | null;
  ai_model_used: string | null;
  ai_raw_response: Record<string, unknown> | null;

  // Timestamps
  submitted_at: string;
  review_started_at: string | null;
  review_completed_at: string | null;
  created_at: string;
  updated_at: string;

  // Joined data (from views/queries)
  agency?: Agency;
  reviewer?: Profile;
  compliance_checks?: ComplianceCheck[];
  qap_scores?: QapScore[];
  documents?: Document[];
  deficiencies?: Deficiency[];
}

export interface ComplianceCheck {
  id: string;
  proposal_id: string;
  check_name: string;
  category: ComplianceCategory;
  result: ComplianceResult;
  severity: SeverityLevel;
  regulatory_citation: string | null;
  finding_detail: string | null;
  recommendation: string | null;
  expected_value: string | null;
  actual_value: string | null;
  threshold: string | null;
  reviewer_override: ComplianceResult | null;
  override_reason: string | null;
  overridden_by: string | null;
  overridden_at: string | null;
  sort_order: number;
  created_at: string;
}

export interface QapScore {
  id: string;
  proposal_id: string;
  qap_state: string;
  qap_year: number;
  category_name: string;
  category_code: string | null;
  max_points: number;
  awarded_points: number;
  confidence: number | null;
  rationale: string | null;
  recommendation: string | null;
  point_gap: number;
  reviewer_points: number | null;
  reviewer_notes: string | null;
  adjusted_by: string | null;
  adjusted_at: string | null;
  sort_order: number;
  created_at: string;
}

export interface Document {
  id: string;
  proposal_id: string;
  file_name: string;
  file_type: DocumentType;
  file_url: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  is_processed: boolean;
  extracted_data: Record<string, unknown> | null;
  extraction_method: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
  notes: string | null;
  created_at: string;
}

export interface Deficiency {
  id: string;
  proposal_id: string;
  compliance_check_id: string | null;
  item_number: number;
  description: string;
  regulatory_basis: string | null;
  status: DeficiencyStatus;
  developer_response: string | null;
  response_date: string | null;
  response_document_id: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Underwriting {
  id: string;
  proposal_id: string;
  first_mortgage: number | null;
  tax_credit_equity: number | null;
  state_gap_financing: number | null;
  local_gap_financing: number | null;
  deferred_developer_fee: number | null;
  other_sources: number | null;
  total_sources: number | null;
  land_acquisition: number | null;
  hard_construction: number | null;
  sitework: number | null;
  soft_costs: number | null;
  developer_fee: number | null;
  reserves: number | null;
  financing_costs: number | null;
  other_uses: number | null;
  total_uses: number | null;
  sources_uses_gap: number | null;
  per_unit_tdc: number | null;
  hud_tdc_limit: number | null;
  tdc_within_limits: boolean | null;
  hud_hcc_limit: number | null;
  hcc_within_limits: boolean | null;
  bond_test_pct: number | null;
  bond_test_passes: boolean | null;
  dscr_year_1: number | null;
  dscr_year_5: number | null;
  dscr_year_10: number | null;
  dscr_year_15: number | null;
  dscr_minimum: number | null;
  effective_gross_income: number | null;
  total_operating_expenses: number | null;
  net_operating_income: number | null;
  operating_expense_ratio: number | null;
  subsidy_layering_result: string | null;
  subsidy_layering_notes: string | null;
  analysis_date: string;
  analyst_notes: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  proposal_id: string | null;
  user_id: string | null;
  action: string;
  action_detail: string | null;
  old_value: string | null;
  new_value: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

// --- AI Response Types ---
// These define the expected JSON structure from Claude API responses

export interface AIComplianceCheckResult {
  check_name: string;
  category: ComplianceCategory;
  result: ComplianceResult;
  severity: SeverityLevel;
  citation: string;
  finding: string;
  recommendation: string | null;
  expected_value?: string;
  actual_value?: string;
}

export interface AIQapScoreResult {
  category: string;
  max_points: number;
  awarded_points: number;
  confidence: number;
  rationale: string;
  recommendation: string;
}

export interface AIAnalysisResponse {
  compliance_checks: AIComplianceCheckResult[];
  qap_scores: AIQapScoreResult[];
  summary: string;
}

export type DealStage = "prospecting" | "due_diligence" | "under_contract" | "closed";

export interface Deal {
  id: string;
  address: string;
  price: number | null;           // NUMERIC(14,2) — dollars
  projected_roi: number | null;   // percentage, e.g. 12.5 = 12.5%
  stage: DealStage;
  notes: string | null;
  sort_order: number;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export type ProjectType =
  | "lihtc_9pct"
  | "lihtc_4pct"
  | "home"
  | "htf"
  | "cdbg"
  | "mixed_use"
  | "market_rate"
  | "other";

export interface Project {
  id: string;
  name: string;
  address: string | null;
  type: ProjectType;
  budget: number | null;       // stored as NUMERIC(14,2) — dollars
  timeline: string | null;     // free-form, e.g. "Q4 2026" or ISO date
  notes: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

// --- Dashboard & View Types ---

export interface DashboardStats {
  total_proposals: number;
  received: number;
  processing: number;
  in_review: number;
  deficiency: number;
  approved: number;
  denied: number;
  avg_compliance_score: number | null;
  avg_qap_score: number | null;
  total_units_in_pipeline: number;
  total_tdc_in_pipeline: number;
  avg_days_to_review: number | null;
}

export interface ProposalListItem {
  id: string;
  proposal_number: string;
  project_name: string;
  developer_entity: string;
  credit_type: CreditType;
  total_units: number | null;
  total_development_cost: number | null;
  status: ProposalStatus;
  compliance_score: number | null;
  preliminary_qap_score: number | null;
  max_qap_score: number | null;
  critical_findings: number;
  submitted_at: string;
  agency_name: string | null;
  agency_abbrev: string | null;
  reviewer_name: string | null;
  days_in_pipeline: number;
  open_deficiencies: number;
  document_count: number;
}
