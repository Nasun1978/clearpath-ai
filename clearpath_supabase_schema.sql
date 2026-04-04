-- ============================================================================
-- CLEARPATH AI — SUPABASE DATABASE SCHEMA (DEBUGGED)
-- ============================================================================
-- REO, LLC | Steven Kennedy | April 2026
--
-- INSTRUCTIONS:
-- 1. Open your Supabase project at app.supabase.com
-- 2. Go to SQL Editor (left sidebar)
-- 3. Click "New Query"
-- 4. Paste this ENTIRE file
-- 5. Click "Run" (or Cmd+Enter on Mac)
-- 6. All tables, enums, policies, functions, and views will be created
--
-- This schema supports the full ClearPath AI MVP:
-- - Proposal intake and tracking
-- - Compliance check results (Section 42, HOME, HTF, CDBG, RAD)
-- - QAP scoring (TDHCA, LHC, expandable to all 50 states)
-- - Financial underwriting validation
-- - Document management
-- - Deficiency tracking
-- - Reviewer assignments and workflow
-- - Audit logging
-- ============================================================================


-- ============================================================================
-- SECTION 0: IDEMPOTENT CLEANUP (safe to re-run)
-- ============================================================================
-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS v_rent_compliance CASCADE;
DROP VIEW IF EXISTS v_agency_portfolio CASCADE;
DROP VIEW IF EXISTS v_qap_summary CASCADE;
DROP VIEW IF EXISTS v_compliance_summary CASCADE;
DROP VIEW IF EXISTS v_proposal_dashboard CASCADE;

