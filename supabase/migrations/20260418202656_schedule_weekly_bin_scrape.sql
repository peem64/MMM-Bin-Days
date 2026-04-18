/*
  # Weekly Bin Scrape Cron Job

  1. Extensions
    - Enable `pg_cron` for job scheduling
    - Enable `pg_net` for async HTTP calls from Postgres

  2. Scheduled Job
    - Creates a weekly cron job that runs every Monday at 06:00 UTC
    - Calls the `scrape-bins` edge function via HTTP POST
    - Edge function reads the stored bin_config and refreshes bin_collections

  3. Notes
    - Job name: `weekly-bin-scrape`
    - Unschedules any existing job with the same name first (idempotent)
    - Uses the project's anon key; the edge function has verify_jwt=false so anon works
*/

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weekly-bin-scrape') THEN
    PERFORM cron.unschedule('weekly-bin-scrape');
  END IF;
END $$;

SELECT cron.schedule(
  'weekly-bin-scrape',
  '0 6 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://nbxhulaczrpvcmtdxlwp.supabase.co/functions/v1/scrape-bins',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ieGh1bGFjenJwdmNtdGR4bHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MzM2MTUsImV4cCI6MjA5MjEwOTYxNX0.m7JAfkUl6jrsKk9A2RrhxFJENiVB0xlDG20wJVMbC6E'
    ),
    body := '{}'::jsonb
  );
  $$
);
