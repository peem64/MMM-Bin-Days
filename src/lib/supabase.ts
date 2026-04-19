import { createClient } from '@supabase/supabase-js';

const FALLBACK_SUPABASE_URL = 'https://nbxhulaczrpvcmtdxlwp.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ieGh1bGFjenJwdmNtdGR4bHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MzM2MTUsImV4cCI6MjA5MjEwOTYxNX0.m7JAfkUl6jrsKk9A2RrhxFJENiVB0xlDG20wJVMbC6E';

const envUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
const envAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';

const supabaseUrl = envUrl || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = envAnonKey || FALLBACK_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type BinCollection = {
  id: string;
  bin_type: string;
  bin_color: string;
  collection_date: string;
  created_at?: string;
};