-- Drop functions (they depend on types)
DROP FUNCTION IF EXISTS get_dashboard_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_proposal_review(UUID) CASCADE;
DROP FUNCTION IF EXISTS record_qap_results(UUID, TEXT, INTEGER, JSONB) CASCADE;
DROP FUNCTION IF EXISTS record_compliance_results(UUID, JSONB, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_proposal(TEXT, TEXT, credit_type, INTEGER, NUMERIC, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS log_proposal_status_change() CASCADE;
DROP FUNCTION IF EXISTS recalculate_qap_score() CASCADE;
DROP FUNCTION IF EXISTS recalculate_compliance_score() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS generate_proposal_number() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Drop tables (in dependency order)
DROP TABLE IF EXISTS report_templates CASCADE;
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS rent_schedule CASCADE;
DROP TABLE IF EXISTS underwriting CASCADE;
DROP TABLE IF EXISTS deficiencies CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS qap_scoring CASCADE;
DROP TABLE IF EXISTS compliance_checks CASCADE;
DROP TABLE IF EXISTS proposals CASCADE;
DROP TABLE IF EXISTS agencies CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop sequence
DROP SEQUENCE IF EXISTS proposal_number_seq;

-- Drop enum types (only if they exist)
DO $$ BEGIN
  DROP TYPE IF EXISTS deficiency_status CASCADE;
  DROP TYPE IF EXISTS document_type CASCADE;
  DROP TYPE IF EXISTS user_role CASCADE;
  DROP TYPE IF EXISTS compliance_category CASCADE;
  DROP TYPE IF EXISTS severity_level CASCADE;
  DROP TYPE IF EXISTS compliance_result CASCADE;
  DROP TYPE IF EXISTS set_aside_election CASCADE;
  DROP TYPE IF EXISTS credit_type CASCADE;
  DROP TYPE IF EXISTS proposal_status CASCADE;
END $$;


-- ============================================================================
-- SECTION 1: CUSTOM ENUM TYPES
-- ============================================================================
-- These enforce data integrity — only valid values can be inserted

CREATE TYPE proposal_status AS ENUM (
  'draft',
  'received',
  'processing',
  'in_review',
  'deficiency',
  'approved',
  'approved_with_conditions',
  'denied',
  'withdrawn'
);

CREATE TYPE credit_type AS ENUM (
  'lihtc_4pct',
  'lihtc_9pct',
  'home',
  'htf',
  'cdbg',
  'rad',
  'mixed',
  'other'
);

CREATE TYPE set_aside_election AS ENUM (
  '20_50',
  '40_60',
  'income_average',
  'not_applicable'
);

CREATE TYPE compliance_result AS ENUM (
  'pass',
  'fail',
  'needs_review',
  'not_applicable'
);

CREATE TYPE severity_level AS ENUM (
  'critical',
  'warning',
  'informational'
);

CREATE TYPE compliance_category AS ENUM (
  'section_42',
  'home',
  'htf',
  'cdbg',
  'rad',
  'qap',
  'financial',
  'environmental',
  'fair_housing',
  'local_zoning',
  'general'
);

CREATE TYPE user_role AS ENUM (
  'admin',
  'reviewer',
  'developer',
  'read_only'
);

CREATE TYPE document_type AS ENUM (
  'application',
  'pro_forma',
  'market_study',
  'environmental_report',
  'site_plan',
  'architectural_drawings',
  'legal_entity_docs',
  'support_letters',
  'appraisal',
  'phase_i_esa',
  'title_report',
  'other'
);

CREATE TYPE deficiency_status AS ENUM (
  'open',
  'submitted',
  'under_review',
  'resolved',
  'waived'
);


-- ============================================================================
-- SECTION 2: CORE TABLES
-- ============================================================================

-- ----------------------------
-- 2.1 USER PROFILES
-- ----------------------------
-- Extends Supabase auth.users with ClearPath-specific fields
-- Links to Supabase Auth automatically via the id column

CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  full_name       TEXT,
  role            user_role NOT NULL DEFAULT 'read_only',
  organization    TEXT,
  title           TEXT,
  phone           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'User profiles for ClearPath AI. Extends Supabase auth with role-based access.';


-- ----------------------------
-- 2.1b AUTO-CREATE PROFILE ON SIGN-UP
-- ----------------------------
-- When a user signs up via Supabase Auth, automatically create a profile row.
-- Without this trigger, new users would have no profile and RLS policies
-- that join on profiles would fail silently.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'read_only'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ----------------------------
-- 2.2 AGENCIES
-- ----------------------------
-- Tracks the government agencies that use ClearPath
-- NOTE: qap_state is stored as TEXT (not an enum) for flexibility —
-- allows any two-letter state code without schema migration.

CREATE TABLE agencies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  abbreviation    TEXT,
  agency_type     TEXT NOT NULL,
  state           TEXT,
  city            TEXT,
  address         TEXT,
  contact_name    TEXT,
  contact_email   TEXT,
  contact_phone   TEXT,
  qap_state       TEXT,
  notes           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE agencies IS 'Government agencies using ClearPath AI — PHAs, HFAs, planning departments, HUD offices.';

-- Seed initial agencies
INSERT INTO agencies (name, abbreviation, agency_type, state, qap_state) VALUES
  ('Houston Housing Authority', 'HHA', 'Housing Authority', 'TX', 'TX'),
  ('Louisiana Housing Corporation', 'LHC', 'State HFA', 'LA', 'LA'),
  ('Texas Department of Housing and Community Affairs', 'TDHCA', 'State HFA', 'TX', 'TX'),
  ('Housing Authority of New Orleans', 'HANO', 'Housing Authority', 'LA', 'LA'),
  ('Philadelphia Housing Authority', 'PHA', 'Housing Authority', 'PA', NULL),
  ('City of Houston Planning Dept', 'COH-Planning', 'Local Planning', 'TX', NULL);


-- ----------------------------
-- 2.3 PROPOSALS (Master Record)
-- ----------------------------
-- One row per development proposal submitted for review
-- NOTE: qap_state stored as TEXT to match agencies table and avoid
-- needing to alter an enum when adding new states.

CREATE TABLE proposals (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identification
  proposal_number         TEXT UNIQUE NOT NULL DEFAULT '',
  project_name            TEXT NOT NULL,
  project_address         TEXT,
  city                    TEXT,
  county                  TEXT,
  state                   TEXT DEFAULT 'TX',
  zip_code                TEXT,

  -- Developer Info
  developer_entity        TEXT NOT NULL,
  developer_contact_name  TEXT,
  developer_contact_email TEXT,
  developer_contact_phone TEXT,

  -- Program & Structure
  credit_type             credit_type NOT NULL,
  set_aside_election      set_aside_election DEFAULT 'not_applicable',
  is_new_construction     BOOLEAN DEFAULT true,
  is_rehab                BOOLEAN DEFAULT false,
  is_acquisition          BOOLEAN DEFAULT false,

  -- Unit & Affordability Data
  total_units             INTEGER,
  affordable_units        INTEGER,
  market_rate_units       INTEGER DEFAULT 0,
  ami_30_pct_units        INTEGER DEFAULT 0,
  ami_50_pct_units        INTEGER DEFAULT 0,
  ami_60_pct_units        INTEGER DEFAULT 0,
  ami_80_pct_units        INTEGER DEFAULT 0,
  ami_120_pct_units       INTEGER DEFAULT 0,

  -- Financial Summary
  total_development_cost  NUMERIC(14,2),
  eligible_basis          NUMERIC(14,2),
  qualified_basis         NUMERIC(14,2),
  annual_credit_amount    NUMERIC(12,2),
  credit_price            NUMERIC(6,4),
  tax_credit_equity       NUMERIC(14,2),
  bond_amount             NUMERIC(14,2),
  permanent_loan_amount   NUMERIC(14,2),
  permanent_loan_rate     NUMERIC(5,4),
  permanent_loan_term     INTEGER,
  dscr                    NUMERIC(5,3),
  developer_fee           NUMERIC(14,2),
  developer_fee_pct       NUMERIC(5,3),
  deferred_developer_fee  NUMERIC(14,2),

  -- Site Characteristics
  is_qct                  BOOLEAN DEFAULT false,
  is_dda                  BOOLEAN DEFAULT false,
  is_opportunity_zone     BOOLEAN DEFAULT false,
  is_r_ecap               BOOLEAN DEFAULT false,
  census_tract            TEXT,
  fema_flood_zone         TEXT,
  zoning_designation      TEXT,
  acreage                 NUMERIC(8,3),

  -- QAP Info
  qap_state               TEXT,
  qap_year                INTEGER,
  preliminary_qap_score   NUMERIC(6,2),
  max_qap_score           NUMERIC(6,2),

  -- Compliance Summary (auto-populated by triggers)
  compliance_score        NUMERIC(5,2),
  total_checks            INTEGER DEFAULT 0,
  passed_checks           INTEGER DEFAULT 0,
  failed_checks           INTEGER DEFAULT 0,
  critical_findings       INTEGER DEFAULT 0,

  -- Workflow
  status                  proposal_status NOT NULL DEFAULT 'received',
  assigned_reviewer_id    UUID REFERENCES profiles(id),
  submitted_by_id         UUID REFERENCES profiles(id),
  agency_id               UUID REFERENCES agencies(id),

  -- Files
  google_drive_folder_url TEXT,

  -- AI Processing
  ai_analysis_completed   BOOLEAN DEFAULT false,
  ai_analysis_timestamp   TIMESTAMPTZ,
  ai_model_used           TEXT,
  ai_raw_response         JSONB,

  -- Timestamps
  submitted_at            TIMESTAMPTZ DEFAULT now(),
  review_started_at       TIMESTAMPTZ,
  review_completed_at     TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE proposals IS 'Master record for each development proposal submitted to ClearPath AI.';


-- ----------------------------
-- 2.4 COMPLIANCE CHECKS
-- ----------------------------

CREATE TABLE compliance_checks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id         UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,

  check_name          TEXT NOT NULL,
  category            compliance_category NOT NULL,
  result              compliance_result NOT NULL,
  severity            severity_level NOT NULL DEFAULT 'informational',

  regulatory_citation TEXT,
  finding_detail      TEXT,
  recommendation      TEXT,

  expected_value      TEXT,
  actual_value        TEXT,
  threshold           TEXT,

  -- Review override
  reviewer_override   compliance_result,
  override_reason     TEXT,
  overridden_by       UUID REFERENCES profiles(id),
  overridden_at       TIMESTAMPTZ,

  sort_order          INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE compliance_checks IS 'Individual compliance check results. Each proposal generates multiple rows — one per rule checked.';


-- ----------------------------
-- 2.5 QAP SCORING
-- ----------------------------

CREATE TABLE qap_scoring (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id         UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,

  qap_state           TEXT NOT NULL,
  qap_year            INTEGER NOT NULL,

  category_name       TEXT NOT NULL,
  category_code       TEXT,

  max_points          NUMERIC(6,2) NOT NULL,
  awarded_points      NUMERIC(6,2) NOT NULL,
  confidence          NUMERIC(4,2),

  rationale           TEXT,
  recommendation      TEXT,
  point_gap           NUMERIC(6,2) GENERATED ALWAYS AS (max_points - awarded_points) STORED,

  -- Reviewer adjustment
  reviewer_points     NUMERIC(6,2),
  reviewer_notes      TEXT,
  adjusted_by         UUID REFERENCES profiles(id),
  adjusted_at         TIMESTAMPTZ,

  sort_order          INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE qap_scoring IS 'QAP competitive scoring results. Each proposal generates one row per scoring category.';


-- ----------------------------
-- 2.6 DOCUMENTS
-- ----------------------------

CREATE TABLE documents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id         UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,

  file_name           TEXT NOT NULL,
  file_type           document_type NOT NULL DEFAULT 'other',
  file_url            TEXT,
  file_size_bytes     BIGINT,
  mime_type           TEXT,

  is_processed        BOOLEAN DEFAULT false,
  extracted_data      JSONB,
  extraction_method   TEXT,

  uploaded_by         UUID REFERENCES profiles(id),
  uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE documents IS 'Files uploaded as part of development proposals — applications, pro formas, site plans, etc.';


-- ----------------------------
-- 2.7 DEFICIENCIES
-- ----------------------------

CREATE TABLE deficiencies (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id         UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  compliance_check_id UUID REFERENCES compliance_checks(id),

  item_number         INTEGER NOT NULL,
  description         TEXT NOT NULL,
  regulatory_basis    TEXT,

  status              deficiency_status NOT NULL DEFAULT 'open',

  developer_response  TEXT,
  response_date       TIMESTAMPTZ,
  response_document_id UUID REFERENCES documents(id),

  resolved_by         UUID REFERENCES profiles(id),
  resolved_at         TIMESTAMPTZ,
  resolution_notes    TEXT,

  due_date            DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE deficiencies IS 'Specific deficiency items requiring developer response before approval.';


-- ----------------------------
-- 2.8 UNDERWRITING SNAPSHOTS
-- ----------------------------

CREATE TABLE underwriting (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id             UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,

  -- Sources
  first_mortgage           NUMERIC(14,2),
  tax_credit_equity        NUMERIC(14,2),
  state_gap_financing      NUMERIC(14,2),
  local_gap_financing      NUMERIC(14,2),
  deferred_developer_fee   NUMERIC(14,2),
  other_sources            NUMERIC(14,2),
  total_sources            NUMERIC(14,2),

  -- Uses
  land_acquisition         NUMERIC(14,2),
  hard_construction        NUMERIC(14,2),
  sitework                 NUMERIC(14,2),
  soft_costs               NUMERIC(14,2),
  developer_fee            NUMERIC(14,2),
  reserves                 NUMERIC(14,2),
  financing_costs          NUMERIC(14,2),
  other_uses               NUMERIC(14,2),
  total_uses               NUMERIC(14,2),

  -- Gap Analysis (auto-calculated)
  sources_uses_gap         NUMERIC(14,2) GENERATED ALWAYS AS (
    COALESCE(total_sources, 0) - COALESCE(total_uses, 0)
  ) STORED,

  -- Key Metrics
  per_unit_tdc             NUMERIC(12,2),
  hud_tdc_limit            NUMERIC(12,2),
  tdc_within_limits        BOOLEAN,
  hud_hcc_limit            NUMERIC(12,2),
  hcc_within_limits        BOOLEAN,

  bond_test_pct            NUMERIC(6,4),
  bond_test_passes         BOOLEAN,

  dscr_year_1              NUMERIC(5,3),
  dscr_year_5              NUMERIC(5,3),
  dscr_year_10             NUMERIC(5,3),
  dscr_year_15             NUMERIC(5,3),
  dscr_minimum             NUMERIC(5,3),

  effective_gross_income    NUMERIC(12,2),
  total_operating_expenses  NUMERIC(12,2),
  net_operating_income      NUMERIC(12,2),
  operating_expense_ratio   NUMERIC(5,4),

  -- Subsidy Layering
  subsidy_layering_result   TEXT,
  subsidy_layering_notes    TEXT,

  -- Analysis metadata
  analysis_date             TIMESTAMPTZ DEFAULT now(),
  analyst_notes             TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE underwriting IS 'Financial underwriting analysis snapshot for each proposal.';


-- ----------------------------
-- 2.9 RENT SCHEDULES
-- ----------------------------

CREATE TABLE rent_schedule (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id         UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,

  unit_type           TEXT NOT NULL,
  num_units           INTEGER NOT NULL,
  ami_level           INTEGER NOT NULL,
  proposed_rent       NUMERIC(8,2) NOT NULL,
  utility_allowance   NUMERIC(8,2) NOT NULL DEFAULT 0,
  gross_rent          NUMERIC(8,2) GENERATED ALWAYS AS (proposed_rent + utility_allowance) STORED,
  mtsp_rent_limit     NUMERIC(8,2),
  rent_compliant      BOOLEAN,

  square_footage      INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE rent_schedule IS 'Unit-level rent data for MTSP compliance validation.';


-- ----------------------------
-- 2.10 ACTIVITY LOG (Audit Trail)
-- ----------------------------

CREATE TABLE activity_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id     UUID REFERENCES proposals(id) ON DELETE SET NULL,
  user_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,

  action          TEXT NOT NULL,
  action_detail   TEXT,
  old_value       TEXT,
  new_value       TEXT,
  metadata        JSONB,

  ip_address      INET,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE activity_log IS 'Audit trail for all significant actions. Critical for government compliance requirements.';


-- ----------------------------
-- 2.11 REPORT TEMPLATES
-- ----------------------------

CREATE TABLE report_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  agency_id       UUID REFERENCES agencies(id),
  template_type   TEXT NOT NULL,
  template_config JSONB,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE report_templates IS 'Configurable report templates per agency.';


-- ============================================================================
-- SECTION 3: AUTO-INCREMENT PROPOSAL NUMBERS
-- ============================================================================
-- Generates proposal numbers like "CP-2026-0001"

CREATE SEQUENCE proposal_number_seq START WITH 1;

CREATE OR REPLACE FUNCTION generate_proposal_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.proposal_number IS NULL OR NEW.proposal_number = '' THEN
    NEW.proposal_number := 'CP-' || EXTRACT(YEAR FROM now())::TEXT || '-' ||
                            LPAD(nextval('proposal_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_proposal_number
  BEFORE INSERT ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION generate_proposal_number();


-- ============================================================================
-- SECTION 4: AUTO-UPDATE TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_timestamp BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_agencies_timestamp BEFORE UPDATE ON agencies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_proposals_timestamp BEFORE UPDATE ON proposals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_deficiencies_timestamp BEFORE UPDATE ON deficiencies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_report_templates_timestamp BEFORE UPDATE ON report_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================================
-- SECTION 5: AUTO-CALCULATE COMPLIANCE SCORES
-- ============================================================================

CREATE OR REPLACE FUNCTION recalculate_compliance_score()
RETURNS TRIGGER AS $$
DECLARE
  v_proposal_id UUID;
  v_total INTEGER;
  v_passed INTEGER;
  v_failed INTEGER;
  v_critical INTEGER;
BEGIN
  v_proposal_id := COALESCE(NEW.proposal_id, OLD.proposal_id);

  SELECT
    COUNT(*) FILTER (WHERE result != 'not_applicable'),
    COUNT(*) FILTER (WHERE result = 'pass'),
    COUNT(*) FILTER (WHERE result = 'fail'),
    COUNT(*) FILTER (WHERE result = 'fail' AND severity = 'critical')
  INTO v_total, v_passed, v_failed, v_critical
  FROM compliance_checks
  WHERE proposal_id = v_proposal_id;

  UPDATE proposals SET
    total_checks = v_total,
    passed_checks = v_passed,
    failed_checks = v_failed,
    critical_findings = v_critical,
    compliance_score = CASE WHEN v_total > 0 THEN ROUND((v_passed::NUMERIC / v_total) * 100, 1) ELSE 0 END
  WHERE id = v_proposal_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalc_compliance_on_insert
  AFTER INSERT ON compliance_checks
  FOR EACH ROW EXECUTE FUNCTION recalculate_compliance_score();

CREATE TRIGGER recalc_compliance_on_update
  AFTER UPDATE ON compliance_checks
  FOR EACH ROW EXECUTE FUNCTION recalculate_compliance_score();

CREATE TRIGGER recalc_compliance_on_delete
  AFTER DELETE ON compliance_checks
  FOR EACH ROW EXECUTE FUNCTION recalculate_compliance_score();


-- ============================================================================
-- SECTION 6: AUTO-CALCULATE QAP SCORES
-- ============================================================================

CREATE OR REPLACE FUNCTION recalculate_qap_score()
RETURNS TRIGGER AS $$
DECLARE
  v_proposal_id UUID;
  v_total_awarded NUMERIC;
  v_total_max NUMERIC;
BEGIN
  v_proposal_id := COALESCE(NEW.proposal_id, OLD.proposal_id);

  SELECT
    COALESCE(SUM(awarded_points), 0),
    COALESCE(SUM(max_points), 0)
  INTO v_total_awarded, v_total_max
  FROM qap_scoring
  WHERE proposal_id = v_proposal_id;

  UPDATE proposals SET
    preliminary_qap_score = v_total_awarded,
    max_qap_score = v_total_max
  WHERE id = v_proposal_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recalc_qap_on_insert AFTER INSERT ON qap_scoring FOR EACH ROW EXECUTE FUNCTION recalculate_qap_score();
CREATE TRIGGER recalc_qap_on_update AFTER UPDATE ON qap_scoring FOR EACH ROW EXECUTE FUNCTION recalculate_qap_score();
CREATE TRIGGER recalc_qap_on_delete AFTER DELETE ON qap_scoring FOR EACH ROW EXECUTE FUNCTION recalculate_qap_score();


-- ============================================================================
-- SECTION 7: AUTO-LOG STATUS CHANGES
-- ============================================================================

CREATE OR REPLACE FUNCTION log_proposal_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO activity_log (proposal_id, action, action_detail, old_value, new_value)
    VALUES (
      NEW.id,
      'status_changed',
      'Proposal "' || NEW.project_name || '" status changed from ' || OLD.status::TEXT || ' to ' || NEW.status::TEXT,
      OLD.status::TEXT,
      NEW.status::TEXT
    );

    -- Auto-set timestamps based on status transitions
    IF NEW.status = 'in_review' AND OLD.status != 'in_review' THEN
      NEW.review_started_at = now();
    END IF;

    IF NEW.status IN ('approved', 'approved_with_conditions', 'denied') THEN
      NEW.review_completed_at = now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_status_change
  BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION log_proposal_status_change();


-- ============================================================================
-- SECTION 8: INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_agency ON proposals(agency_id);
CREATE INDEX idx_proposals_reviewer ON proposals(assigned_reviewer_id);
CREATE INDEX idx_proposals_credit_type ON proposals(credit_type);
CREATE INDEX idx_proposals_state ON proposals(state);
CREATE INDEX idx_proposals_submitted ON proposals(submitted_at DESC);
CREATE INDEX idx_proposals_qap_state ON proposals(qap_state);

CREATE INDEX idx_compliance_checks_proposal ON compliance_checks(proposal_id);
CREATE INDEX idx_compliance_checks_result ON compliance_checks(result);
CREATE INDEX idx_compliance_checks_category ON compliance_checks(category);

CREATE INDEX idx_qap_scoring_proposal ON qap_scoring(proposal_id);
CREATE INDEX idx_qap_scoring_state ON qap_scoring(qap_state);

CREATE INDEX idx_documents_proposal ON documents(proposal_id);
CREATE INDEX idx_deficiencies_proposal ON deficiencies(proposal_id);
CREATE INDEX idx_deficiencies_status ON deficiencies(status);
CREATE INDEX idx_activity_log_proposal ON activity_log(proposal_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);

CREATE INDEX idx_underwriting_proposal ON underwriting(proposal_id);
CREATE INDEX idx_rent_schedule_proposal ON rent_schedule(proposal_id);


-- ============================================================================
-- SECTION 9: VIEWS (Dashboard Queries)
-- ============================================================================

-- 9.1 Reviewer Dashboard Summary
CREATE VIEW v_proposal_dashboard AS
SELECT
  p.id,
  p.proposal_number,
  p.project_name,
  p.developer_entity,
  p.credit_type,
  p.total_units,
  p.total_development_cost,
  p.status,
  p.compliance_score,
  p.preliminary_qap_score,
  p.max_qap_score,
  p.critical_findings,
  p.submitted_at,
  p.review_started_at,
  a.name AS agency_name,
  a.abbreviation AS agency_abbrev,
  rev.full_name AS reviewer_name,
  EXTRACT(DAY FROM now() - COALESCE(p.review_started_at, p.submitted_at))::INTEGER AS days_in_pipeline,
  (SELECT COUNT(*) FROM deficiencies d WHERE d.proposal_id = p.id AND d.status = 'open') AS open_deficiencies,
  (SELECT COUNT(*) FROM documents doc WHERE doc.proposal_id = p.id) AS document_count
FROM proposals p
LEFT JOIN agencies a ON p.agency_id = a.id
LEFT JOIN profiles rev ON p.assigned_reviewer_id = rev.id
ORDER BY p.submitted_at DESC;


-- 9.2 Compliance Summary by Proposal
CREATE VIEW v_compliance_summary AS
SELECT
  p.id AS proposal_id,
  p.proposal_number,
  p.project_name,
  COUNT(*) FILTER (WHERE cc.result != 'not_applicable') AS total_checks,
  COUNT(*) FILTER (WHERE cc.result = 'pass') AS passed,
  COUNT(*) FILTER (WHERE cc.result = 'fail') AS failed,
  COUNT(*) FILTER (WHERE cc.result = 'needs_review') AS needs_review,
  COUNT(*) FILTER (WHERE cc.severity = 'critical' AND cc.result = 'fail') AS critical_failures,
  COUNT(*) FILTER (WHERE cc.severity = 'warning' AND cc.result = 'fail') AS warnings,
  CASE WHEN COUNT(*) FILTER (WHERE cc.result != 'not_applicable') > 0
    THEN ROUND(COUNT(*) FILTER (WHERE cc.result = 'pass')::NUMERIC /
         COUNT(*) FILTER (WHERE cc.result != 'not_applicable') * 100, 1)
    ELSE 0
  END AS pass_rate
FROM proposals p
LEFT JOIN compliance_checks cc ON p.id = cc.proposal_id
GROUP BY p.id, p.proposal_number, p.project_name;


-- 9.3 QAP Score Summary
CREATE VIEW v_qap_summary AS
SELECT
  p.id AS proposal_id,
  p.proposal_number,
  p.project_name,
  qs.qap_state,
  qs.qap_year,
  SUM(qs.awarded_points) AS total_awarded,
  SUM(qs.max_points) AS total_max,
  ROUND(SUM(qs.awarded_points) / NULLIF(SUM(qs.max_points), 0) * 100, 1) AS score_pct,
  SUM(qs.point_gap) AS total_point_gap,
  COUNT(*) FILTER (WHERE qs.point_gap > 0) AS categories_with_gaps
FROM proposals p
JOIN qap_scoring qs ON p.id = qs.proposal_id
GROUP BY p.id, p.proposal_number, p.project_name, qs.qap_state, qs.qap_year;


-- 9.4 Agency Portfolio Overview
CREATE VIEW v_agency_portfolio AS
SELECT
  a.id AS agency_id,
  a.name AS agency_name,
  a.abbreviation,
  COUNT(p.id) AS total_proposals,
  COUNT(*) FILTER (WHERE p.status = 'received') AS received,
  COUNT(*) FILTER (WHERE p.status = 'in_review') AS in_review,
  COUNT(*) FILTER (WHERE p.status = 'deficiency') AS deficiency,
  COUNT(*) FILTER (WHERE p.status IN ('approved', 'approved_with_conditions')) AS approved,
  COUNT(*) FILTER (WHERE p.status = 'denied') AS denied,
  ROUND(AVG(p.compliance_score), 1) AS avg_compliance_score,
  ROUND(AVG(p.total_development_cost), 0) AS avg_tdc,
  SUM(p.total_units) AS total_units_in_pipeline
FROM agencies a
LEFT JOIN proposals p ON a.id = p.agency_id
GROUP BY a.id, a.name, a.abbreviation;


-- 9.5 Rent Compliance View
CREATE VIEW v_rent_compliance AS
SELECT
  rs.*,
  p.proposal_number,
  p.project_name,
  CASE
    WHEN rs.mtsp_rent_limit IS NOT NULL AND rs.gross_rent > rs.mtsp_rent_limit
    THEN rs.gross_rent - rs.mtsp_rent_limit
    ELSE 0
  END AS rent_overage
FROM rent_schedule rs
JOIN proposals p ON rs.proposal_id = p.id;


-- ============================================================================
-- SECTION 10: ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE qap_scoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE deficiencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE underwriting ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles, but only update their own
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Agencies: all authenticated users can read
CREATE POLICY "Authenticated users can view agencies"
  ON agencies FOR SELECT
  TO authenticated
  USING (true);

-- Proposals: reviewers and admins see all; developers see only their own
CREATE POLICY "Admins and reviewers see all proposals"
  ON proposals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'reviewer')
    )
  );

CREATE POLICY "Developers see own proposals"
  ON proposals FOR SELECT
  TO authenticated
  USING (submitted_by_id = auth.uid());

CREATE POLICY "Authenticated users can insert proposals"
  ON proposals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Reviewers and admins can update proposals"
  ON proposals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'reviewer')
    )
  );

-- Compliance checks: same visibility as parent proposal
CREATE POLICY "View compliance checks via proposal access"
  ON compliance_checks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals p
      LEFT JOIN profiles pr ON pr.id = auth.uid()
      WHERE p.id = proposal_id
      AND (pr.role IN ('admin', 'reviewer') OR p.submitted_by_id = auth.uid())
    )
  );

CREATE POLICY "Service role can insert compliance checks"
  ON compliance_checks FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- QAP scoring: same pattern
CREATE POLICY "View qap scores via proposal access"
  ON qap_scoring FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals p
      LEFT JOIN profiles pr ON pr.id = auth.uid()
      WHERE p.id = proposal_id
      AND (pr.role IN ('admin', 'reviewer') OR p.submitted_by_id = auth.uid())
    )
  );

