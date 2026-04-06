-- ============================================================================
-- Migration 004: User-scoped RLS policies
-- Replaces open USING (true) policies with auth.uid()-scoped policies.
-- Run in Supabase SQL Editor (safe to re-run).
-- ============================================================================
-- IMPORTANT: After running this migration all API routes must use the
-- authenticated user's JWT (not the service role key) so that RLS is
-- enforced. The service role key bypasses RLS entirely.
-- ============================================================================


-- ============================================================================
-- 1. DEALS — user_id references auth.users(id)
-- ============================================================================

-- Auto-set user_id from the calling user's JWT on every INSERT
CREATE OR REPLACE FUNCTION set_deals_user_id()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deals_set_user_id ON deals;
CREATE TRIGGER trg_deals_set_user_id
  BEFORE INSERT ON deals
  FOR EACH ROW EXECUTE FUNCTION set_deals_user_id();

DROP POLICY IF EXISTS "deals_select" ON deals;
CREATE POLICY "deals_select" ON deals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "deals_insert" ON deals;
CREATE POLICY "deals_insert" ON deals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "deals_update" ON deals;
CREATE POLICY "deals_update" ON deals
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "deals_delete" ON deals;
CREATE POLICY "deals_delete" ON deals
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================================================
-- 2. PROJECTS — user_id references auth.users(id)
-- ============================================================================

CREATE OR REPLACE FUNCTION set_projects_user_id()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_projects_set_user_id ON projects;
CREATE TRIGGER trg_projects_set_user_id
  BEFORE INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION set_projects_user_id();

DROP POLICY IF EXISTS "projects_select" ON projects;
CREATE POLICY "projects_select" ON projects
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "projects_insert" ON projects;
CREATE POLICY "projects_insert" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "projects_update" ON projects;
CREATE POLICY "projects_update" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "projects_delete" ON projects;
CREATE POLICY "projects_delete" ON projects
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================================================
-- 3. LIHTC_CHECKLIST — created_by references auth.users(id)
-- ============================================================================

CREATE OR REPLACE FUNCTION set_checklist_created_by()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_checklist_set_created_by ON lihtc_checklist;
CREATE TRIGGER trg_checklist_set_created_by
  BEFORE INSERT ON lihtc_checklist
  FOR EACH ROW EXECUTE FUNCTION set_checklist_created_by();

DROP POLICY IF EXISTS "checklist_select" ON lihtc_checklist;
CREATE POLICY "checklist_select" ON lihtc_checklist
  FOR SELECT USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "checklist_insert" ON lihtc_checklist;
CREATE POLICY "checklist_insert" ON lihtc_checklist
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "checklist_update" ON lihtc_checklist;
CREATE POLICY "checklist_update" ON lihtc_checklist
  FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "checklist_delete" ON lihtc_checklist;
CREATE POLICY "checklist_delete" ON lihtc_checklist
  FOR DELETE USING (auth.uid() = created_by);


-- ============================================================================
-- 4. PROPOSALS — submitted_by_id references profiles(id) = auth.uid()
--    Admins and reviewers retain full read/write access via role check.
-- ============================================================================

DROP POLICY IF EXISTS "Admins and reviewers see all proposals" ON proposals;
CREATE POLICY "Admins and reviewers see all proposals" ON proposals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'reviewer')
    )
  );

DROP POLICY IF EXISTS "Developers see own proposals" ON proposals;
CREATE POLICY "Developers see own proposals" ON proposals
  FOR SELECT TO authenticated
  USING (submitted_by_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can insert proposals" ON proposals;
CREATE POLICY "Authenticated users can insert proposals" ON proposals
  FOR INSERT TO authenticated
  WITH CHECK (submitted_by_id = auth.uid());

DROP POLICY IF EXISTS "Reviewers and admins can update proposals" ON proposals;
CREATE POLICY "Reviewers and admins can update proposals" ON proposals
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'reviewer')
    )
  );

-- Developers can update their own proposals (e.g. deficiency responses)
DROP POLICY IF EXISTS "Developers update own proposals" ON proposals;
CREATE POLICY "Developers update own proposals" ON proposals
  FOR UPDATE TO authenticated
  USING (submitted_by_id = auth.uid());

-- Delete is admin-only
DROP POLICY IF EXISTS "proposals_delete" ON proposals;
CREATE POLICY "proposals_delete" ON proposals
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );


