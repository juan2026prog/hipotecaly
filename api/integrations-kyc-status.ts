// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/integrations-kyc-status
// Consulta de estado KYC desde Supabase / Didit
// ==============================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://imzljdwsrsxyccgogfck.supabase.co';

const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed. Use GET.' });
  }

  const sessionId = (req.query?.sessionId || req.query?.session_id) as string;
  const caseId = (req.query?.caseId || req.query?.case_id) as string;
  const userId = (req.query?.userId || req.query?.user_id) as string;

  if (!sessionId && !caseId && !userId) {
    return res.status(400).json({ error: 'Falta parámetro sessionId, caseId o userId' });
  }

  try {
    let query = supabaseAdmin.from('identity_verifications').select('*');
    if (sessionId) {
      query = query.eq('provider_session_id', sessionId);
    } else if (caseId) {
      query = query.eq('case_id', caseId).order('created_at', { ascending: false }).limit(1);
    } else if (userId) {
      query = query.eq('user_id', userId).order('created_at', { ascending: false }).limit(1);
    }

    const { data, error } = await query.maybeSingle();
    if (error || !data) {
      return res.status(200).json({
        success: true,
        verification: {
          provider_session_id: sessionId || null,
          case_id: caseId || null,
          provider: 'didit',
          status: 'in_progress',
          mode: process.env.KYC_MODE || 'live',
        },
      });
    }

    return res.status(200).json({ success: true, verification: data });
  } catch (err: any) {
    return res.status(500).json({ error: 'Error al consultar estado KYC', message: err?.message });
  }
}
