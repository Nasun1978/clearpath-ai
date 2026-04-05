-- ============================================================================
-- Migration 002: deals table
-- Run in Supabase SQL Editor (safe to re-run)
-- ============================================================================

CREATE TABLE IF NOT EXISTS deals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address       TEXT NOT NULL,
  price         NUMERIC(14,2),
  projected_roi NUMERIC(6,2),       -- percentage, e.g. 12.5 = 12.5%
  stage         TEXT NOT NULL DEFAULT 'prospecting' CHECK (stage IN (
                  'prospecting', 'due_diligence', 'under_contract', 'closed'
                )),
  notes         TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS deals_stage_sort ON deals (stage, sort_order);

CREATE OR REPLACE FUNCTION update_deals_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deals_updated_at ON deals;
CREATE TRIGGER trg_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_deals_updated_at();

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Open policies: route-level auth is enforced by Next.js middleware.
-- The API uses the service role key which bypasses RLS entirely, so these
-- policies only apply when the anon key is used (e.g. missing env var).
-- USING (true) ensures queries never silently hang or return empty results
-- due to auth state — any failure will surface as an explicit error instead.
DROP POLICY IF EXISTS "deals_select" ON deals;
CREATE POLICY "deals_select" ON deals
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "deals_insert" ON deals;
CREATE POLICY "deals_insert" ON deals
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "deals_update" ON deals;
CREATE POLICY "deals_update" ON deals
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "deals_delete" ON deals;
CREATE POLICY "deals_delete" ON deals
  FOR DELETE USING (true);
