-- ============================================================================
-- Migration 003: lihtc_checklist table
-- Run in Supabase SQL Editor (safe to re-run)
-- ============================================================================

CREATE TABLE IF NOT EXISTS lihtc_checklist (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name     TEXT NOT NULL DEFAULT '',
  developer        TEXT NOT NULL DEFAULT '',
  location_parish  TEXT NOT NULL DEFAULT '',
  total_units      INTEGER,
  project_type     TEXT NOT NULL DEFAULT 'new_construction',
  date_prepared    DATE NOT NULL DEFAULT CURRENT_DATE,
  -- JSONB array of { id, section, text, checked, notes, uploaded_file_url, uploaded_file_name }
  checklist_items  JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lihtc_checklist_created_by ON lihtc_checklist (created_by);
CREATE INDEX IF NOT EXISTS lihtc_checklist_created_at ON lihtc_checklist (created_at DESC);

CREATE OR REPLACE FUNCTION update_lihtc_checklist_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lihtc_checklist_updated_at ON lihtc_checklist;
CREATE TRIGGER trg_lihtc_checklist_updated_at
  BEFORE UPDATE ON lihtc_checklist
  FOR EACH ROW EXECUTE FUNCTION update_lihtc_checklist_updated_at();

ALTER TABLE lihtc_checklist ENABLE ROW LEVEL SECURITY;

-- Open policies: service role key used by API routes bypasses RLS entirely.
-- USING (true) ensures queries never silently hang when the anon key is used.
DROP POLICY IF EXISTS "checklist_select" ON lihtc_checklist;
CREATE POLICY "checklist_select" ON lihtc_checklist FOR SELECT USING (true);

DROP POLICY IF EXISTS "checklist_insert" ON lihtc_checklist;
CREATE POLICY "checklist_insert" ON lihtc_checklist FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "checklist_update" ON lihtc_checklist;
CREATE POLICY "checklist_update" ON lihtc_checklist FOR UPDATE USING (true);

DROP POLICY IF EXISTS "checklist_delete" ON lihtc_checklist;
CREATE POLICY "checklist_delete" ON lihtc_checklist FOR DELETE USING (true);

-- Storage bucket for checklist supporting documents (run once manually if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('checklist-docs', 'checklist-docs', false)
-- ON CONFLICT (id) DO NOTHING;
