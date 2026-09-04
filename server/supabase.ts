// ==============================================================================
// HIPOTECALY SERVER: Supabase Server-Side & Admin Client
// ==============================================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://imzljdwsrsxyccgogfck.supabase.co';

const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

// Cliente administrativo server-side con service_role si está disponible, o anon
export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

export const supabase = supabaseAdmin;
export const isSupabaseConfigured = Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
