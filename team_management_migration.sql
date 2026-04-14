-- ============================================================================
-- Team Management Migration
-- Run in Supabase SQL Editor (safe to re-run — uses IF NOT EXISTS / IF EXISTS)
-- ============================================================================

-- ── team_members ─────────────────────────────────────────────────────────────
-- Stores the development team for a project (developer, architect, GC, etc.)

CREATE TABLE IF NOT EXISTS team_members (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  full_name    TEXT        NOT NULL,
  email        TEXT        NOT NULL,
  phone        TEXT,
  role         TEXT        NOT NULL,
  company      TEXT,
  notes        TEXT,
  invited_by   UUID        REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Only the owner of the project can view/manage its team members
DROP POLICY IF EXISTS "project_owner_manages_team" ON team_members;
CREATE POLICY "project_owner_manages_team" ON team_members
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = team_members.project_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = team_members.project_id
        AND p.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_team_members_project ON team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email   ON team_members(email);

-- ── task_assignments ──────────────────────────────────────────────────────────
-- Tracks which checklist items are assigned to which team members.
-- item_text and checklist_name are denormalized for fast dashboard queries.

CREATE TABLE IF NOT EXISTS task_assignments (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_item_id   TEXT        NOT NULL,
  checklist_id        UUID        NOT NULL REFERENCES lihtc_checklist(id) ON DELETE CASCADE,
  item_text           TEXT,
  checklist_name      TEXT,
  assigned_to_email   TEXT        NOT NULL,
  assigned_by         UUID        REFERENCES auth.users(id),
  due_date            DATE,
  status              TEXT        NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'in_progress', 'complete')),
  notes               TEXT,
  notified_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- One assignment record per item per checklist
  UNIQUE (checklist_item_id, checklist_id)
);

ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- Checklist owner can manage all assignments on their checklists
DROP POLICY IF EXISTS "checklist_owner_manages_assignments" ON task_assignments;
CREATE POLICY "checklist_owner_manages_assignments" ON task_assignments
  USING (
    EXISTS (
      SELECT 1 FROM lihtc_checklist cl
      WHERE cl.id = task_assignments.checklist_id
        AND cl.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lihtc_checklist cl
      WHERE cl.id = task_assignments.checklist_id
        AND cl.created_by = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_task_assignments_email     ON task_assignments(assigned_to_email);
CREATE INDEX IF NOT EXISTS idx_task_assignments_checklist ON task_assignments(checklist_id);
