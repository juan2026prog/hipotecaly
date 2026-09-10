import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifySuperAdmin } from '../../../server/auth/superAdminGuard.js';
import { supabaseAdmin } from '../../../server/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed. Use GET.' });
  }

  const auth = await verifySuperAdmin(req);
  if (!auth.authorized) {
    return res.status(auth.status || 401).json({ error: auth.error });
  }

  const kycProvider = process.env.KYC_PROVIDER || 'didit';
  const kycMode = (process.env.KYC_MODE || 'mock').toLowerCase();
  const signatureProvider = process.env.SIGNATURE_PROVIDER || 'mock';
  const signatureMode = (process.env.SIGNATURE_MODE || 'mock').toLowerCase();
  const hasDiditSecret = Boolean(process.env.DIDIT_WEBHOOK_SECRET);
  const hasDiditKey = Boolean(process.env.DIDIT_API_KEY);
  const hasDiditWorkflow = Boolean(process.env.DIDIT_WORKFLOW_ID);
  const rawWorkflow = process.env.DIDIT_WORKFLOW_ID || '';
  const workflowIdMasked = rawWorkflow
    ? (rawWorkflow.length > 8
        ? \••••••••\
        : '••••••••')
    : null;

  let lastWebhook: any = null;
  let verificationStats = {
    total: 0,
    verified: 0,
    failed: 0,
    in_progress: 0,
    pending_review: 0,
  };
  let recentSessions: any[] = [];

  try {
    const { data: wh } = await supabaseAdmin
      .from('provider_webhook_events')
      .select('event_id, status, processed, processed_at, created_at')
      .eq('provider', 'didit')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (wh) {
      lastWebhook = {
        eventId: wh.event_id,
        status: wh.status,
        processed: wh.processed,
        receivedAt: wh.processed_at || wh.created_at,
        httpStatus: wh.processed ? '200 OK' : 'En proceso',
      };
    }
  } catch {
    // Ignorar
  }

  try {
    const { data: verifs } = await supabaseAdmin
      .from('identity_verifications')
      .select('id, provider_session_id, status, mode, case_id, user_id, created_at, completed_at')
      .eq('provider', 'didit')
      .order('created_at', { ascending: false })
      .limit(20);

    if (verifs && verifs.length > 0) {
      verificationStats.total = verifs.length;
      recentSessions = verifs.slice(0, 5).map((v: any) => ({
        id: v.id,
        providerSessionId: v.provider_session_id
          ? (v.provider_session_id.length > 16
              ? \...\
              : v.provider_session_id)
          : 'N/A',
        status: v.status,
        mode: v.mode,
        caseId: v.case_id || 'N/A',
        createdAt: v.created_at,
        completedAt: v.completed_at,
      }));

      verifs.forEach((v: any) => {
        if (v.status === 'verified') verificationStats.verified++;
        else if (v.status === 'failed') verificationStats.failed++;
        else if (v.status === 'in_progress' || v.status === 'created') verificationStats.in_progress++;
        else if (v.status === 'pending_review' || v.status === 'resubmission_required') verificationStats.pending_review++;
      });
    }
  } catch {
    // Ignorar
  }

  const hasFirmaGubApiUrl = Boolean(process.env.FIRMA_GUB_API_BASE_URL || process.env.FIRMA_GUB_BASE_URL);
  const hasFirmaGubSignUrl = Boolean(process.env.FIRMA_GUB_SIGN_BASE_URL);
  const apiManagerAuthMode = process.env.FIRMA_GUB_API_MANAGER_AUTH_MODE || 'none';
  const hasApiManagerConfig =
    apiManagerAuthMode === 'none' ||
    (apiManagerAuthMode === 'bearer' && Boolean(process.env.FIRMA_GUB_API_MANAGER_BEARER_TOKEN || process.env.FIRMA_GUB_API_MANAGER_CLIENT_SECRET)) ||
    (apiManagerAuthMode === 'oauth2_client_credentials' &&
      Boolean(
        process.env.FIRMA_GUB_API_MANAGER_TOKEN_URL &&
          process.env.FIRMA_GUB_API_MANAGER_CLIENT_ID &&
          process.env.FIRMA_GUB_API_MANAGER_CLIENT_SECRET
      ));

  const kycConfigured = hasDiditKey && hasDiditSecret && hasDiditWorkflow;
  const modeLabel = kycMode === 'live' ? 'PRODUCCIÓN' : (kycMode === 'sandbox' ? 'SANDBOX' : 'DEMO');

  return res.status(200).json({
    kyc: {
      provider: kycProvider,
      mode: kycMode,
      modeLabel,
      configured: kycConfigured || kycMode === 'mock',
      status: kycConfigured ? 'OPERATIVO' : (kycMode === 'mock' ? 'DEMO' : 'NO CONFIGURADO'),
      apiKeyConfigured: hasDiditKey,
      workflowConfigured: hasDiditWorkflow,
      workflowIdMasked,
      secretConfigured: hasDiditSecret,
      webhookUrl: 'https://hipotecaly.vercel.app/api/integrations/kyc/didit/webhook',
      signatureAlgorithm: 'X-Signature-V2 (HMAC-SHA256 Timing-Safe)',
      lastWebhook,
      stats: verificationStats,
      recentSessions,
      freeTierAllowance: 'Hasta 500 verificaciones/mes según plan vigente (ID + Liveness + Face Match + Device/IP)',
      hostedFlow: true,
    },
    signature: {
      provider: signatureProvider,
      mode: signatureMode,
      configured: signatureProvider === 'mock' || (hasFirmaGubApiUrl && hasFirmaGubSignUrl),
      apiBaseUrlConfigured: hasFirmaGubApiUrl,
      signBaseUrlConfigured: hasFirmaGubSignUrl,
      apiPrefix: process.env.FIRMA_GUB_API_PREFIX || '/api/v1/externos',
      statusMethod: process.env.FIRMA_GUB_STATUS_METHOD || 'GET',
      process2Transport: process.env.FIRMA_GUB_PROCESS2_TRANSPORT || 'multipart',
      apiManagerAuthMode,
      apiManagerConfigured: hasApiManagerConfig,
      connectionStatus:
        !hasFirmaGubApiUrl || !hasFirmaGubSignUrl
          ? 'WAITING_PROVIDER_CONFIGURATION'
          : 'CONFIGURED',
    },
  });
}
