// ==============================================================================
// HIPOTECALY SERVER: Supabase Server-Side & Admin Client
// ==============================================================================

import { createClient } from '@supabase/supabase-js';
import { supabase as defaultClient, isSupabaseConfigured } from '../src/lib/supabase';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://imzljdwsrsxyccgogfck.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cliente administrativo server-side con service_role si está disponible, o cliente por defecto
export const supabaseAdmin = SERVICE_KEY
  ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
  : defaultClient;

export { defaultClient as supabase, isSupabaseConfigured };
