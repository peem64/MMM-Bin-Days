/*
  # Allow updating bin collection rows

  1. Security
    - Adds an UPDATE policy on `bin_collections` so the preview UI can edit
      existing collection entries in place instead of delete+insert.
    - Policy is permissive (anon + authenticated, qual=true) to match the
      other existing policies on this table.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'bin_collections'
      AND policyname = 'Anyone can update bin collections'
  ) THEN
    CREATE POLICY "Anyone can update bin collections"
      ON bin_collections FOR UPDATE
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
