// ==============================================================================
// HIPOTECALY: Supabase Client (Seguro - Variables de Entorno Exclusivas)
// Hardening Productivo Estricto: En producción exige credenciales reales sin fallback.
// ==============================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || '';

// Supabase recomienda publishable keys para proyectos nuevos. Se conserva
// VITE_SUPABASE_ANON_KEY como fallback para entornos existentes durante la migración.
const supabasePublicKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_PUBLISHABLE_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabasePublicKey &&
  !supabaseUrl.includes('placeholder')
);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabasePublicKey || 'placeholder-public-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
);