-- ============================================================================
-- 5. COMPLIANCE_CHECKS — no direct user column; access via proposal ownership
-- ============================================================================

DROP POLICY IF EXISTS "View compliance checks via proposal access" ON compliance_checks;
CREATE POLICY "View compliance checks via proposal access" ON compliance_checks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals p
      LEFT JOIN profiles pr ON pr.id = auth.uid()
      WHERE p.id = compliance_checks.proposal_id
        AND (pr.role IN ('admin', 'reviewer') OR p.submitted_by_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Service role can insert compliance checks" ON compliance_checks;
CREATE POLICY "Insert compliance checks via proposal access" ON compliance_checks
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM proposals p
      WHERE p.id = compliance_checks.proposal_id
        AND p.submitted_by_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'reviewer')
    )
  );


-- ============================================================================
-- 6. QAP_SCORING — no direct user column; access via proposal ownership
-- ============================================================================

DROP POLICY IF EXISTS "View qap scores via proposal access" ON qap_scoring;
CREATE POLICY "View qap scores via proposal access" ON qap_scoring
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals p
      LEFT JOIN profiles pr ON pr.id = auth.uid()
      WHERE p.id = qap_scoring.proposal_id
        AND (pr.role IN ('admin', 'reviewer') OR p.submitted_by_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Service role can insert qap scores" ON qap_scoring;
CREATE POLICY "Insert qap scores via proposal access" ON qap_scoring
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM proposals p
      WHERE p.id = qap_scoring.proposal_id
        AND p.submitted_by_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'reviewer')
    )
  );


-- ============================================================================
-- 7. DOCUMENTS — uploaded_by references profiles(id); also via proposal access
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated can view documents" ON documents;
CREATE POLICY "Authenticated can view documents" ON documents
  FOR SELECT TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM proposals p
      LEFT JOIN profiles pr ON pr.id = auth.uid()
      WHERE p.id = documents.proposal_id
        AND (pr.role IN ('admin', 'reviewer') OR p.submitted_by_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authenticated can insert documents" ON documents;
CREATE POLICY "Authenticated can insert documents" ON documents
  FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM proposals p
      WHERE p.id = documents.proposal_id
        AND p.submitted_by_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'reviewer')
    )
  );

DROP POLICY IF EXISTS "documents_update" ON documents;
CREATE POLICY "documents_update" ON documents
  FOR UPDATE TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'reviewer')
    )
  );


-- ============================================================================
-- 8. DEFICIENCIES — no direct user column; access via proposal ownership
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated can view deficiencies" ON deficiencies;
CREATE POLICY "Authenticated can view deficiencies" ON deficiencies
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals p
      LEFT JOIN profiles pr ON pr.id = auth.uid()
      WHERE p.id = deficiencies.proposal_id
        AND (pr.role IN ('admin', 'reviewer') OR p.submitted_by_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authenticated can insert deficiencies" ON deficiencies;
CREATE POLICY "Authenticated can insert deficiencies" ON deficiencies
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM proposals p
      WHERE p.id = deficiencies.proposal_id
        AND p.submitted_by_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'reviewer')
    )
  );

DROP POLICY IF EXISTS "Authenticated can update deficiencies" ON deficiencies;
CREATE POLICY "Authenticated can update deficiencies" ON deficiencies
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM proposals p
      LEFT JOIN profiles pr ON pr.id = auth.uid()
      WHERE p.id = deficiencies.proposal_id
        AND (pr.role IN ('admin', 'reviewer') OR p.submitted_by_id = auth.uid())
    )
  );


-- ============================================================================
-- 9. ACTIVITY_LOG — user_id references profiles(id)
--    Users see their own entries; admins see all.
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated can view activity log" ON activity_log;
CREATE POLICY "Authenticated can view activity log" ON activity_log
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Authenticated can insert activity log" ON activity_log;
CREATE POLICY "Authenticated can insert activity log" ON activity_log
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());


-- ============================================================================
-- 10. SUPABASE STORAGE — checklist-docs bucket
--     Users can only access files under their own uid prefix.
--     (Run only if bucket already exists; otherwise create bucket first.)
-- ============================================================================

DROP POLICY IF EXISTS "checklist_docs_select" ON storage.objects;
CREATE POLICY "checklist_docs_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'checklist-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "checklist_docs_insert" ON storage.objects;
CREATE POLICY "checklist_docs_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'checklist-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "checklist_docs_delete" ON storage.objects;
CREATE POLICY "checklist_docs_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'checklist-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