CREATE POLICY "Service role can insert qap scores"
  ON qap_scoring FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Documents, deficiencies, underwriting, rent_schedule: simplified for MVP
CREATE POLICY "Authenticated can view documents" ON documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert documents" ON documents FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can view deficiencies" ON deficiencies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert deficiencies" ON deficiencies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update deficiencies" ON deficiencies FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated can view underwriting" ON underwriting FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert underwriting" ON underwriting FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can view rent schedule" ON rent_schedule FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert rent schedule" ON rent_schedule FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can view activity log" ON activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert activity log" ON activity_log FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can view report templates" ON report_templates FOR SELECT TO authenticated USING (true);


-- ============================================================================
-- SECTION 11: HELPER FUNCTIONS
-- ============================================================================

-- 11.1 Create a new proposal with auto-number
CREATE OR REPLACE FUNCTION create_proposal(
  p_project_name TEXT,
  p_developer_entity TEXT,
  p_credit_type credit_type,
  p_total_units INTEGER DEFAULT NULL,
  p_total_development_cost NUMERIC DEFAULT NULL,
  p_agency_id UUID DEFAULT NULL,
  p_submitted_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO proposals (
    project_name, developer_entity, credit_type,
    total_units, total_development_cost, agency_id, submitted_by_id, status
  ) VALUES (
    p_project_name, p_developer_entity, p_credit_type,
    p_total_units, p_total_development_cost, p_agency_id, p_submitted_by, 'received'
  )
  RETURNING id INTO v_id;

  -- Log the submission
  INSERT INTO activity_log (proposal_id, user_id, action, action_detail)
  VALUES (v_id, p_submitted_by, 'proposal_submitted',
          'New proposal submitted: ' || p_project_name || ' by ' || p_developer_entity);

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 11.2 Record AI compliance results (batch insert from JSON)
CREATE OR REPLACE FUNCTION record_compliance_results(
  p_proposal_id UUID,
  p_results JSONB,
  p_model_used TEXT DEFAULT 'claude-sonnet-4-6'
)
RETURNS VOID AS $$
DECLARE
  v_check JSONB;
  v_sort INTEGER := 0;
BEGIN
  -- Delete existing checks for this proposal (allows re-analysis)
  DELETE FROM compliance_checks WHERE proposal_id = p_proposal_id;

  FOR v_check IN SELECT * FROM jsonb_array_elements(p_results)
  LOOP
    v_sort := v_sort + 1;
    INSERT INTO compliance_checks (
      proposal_id, check_name, category, result, severity,
      regulatory_citation, finding_detail, recommendation,
      expected_value, actual_value, sort_order
    ) VALUES (
      p_proposal_id,
      v_check->>'check_name',
      (v_check->>'category')::compliance_category,
      (v_check->>'result')::compliance_result,
      COALESCE((v_check->>'severity')::severity_level, 'informational'),
      v_check->>'citation',
      v_check->>'finding',
      v_check->>'recommendation',
      v_check->>'expected_value',
      v_check->>'actual_value',
      v_sort
    );
  END LOOP;

  -- Mark the proposal as analyzed
  UPDATE proposals SET
    ai_analysis_completed = true,
    ai_analysis_timestamp = now(),
    ai_model_used = p_model_used,
    ai_raw_response = p_results,
    status = CASE
      WHEN status = 'received' OR status = 'processing' THEN 'in_review'::proposal_status
      ELSE status
    END
  WHERE id = p_proposal_id;

  -- Log the analysis
  INSERT INTO activity_log (proposal_id, action, action_detail, metadata)
  VALUES (p_proposal_id, 'ai_analysis_completed',
          'AI compliance analysis completed with ' || jsonb_array_length(p_results) || ' checks',
          jsonb_build_object('model', p_model_used, 'check_count', jsonb_array_length(p_results)));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 11.3 Record QAP scoring results (batch insert from JSON)
CREATE OR REPLACE FUNCTION record_qap_results(
  p_proposal_id UUID,
  p_qap_state TEXT,
  p_qap_year INTEGER,
  p_results JSONB
)
RETURNS VOID AS $$
DECLARE
  v_score JSONB;
  v_sort INTEGER := 0;
BEGIN
  -- Delete existing QAP scores for this proposal/state/year (allows re-scoring)
  DELETE FROM qap_scoring
  WHERE proposal_id = p_proposal_id
    AND qap_state = p_qap_state
    AND qap_year = p_qap_year;

  FOR v_score IN SELECT * FROM jsonb_array_elements(p_results)
  LOOP
    v_sort := v_sort + 1;
    INSERT INTO qap_scoring (
      proposal_id, qap_state, qap_year,
      category_name, max_points, awarded_points,
      confidence, rationale, recommendation, sort_order
    ) VALUES (
      p_proposal_id, p_qap_state, p_qap_year,
      v_score->>'category',
      (v_score->>'max_points')::NUMERIC,
      (v_score->>'awarded_points')::NUMERIC,
      (v_score->>'confidence')::NUMERIC,
      v_score->>'rationale',
      v_score->>'recommendation',
      v_sort
    );
  END LOOP;

  INSERT INTO activity_log (proposal_id, action, action_detail)
  VALUES (p_proposal_id, 'qap_scoring_completed',
          'QAP scoring completed for ' || p_qap_state || ' ' || p_qap_year || ' with ' || jsonb_array_length(p_results) || ' categories');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 11.4 Get full proposal review package
CREATE OR REPLACE FUNCTION get_proposal_review(p_proposal_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'proposal', row_to_json(p),
    'agency', row_to_json(a),
    'reviewer', row_to_json(rev),
    'compliance_checks', (
      SELECT COALESCE(jsonb_agg(row_to_json(cc) ORDER BY cc.sort_order, cc.created_at), '[]'::JSONB)
      FROM compliance_checks cc WHERE cc.proposal_id = p.id
    ),
    'qap_scores', (
      SELECT COALESCE(jsonb_agg(row_to_json(qs) ORDER BY qs.sort_order), '[]'::JSONB)
      FROM qap_scoring qs WHERE qs.proposal_id = p.id
    ),
    'underwriting', (
      SELECT row_to_json(u) FROM underwriting u WHERE u.proposal_id = p.id LIMIT 1
    ),
    'documents', (
      SELECT COALESCE(jsonb_agg(row_to_json(d) ORDER BY d.uploaded_at), '[]'::JSONB)
      FROM documents d WHERE d.proposal_id = p.id
    ),
    'deficiencies', (
      SELECT COALESCE(jsonb_agg(row_to_json(def) ORDER BY def.item_number), '[]'::JSONB)
      FROM deficiencies def WHERE def.proposal_id = p.id
    ),
    'rent_schedule', (
      SELECT COALESCE(jsonb_agg(row_to_json(rs) ORDER BY rs.ami_level, rs.unit_type), '[]'::JSONB)
      FROM rent_schedule rs WHERE rs.proposal_id = p.id
    ),
    'activity', (
      SELECT COALESCE(jsonb_agg(row_to_json(al) ORDER BY al.created_at DESC), '[]'::JSONB)
      FROM activity_log al WHERE al.proposal_id = p.id
    )
  ) INTO v_result
  FROM proposals p
  LEFT JOIN agencies a ON p.agency_id = a.id
  LEFT JOIN profiles rev ON p.assigned_reviewer_id = rev.id
  WHERE p.id = p_proposal_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 11.5 Dashboard statistics function
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_agency_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'total_proposals', COUNT(*),
      'received', COUNT(*) FILTER (WHERE status = 'received'),
      'processing', COUNT(*) FILTER (WHERE status = 'processing'),
      'in_review', COUNT(*) FILTER (WHERE status = 'in_review'),
      'deficiency', COUNT(*) FILTER (WHERE status = 'deficiency'),
      'approved', COUNT(*) FILTER (WHERE status IN ('approved', 'approved_with_conditions')),
      'denied', COUNT(*) FILTER (WHERE status = 'denied'),
      'avg_compliance_score', ROUND(AVG(compliance_score), 1),
      'avg_qap_score', ROUND(AVG(preliminary_qap_score), 1),
      'total_units_in_pipeline', COALESCE(SUM(total_units), 0),
      'total_tdc_in_pipeline', COALESCE(SUM(total_development_cost), 0),
      'avg_days_to_review', ROUND(AVG(
        EXTRACT(DAY FROM COALESCE(review_completed_at, now()) - submitted_at)
      ), 0)
    )
    FROM proposals
    WHERE (p_agency_id IS NULL OR agency_id = p_agency_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- SECTION 12: STORAGE BUCKET FOR DOCUMENTS
-- ============================================================================

DO $$
BEGIN
  -- Only insert if bucket doesn't already exist
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'proposal-documents') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'proposal-documents',
      'proposal-documents',
      false,
      52428800,
      ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/png', 'image/jpeg', 'image/tiff']
    );
  END IF;
