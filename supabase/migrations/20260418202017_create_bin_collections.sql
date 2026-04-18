/*
  # Bin Collections Schema

  1. New Tables
    - `bin_config`
      - `id` (uuid, primary key)
      - `postcode` (text) - UK postcode used to query council website
      - `council_url` (text) - Base URL for the council's bin lookup page
      - `uprn` (text) - Optional Unique Property Reference Number
      - `last_refreshed` (timestamptz) - Last successful scrape
      - `created_at` (timestamptz)
    - `bin_collections`
      - `id` (uuid, primary key)
      - `bin_type` (text) - Name shown (e.g., "Recycling", "General Waste")
      - `bin_color` (text) - Tailwind-safe color key (e.g., "purple", "black", "green", "brown")
      - `collection_date` (date) - The date this bin is collected
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Public read access (this is a display module for a smart mirror, no sensitive data)
    - Public write via edge function using service role

  3. Notes
    - Data is refreshed via the scrape-bins edge function
    - Old collections are cleared on refresh to keep data tidy
*/

CREATE TABLE IF NOT EXISTS bin_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  postcode text NOT NULL DEFAULT '',
  council_url text NOT NULL DEFAULT '',
  uprn text DEFAULT '',
  last_refreshed timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bin_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bin_type text NOT NULL DEFAULT '',
  bin_color text NOT NULL DEFAULT 'gray',
  collection_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bin_collections_date ON bin_collections(collection_date);

ALTER TABLE bin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE bin_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read bin config"
  ON bin_config FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert bin config"
  ON bin_config FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update bin config"
  ON bin_config FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can read bin collections"
  ON bin_collections FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert bin collections"
  ON bin_collections FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can delete bin collections"
  ON bin_collections FOR DELETE
  TO anon, authenticated
  USING (true);
