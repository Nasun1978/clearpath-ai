-- ============================================================================
-- Vendor Marketplace Migration
-- Run in Supabase SQL Editor
-- ============================================================================

-- 1. vendor_profiles — registered vendor companies
CREATE TABLE IF NOT EXISTS vendor_profiles (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name     TEXT        NOT NULL,
  contact_name     TEXT        NOT NULL,
  email            TEXT        NOT NULL,
  phone            TEXT,
  website          TEXT,
  vendor_type      TEXT        NOT NULL,
  license_number   TEXT,
  certifications   JSONB       NOT NULL DEFAULT '[]',  -- VendorCertification[]
  service_areas    JSONB       NOT NULL DEFAULT '[]',  -- string[] ("City, ST")
  bio              TEXT,
  portfolio_url    TEXT,
  years_experience INTEGER,
  is_active        BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Each user can have one vendor profile
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_profiles_user_id ON vendor_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_type ON vendor_profiles (vendor_type);

-- 2. project_listings — projects posted by developers needing vendors
CREATE TABLE IF NOT EXISTS project_listings (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_user_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name      TEXT        NOT NULL,
  project_address   TEXT,
  project_type      TEXT        NOT NULL,              -- 'New Construction'|'Rehabilitation'|'Both'
  unit_count        INTEGER,
  estimated_budget  NUMERIC(14,2),                    -- dollars
  description       TEXT        NOT NULL,
  services_needed   JSONB       NOT NULL DEFAULT '[]', -- VendorType[]
  status            TEXT        NOT NULL DEFAULT 'open', -- open|in_review|awarded|closed
  deadline          DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_listings_developer ON project_listings (developer_user_id);
CREATE INDEX IF NOT EXISTS idx_project_listings_status ON project_listings (status, created_at DESC);

-- 3. vendor_bids — bids submitted by vendors on project listings
CREATE TABLE IF NOT EXISTS vendor_bids (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id         UUID        NOT NULL REFERENCES project_listings(id) ON DELETE CASCADE,
  vendor_id          UUID        NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  bid_amount         NUMERIC(14,2),
  proposal_text      TEXT        NOT NULL,
  estimated_timeline TEXT,
  attachments_url    TEXT,
  status             TEXT        NOT NULL DEFAULT 'submitted', -- submitted|shortlisted|awarded|rejected
  submitted_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (listing_id, vendor_id)  -- one bid per vendor per listing
);

CREATE INDEX IF NOT EXISTS idx_vendor_bids_listing ON vendor_bids (listing_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bids_vendor ON vendor_bids (vendor_id);

-- 4. vendor_subscriptions — tracks plan tiers for vendors
CREATE TABLE IF NOT EXISTS vendor_subscriptions (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan                   TEXT        NOT NULL DEFAULT 'basic',  -- basic|professional|premium
  stripe_subscription_id TEXT,
  status                 TEXT        NOT NULL DEFAULT 'active', -- active|cancelled|past_due
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_subscriptions_user ON vendor_subscriptions (vendor_user_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_subscriptions ENABLE ROW LEVEL SECURITY;

-- vendor_profiles: authenticated users can read all active profiles; owners can write
CREATE POLICY "vendor_profiles_read"
  ON vendor_profiles FOR SELECT
  USING (is_active = true OR user_id = auth.uid());

CREATE POLICY "vendor_profiles_insert"
  ON vendor_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "vendor_profiles_update"
  ON vendor_profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- project_listings: authenticated users can read open listings; developers manage own
CREATE POLICY "listings_read"
  ON project_listings FOR SELECT
  USING (status = 'open' OR developer_user_id = auth.uid());

CREATE POLICY "listings_insert"
  ON project_listings FOR INSERT
  WITH CHECK (developer_user_id = auth.uid());

CREATE POLICY "listings_update"
  ON project_listings FOR UPDATE
  USING (developer_user_id = auth.uid())
  WITH CHECK (developer_user_id = auth.uid());

CREATE POLICY "listings_delete"
  ON project_listings FOR DELETE
  USING (developer_user_id = auth.uid());

-- vendor_bids: vendors see own bids; developers see bids on their listings
CREATE POLICY "bids_read_own"
  ON vendor_bids FOR SELECT
  USING (
    vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid())
    OR listing_id IN (SELECT id FROM project_listings WHERE developer_user_id = auth.uid())
  );

CREATE POLICY "bids_insert"
  ON vendor_bids FOR INSERT
  WITH CHECK (
    vendor_id IN (SELECT id FROM vendor_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "bids_update"
  ON vendor_bids FOR UPDATE
  USING (
    listing_id IN (SELECT id FROM project_listings WHERE developer_user_id = auth.uid())
  );

-- vendor_subscriptions: users see and manage own subscription
CREATE POLICY "subscriptions_own"
  ON vendor_subscriptions FOR ALL
  USING (vendor_user_id = auth.uid())
  WITH CHECK (vendor_user_id = auth.uid());