END $$;

-- Storage policies (drop first to be idempotent)
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;

CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'proposal-documents');

CREATE POLICY "Authenticated users can view documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'proposal-documents');


-- ============================================================================
-- SECTION 13: SAMPLE DATA FOR TESTING
-- ============================================================================
-- This section is ACTIVE so the prototype has data to show immediately.
-- Comment it out for production deployments.

-- Insert a test proposal (Live Oak Residences)
DO $$
DECLARE
  v_prop_id UUID;
  v_agency_id UUID;
BEGIN
  -- Get the LHC agency ID
  SELECT id INTO v_agency_id FROM agencies WHERE abbreviation = 'LHC' LIMIT 1;

  -- Create proposal via the function (auto-generates proposal number)
  v_prop_id := create_proposal(
    'Live Oak Residences',
    'REO, LLC / Loraso Development',
    'lihtc_4pct',
    61,
    24600000.00,
    v_agency_id,
    NULL
  );

  -- Update with full details
  UPDATE proposals SET
    project_address = '1234 Live Oak Drive',
    city = 'Harvey',
    county = 'Jefferson Parish',
    state = 'LA',
    zip_code = '70058',
    eligible_basis = 18500000.00,
    bond_amount = 15000000.00,
    permanent_loan_amount = 8200000.00,
    permanent_loan_rate = 0.0375,
    permanent_loan_term = 40,
    dscr = 1.25,
    developer_fee = 2000000.00,
    developer_fee_pct = 0.081,
    credit_price = 0.9200,
    tax_credit_equity = 6800000.00,
    set_aside_election = '40_60',
    is_new_construction = true,
    is_qct = false,
    is_dda = true,
    qap_state = 'LA',
    qap_year = 2025,
    total_units = 61,
    affordable_units = 61,
    ami_30_pct_units = 7,
    ami_50_pct_units = 15,
    ami_60_pct_units = 39
  WHERE id = v_prop_id;

  -- Insert sample compliance checks
  PERFORM record_compliance_results(v_prop_id, '[
    {"check_name": "Set-Aside Election Compliance", "category": "section_42", "result": "pass", "severity": "critical", "citation": "IRC §42(g)(1)", "finding": "Project elects 40-60 set-aside with 100% of units at or below 60% AMI. Minimum threshold met.", "recommendation": null},
    {"check_name": "50% Bond Test (Aggregate Basis)", "category": "section_42", "result": "pass", "severity": "critical", "citation": "IRC §42(h)(4)(B)", "finding": "Bond amount of $15M represents 61% of aggregate basis ($24.6M). Exceeds 50% threshold required for 4% credits.", "recommendation": null, "expected_value": ">=50%", "actual_value": "61%"},
    {"check_name": "Developer Fee Limit", "category": "financial", "result": "pass", "severity": "warning", "citation": "LHC QAP §5.3", "finding": "Developer fee of $2,000,000 represents 8.1% of TDC. Within the 15% maximum.", "recommendation": null, "expected_value": "<=15%", "actual_value": "8.1%"},
    {"check_name": "DSCR Minimum", "category": "financial", "result": "pass", "severity": "critical", "citation": "LHC Underwriting Standards", "finding": "DSCR of 1.25x exceeds minimum requirement of 1.15x.", "recommendation": null, "expected_value": ">=1.15x", "actual_value": "1.25x"},
    {"check_name": "DDA Eligible Basis Boost", "category": "section_42", "result": "pass", "severity": "informational", "citation": "IRC §42(d)(5)(B)(iii)", "finding": "Project is in a Difficult Development Area. Eligible basis may be increased by 130%.", "recommendation": "Verify DDA designation is current for the application year."},
    {"check_name": "Income Targeting - 30% AMI", "category": "section_42", "result": "pass", "severity": "informational", "citation": "IRC §42(g)(2)", "finding": "7 units (11.5%) targeted at 30% AMI. Meets deep targeting preference.", "recommendation": null},
    {"check_name": "Rent Compliance - 60% AMI Units", "category": "section_42", "result": "needs_review", "severity": "warning", "citation": "IRC §42(g)(2)", "finding": "Proposed rents for 60% AMI units could not be fully validated. MTSP rent limits for Jefferson Parish should be verified against current HUD published schedules.", "recommendation": "Confirm 2025 MTSP rent limits for Jefferson Parish and revalidate all unit rents."}
  ]'::JSONB, 'claude-sonnet-4-6');

  -- Insert sample QAP scores (LHC 2025)
  PERFORM record_qap_results(v_prop_id, 'LA', 2025, '[
    {"category": "Income Targeting Depth", "max_points": 20, "awarded_points": 16, "confidence": 0.85, "rationale": "7 units at 30% AMI (11.5%) and 15 units at 50% AMI (24.6%). Strong deep targeting but not maximum depth.", "recommendation": "Adding 2-3 more units at 30% AMI would likely achieve maximum points."},
    {"category": "Permanent Supportive Housing", "max_points": 15, "awarded_points": 0, "confidence": 0.95, "rationale": "No PSH commitment identified in the application.", "recommendation": "Partnering with a local continuum of care agency to designate 5-10% of units as PSH could yield 10-15 additional points."},
    {"category": "Energy Efficiency", "max_points": 10, "awarded_points": 6, "confidence": 0.70, "rationale": "Application indicates Energy Star compliance but does not specify LEED or Enterprise Green Communities certification.", "recommendation": "Pursuing Enterprise Green Communities certification would maximize energy efficiency points."},
    {"category": "Community Revitalization", "max_points": 10, "awarded_points": 8, "confidence": 0.80, "rationale": "Jefferson Parish location in a designated revitalization area. Project aligns with local comprehensive plan priorities.", "recommendation": "Obtaining a formal letter of support from Jefferson Parish Council would strengthen this scoring category."},
    {"category": "Developer Experience", "max_points": 15, "awarded_points": 12, "confidence": 0.90, "rationale": "REO, LLC has completed Baronne Lofts (22 units, 4% LIHTC) and has active development pipeline. Solid but not extensive track record.", "recommendation": "Document all completed and in-progress projects with placed-in-service dates and 8609 issuance confirmation."},
    {"category": "Cost Efficiency", "max_points": 10, "awarded_points": 8, "confidence": 0.75, "rationale": "Per-unit TDC of approximately $403K. Within LHC cost efficiency guidelines for new construction in Jefferson Parish.", "recommendation": "Value engineering to reduce per-unit cost below $380K would maximize points."},
    {"category": "Leveraging Non-LIHTC Sources", "max_points": 10, "awarded_points": 7, "confidence": 0.80, "rationale": "HUD 221(d)(4) permanent financing provides significant federal leveraging. Tax-exempt bonds provide additional non-LIHTC sources.", "recommendation": "Identifying a local gap financing source (parish CDBG, HOME) would demonstrate additional leveraging."},
    {"category": "Tenant Services", "max_points": 10, "awarded_points": 5, "confidence": 0.65, "rationale": "Limited tenant services information in the application. Basic services appear planned but not fully documented.", "recommendation": "Develop a comprehensive tenant services plan with a committed service provider and dedicated budget line item."}
  ]'::JSONB);

