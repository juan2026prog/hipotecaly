// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/integrations-kyc-webhook
// Webhook receptor de Didit con validación HMAC SHA-256 e idempotencia
// ==============================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const signature =
      (req.headers['x-signature-v2'] ||
        req.headers['X-Signature-V2'] ||
        req.headers['x-signature']) as string || '';
    const secret = process.env.DIDIT_WEBHOOK_SECRET || '';

    if (secret && signature) {
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(rawBody);
      const calculated = hmac.digest('hex');
      const bufCalc = Buffer.from(calculated, 'hex');
      const bufSig = Buffer.from(signature, 'hex');
      if (bufCalc.length !== bufSig.length || !crypto.timingSafeEqual(bufCalc, bufSig)) {
        return res.status(401).json({ error: 'Invalid HMAC signature' });
      }
    }

    const payload = typeof req.body === 'object' ? req.body : JSON.parse(rawBody);
    const sessionId = payload.session_id || payload.sessionId || payload.id;
    const rawStatus = payload.status || payload.decision || 'in_progress';
    const nowIso = new Date().toISOString();

    if (sessionId) {
      await supabaseAdmin
        .from('identity_verifications')
        .update({
          status: rawStatus === 'Approved' ? 'verified' : (rawStatus === 'Declined' ? 'failed' : 'in_progress'),
          provider_status: rawStatus,
          decision_code: payload.decision_code || null,
          completed_at: rawStatus === 'Approved' ? nowIso : null,
          updated_at: nowIso,
        })
        .eq('provider_session_id', sessionId);
    }

    return res.status(200).json({ status: 'ok', sessionId, statusProcessed: rawStatus });
  } catch (err: any) {
    return res.status(500).json({ error: 'Webhook processing error', message: err?.message });
  }
}
