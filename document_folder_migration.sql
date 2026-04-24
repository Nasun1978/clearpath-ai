-- ============================================================================
-- Document Folder Structure Migration
-- Run this in the Supabase SQL Editor AFTER document_repository_migration.sql
-- ============================================================================

-- 1. Add folder_path column for hierarchical organization
ALTER TABLE company_documents
  ADD COLUMN IF NOT EXISTS folder_path TEXT;

-- 2. Back-fill existing rows from document_type
UPDATE company_documents
SET folder_path = CASE document_type
  WHEN 'w9'                 THEN 'company_documents/w9'
  WHEN 'board_resolution'   THEN 'company_documents/board_resolution'
  WHEN 'tax_clearance'      THEN 'company_documents/tax_clearance'
  WHEN 'affidavit_work_site'THEN 'company_documents/affidavit_work_site'
  WHEN 'good_standing'      THEN 'company_documents/good_standing'
  WHEN 'annual_inspection'  THEN 'company_documents/annual_inspection'
  WHEN 'rental_application' THEN 'company_documents/rental_application'
  WHEN 'tenant_id'          THEN 'company_documents/tenant_documents'
  WHEN 'tenant_income'      THEN 'company_documents/tenant_documents'
  ELSE                           'company_documents/other'
END
WHERE folder_path IS NULL;

-- 3. Index for fast per-folder lookups
CREATE INDEX IF NOT EXISTS idx_company_documents_folder_path
  ON company_documents (user_id, folder_path);