END $$;


-- ============================================================================
-- DONE!
-- ============================================================================
-- Your ClearPath AI database is now set up with:
--
-- 11 tables (proposals, compliance_checks, qap_scoring, underwriting,
--            rent_schedule, documents, deficiencies, profiles, agencies,
--            activity_log, report_templates)
-- 9 enum types for data integrity
-- 5 database views for dashboard queries
-- 6 helper functions for common operations
-- Auto-incrementing proposal numbers (CP-2026-0001)
-- Auto-calculating compliance scores and QAP scores
-- Auto-logging status changes to audit trail
-- Auto-updating timestamps
-- Auto-creating profile on user sign-up
-- Row Level Security policies
-- Performance indexes
-- File storage bucket (idempotent)
-- Sample data pre-loaded (Live Oak Residences)
--
-- KEY FIXES IN THIS VERSION:
-- 1. Added handle_new_user() trigger — profiles auto-created on sign-up
-- 2. Removed qap_state ENUM — uses TEXT instead (no schema migration needed
--    when adding new states)
-- 3. Made storage bucket insert idempotent (safe to re-run)
-- 4. Made record_compliance_results() and record_qap_results() idempotent
--    (deletes old results before inserting, enables re-analysis)
-- 5. Added COALESCE to underwriting.sources_uses_gap generated column
--    (avoids NULL arithmetic)
-- 6. Section 13 sample data is ACTIVE by default for prototype testing
-- 7. Added sort_order to record_compliance_results for consistent display
-- 8. Status transition in record_compliance_results only moves forward
--    (won't override 'approved' back to 'in_review')
-- 9. Proposal number trigger uses IF/THEN instead of WHEN clause
--    (more compatible with the NOT NULL + DEFAULT '' pattern)
-- 10. All DROP IF EXISTS at top for safe re-runs
--
-- NEXT STEPS:
-- 1. Go to Authentication > Settings and enable email/password sign-up
-- 2. Create your first user account (profile auto-created via trigger)
-- 3. Update that profile's role to 'admin':
--    UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
-- 4. Test: SELECT * FROM v_proposal_dashboard;
-- 5. Test: SELECT get_dashboard_stats();
-- ============================================================================
