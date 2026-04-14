-- ============================================================================
-- Checklist Documents Storage Bucket Migration
-- Run this in the Supabase SQL Editor
-- Creates the "checklist-docs" bucket used by /api/checklist/upload
-- ============================================================================

DO $$
BEGIN
  -- Create bucket if it doesn't already exist
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'checklist-docs') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'checklist-docs',
      'checklist-docs',
      true,   -- public so uploaded file URLs work without signed URL refresh
      52428800,  -- 50 MB per file
      ARRAY[
        'application/pdf',
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'text/csv',
        'application/zip'
      ]
    );
  END IF;
END $$;

-- Storage RLS: files are stored at {user_id}/{checklist_id}/{item_id}_*.ext
-- Only the uploading user can write/delete; files are publicly readable (bucket is public).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'checklist_docs_public_read'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "checklist_docs_public_read"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'checklist-docs')
    $p$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'checklist_docs_owner_insert'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "checklist_docs_owner_insert"
        ON storage.objects FOR INSERT
        WITH CHECK (
          bucket_id = 'checklist-docs'
          AND (storage.foldername(name))[1] = auth.uid()::text
        )
    $p$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'checklist_docs_owner_delete'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "checklist_docs_owner_delete"
        ON storage.objects FOR DELETE
        USING (
          bucket_id = 'checklist-docs'
          AND (storage.foldername(name))[1] = auth.uid()::text
        )
    $p$;
  END IF;
END $$;
