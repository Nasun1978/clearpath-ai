-- ============================================================================
-- Document Repository Migration
-- Run this in the Supabase SQL Editor
-- ============================================================================

-- 1. company_documents table
CREATE TABLE IF NOT EXISTS company_documents (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT        NOT NULL,
  document_name TEXT        NOT NULL,
  file_url      TEXT        NOT NULL,  -- public or signed URL (refreshed at query time)
  file_path     TEXT        NOT NULL,  -- storage path: {user_id}/{uuid}-{filename}
  file_size     BIGINT,                -- bytes
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    DATE,                  -- optional expiration (e.g. annual certs)
  notes         TEXT
);

-- 2. RLS — users see only their own documents
ALTER TABLE company_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_documents"
  ON company_documents
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS idx_company_documents_user_id
  ON company_documents (user_id, uploaded_at DESC);

-- ============================================================================
-- Storage bucket: run in SQL Editor (Supabase Storage section)
-- OR use the Supabase dashboard to create the bucket manually:
--   Name: company-docs   |   Public: false
-- ============================================================================

-- Create bucket (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-docs',
  'company-docs',
  false,
  52428800,  -- 50 MB per file
  ARRAY[
    'application/pdf',
    'image/jpeg', 'image/png', 'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can only read/write inside their own uid/ folder
CREATE POLICY "users_own_folder_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'company-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "users_own_folder_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'company-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "users_own_folder_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'company-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
