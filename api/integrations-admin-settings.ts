// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/integrations-admin-settings
// Estado de configuración de integraciones (Didit KYC / Firma Digital)
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

  const hasDiditKey = Boolean(process.env.DIDIT_API_KEY);
  const hasDiditWorkflow = Boolean(process.env.DIDIT_WORKFLOW_ID);
  const hasDiditSecret = Boolean(process.env.DIDIT_WEBHOOK_SECRET);
  const kycMode = (process.env.KYC_MODE || 'live').toLowerCase();
  const rawWorkflow = process.env.DIDIT_WORKFLOW_ID || '';
  const workflowIdMasked = rawWorkflow
    ? (rawWorkflow.length > 8 ? `${rawWorkflow.substring(0, 4)}••••${rawWorkflow.substring(rawWorkflow.length - 4)}` : '••••••••')
    : null;

  let verificationStats = {
    total: 0,
    verified: 0,
    failed: 0,
    in_progress: 0,
    pending_review: 0,
  };

  try {
    const { data: verifs } = await supabaseAdmin
      .from('identity_verifications')
      .select('status')
      .eq('provider', 'didit')
      .limit(50);

    if (verifs && verifs.length > 0) {
      verificationStats.total = verifs.length;
      verifs.forEach((v: any) => {
        if (v.status === 'verified') verificationStats.verified++;
        else if (v.status === 'failed') verificationStats.failed++;
        else if (v.status === 'in_progress' || v.status === 'created') verificationStats.in_progress++;
        else if (v.status === 'pending_review' || v.status === 'resubmission_required') verificationStats.pending_review++;
      });
    }
  } catch {}

  const kycConfigured = hasDiditKey && hasDiditSecret && hasDiditWorkflow;

  return res.status(200).json({
    kyc: {
      provider: 'didit',
      mode: kycMode,
      configured: kycConfigured,
      apiKeyConfigured: hasDiditKey,
      workflowConfigured: hasDiditWorkflow,
      workflowIdMasked,
      secretConfigured: hasDiditSecret,
      webhookUrl: 'https://hipotecaly.vercel.app/api/integrations/kyc/didit/webhook',
      stats: verificationStats,
      hostedFlow: true,
    },
    signature: {
      provider: process.env.SIGNATURE_PROVIDER || 'firma_gub',
      mode: (process.env.SIGNATURE_MODE || 'live').toLowerCase(),
      configured: Boolean(process.env.FIRMA_GUB_API_BASE_URL || process.env.FIRMA_GUB_BASE_URL),
    },
  });
}
