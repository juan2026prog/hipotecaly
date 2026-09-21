// ==============================================================================
// HIPOTECALY SERVER: Supabase Server-Side & Admin Client
// ==============================================================================

import { createClient } from '@supabase/supabase-js';

const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  (isDev ? 'https://imzljdwsrsxyccgogfck.supabase.co' : '');

const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  (isDev ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder' : '');

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SERVICE_KEY &&
  !SUPABASE_URL.includes('placeholder')
);

// En producción si falta la configuración de Supabase, no se conecta a un fallback silencioso
export const supabaseAdmin = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SERVICE_KEY || 'placeholder-service-key',
  {
    auth: { persistSession: false },
  }
);

export const supabase = supabaseAdmin;

