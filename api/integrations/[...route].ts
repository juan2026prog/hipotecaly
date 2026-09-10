// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/integrations/[...route]
// Punto de entrada oficial para KYC (Didit API v3), Firma Digital (Firma.gub.uy) y Mocks
// ==============================================================================

import { KycService } from '../../server/identity/kycService.js';
import { SignatureService } from '../../server/signature/signatureService.js';
import { verifySuperAdmin } from '../../server/auth/superAdminGuard.js';
import { supabaseAdmin } from '../../server/supabase.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  // Aplicar Rate Limiting (60 req / min)
  try {
    const { ServerRateLimiter } = await import('../../server/security/rateLimiter.js');
    const allowed = ServerRateLimiter.applyRateLimit(req, res, {
      windowMs: 60000,
      maxRequests: 60,
    });
    if (!allowed) return;
  } catch {
    // Continuar si falla rate limiter
  }

  const rawParam = req.query?.path || req.query?.route;
  const subpath = Array.isArray(rawParam)
    ? rawParam.join('/')
    : (typeof rawParam === 'string' ? rawParam : '');

  const normalizedPath = (
    subpath ||
    (req.url ? req.url.replace(/^\/api\/integrations\/?/, '').split('?')[0] : '')
  )
    .replace(/^\[\.\.\.route\]\/?/, '')
    .toLowerCase()
    .replace(/\/$/, '');

  // ----------------------------------------------------------------------------
  // 1. KYC ENDPOINTS (Didit API v3 & Mocks)
  // ----------------------------------------------------------------------------

  // POST /api/integrations/kyc/session
  if (normalizedPath === 'kyc/session' && req.method === 'POST') {
    try {
      const {
        tenantId = 'a0000000-0000-0000-0000-000000000001',
        userId,
        caseId,
        documentType,
        country,
        vendorData,
        callbackUrl,
      } = req.body || {};

      const session = await KycService.createSession({
        tenantId,
        userId,
        caseId,
        documentType,
        country,
        vendorData,
        callbackUrl,
      });

      return res.status(200).json({
        success: true,
        session,
      });
    } catch (err: any) {
      return res.status(500).json({
        error: 'Error al iniciar sesión de verificación KYC',
        message: err?.message,
      });
    }
  }

  // GET /api/integrations/kyc/status
  if (normalizedPath === 'kyc/status' && req.method === 'GET') {
    const sessionId = (req.query?.sessionId || req.query?.session_id) as string;
    const caseId = (req.query?.caseId || req.query?.case_id) as string;
    const userId = (req.query?.userId || req.query?.user_id) as string;

    if (!sessionId && !caseId && !userId) {
      return res.status(400).json({ error: 'Falta parámetro sessionId, caseId o userId' });
    }
    try {
      const status = await KycService.getStatus({ sessionId, caseId, userId });
      return res.status(200).json({ success: true, verification: status });
    } catch (err: any) {
      return res.status(500).json({ error: 'Error al consultar estado KYC', message: err?.message });
    }
  }

  // POST /api/integrations/kyc/didit/webhook
  if (normalizedPath === 'kyc/didit/webhook' && req.method === 'POST') {
    try {
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const result = await KycService.handleDiditWebhook(rawBody, req.headers || {});
      return res.status(200).json({ status: 'ok', result });
    } catch (err: any) {
      if (err?.message?.includes('Signature') || err?.message?.includes('HMAC')) {
        return res.status(401).json({ error: 'Unauthorized webhook signature', message: err.message });
      }
      return res.status(500).json({ error: 'Error procesando webhook de Didit', message: err?.message });
    }
  }

  // POST /api/integrations/kyc/reconcile (Decision API Polling / Refresh)
  if (normalizedPath === 'kyc/reconcile' && req.method === 'POST') {
    const { sessionId } = req.body || {};
    if (!sessionId) {
      return res.status(400).json({ error: 'Falta parámetro sessionId' });
    }
    try {
      const result = await KycService.reconcileDecision(sessionId);
      return res.status(200).json({ success: true, result });
    } catch (err: any) {
      return res.status(500).json({ error: 'Error al reconciliar decisión', message: err?.message });
    }
  }

  // POST /api/integrations/kyc/test-force (Super Admin QA Tool)
  if (normalizedPath === 'kyc/test-force' && req.method === 'POST') {
    const auth = await verifySuperAdmin(req);
    if (!auth.authorized) {
      return res.status(auth.status || 401).json({ error: auth.error });
    }

    const { sessionId, forcedStatus, reason } = req.body || {};
    if (!sessionId || !forcedStatus) {
      return res.status(400).json({ error: 'Faltan parámetros sessionId o forcedStatus' });
    }

    try {
      const updated = await KycService.forceKycTestResult({
        adminId: auth.adminId || 'superadmin-master',
        sessionId,
        forcedStatus,
        reason,
      });
      return res.status(200).json({ success: true, updated });
    } catch (err: any) {
      return res.status(400).json({ error: 'No se pudo forzar estado', message: err?.message });
    }
  }

  // ----------------------------------------------------------------------------
  // 2. SIGNATURE ENDPOINTS
  // ----------------------------------------------------------------------------

  // POST /api/integrations/signature/create-process
  if (normalizedPath === 'signature/create-process' && req.method === 'POST') {
    try {
      const {
        tenantId = 'a0000000-0000-0000-0000-000000000001',
        caseId,
        documentIds = [],
        signers = [],
        expiresAt,
      } = req.body || {};

      if (!caseId || documentIds.length === 0) {
        return res.status(400).json({ error: 'Se requieren caseId y documentIds.' });
      }

      const process = await SignatureService.createProcessFromDocFlow({
        tenantId,
        caseId,
        documentIds,
        signers,
        expiresAt,
      });

      return res.status(200).json({ success: true, process });
    } catch (err: any) {
      return res.status(500).json({ error: 'Error al crear proceso de firma', message: err?.message });
    }
  }

  // POST / GET /api/integrations/signature/firma-gub/webhook (o notification)
  if (
    (normalizedPath === 'signature/firma-gub/webhook' ||
      normalizedPath === 'signature/firma-gub/notification') &&
    (req.method === 'POST' || req.method === 'GET')
  ) {
    try {
      const result = await SignatureService.handleFirmaGubNotification({
        body: req.body,
        query: req.query,
        headers: req.headers,
        method: req.method,
      });

      if (!result.handled && (result as any).error === 'MISSING_IDENTIFIER') {
        return res.status(400).json({ error: 'Bad Request', result });
      }

      return res.status(200).json({ status: 'ok', result });
    } catch (err: any) {
      return res.status(500).json({
        error: 'Error procesando notificación de Firma.gub.uy',
        message: err?.message,
      });
    }
  }

  // POST /api/integrations/signature/mock-sign
  if (normalizedPath === 'signature/mock-sign' && req.method === 'POST') {
    const { processId, signerIndex = 0, evidenceNote } = req.body || {};
    if (!processId) {
      return res.status(400).json({ error: 'Falta parámetro processId' });
    }

    try {
      const result = await SignatureService.executeMockSign({
        processId,
        signerIndex: Number(signerIndex),
        evidenceNote,
      });
      return res.status(200).json({ success: true, result });
    } catch (err: any) {
      return res.status(500).json({ error: 'Error al ejecutar firma simulada', message: err?.message });
    }
  }

  // GET /api/integrations/signature/health
  if (normalizedPath === 'signature/health' && req.method === 'GET') {
    const { FirmaGubClient } = await import('../../server/signature/firmaGubClient.js');
    const client = new FirmaGubClient();
    const health = await client.checkHealth();
    return res.status(200).json({
      success: true,
      health,
    });
  }

  // ----------------------------------------------------------------------------
  // 3. ADMIN SETTINGS & HEALTH ENDPOINT
  // ----------------------------------------------------------------------------

  // GET /api/integrations/admin/settings
  if (normalizedPath === 'admin/settings' && req.method === 'GET') {
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
          ? `${rawWorkflow.slice(0, 4)}••••••••${rawWorkflow.slice(-4)}`
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
                ? `${v.provider_session_id.slice(0, 8)}...${v.provider_session_id.slice(-4)}`
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

  // ----------------------------------------------------------------------------
  // 4. GOOGLE CALENDAR ENDPOINTS (Incremental OAuth, Sync & Disconnect)
  // ----------------------------------------------------------------------------

  // GET /api/integrations/calendar/auth-url
  if (normalizedPath === 'calendar/auth-url' && req.method === 'GET') {
    const { userId = 'usr_test_default', orgId = 'd0000000-0000-0000-0000-000000000001', redirectUri } = req.query || {};
    const { GoogleCalendarServerService } = await import('../../server/calendar/googleCalendarServerService.js');
    const result = GoogleCalendarServerService.generateAuthUrl({
      userId: String(userId),
      orgId: String(orgId),
      redirectUri: redirectUri ? String(redirectUri) : undefined,
    });
    return res.status(200).json({ success: true, ...result });
  }

  // POST /api/integrations/calendar/callback
  if (normalizedPath === 'calendar/callback' && req.method === 'POST') {
    const { code, state, redirectUri } = req.body || {};
    if (!code || !state) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos: code o state' });
    }
    const { GoogleCalendarServerService } = await import('../../server/calendar/googleCalendarServerService.js');
    const result = await GoogleCalendarServerService.handleAuthCallback({
      code: String(code),
      state: String(state),
      redirectUri: redirectUri ? String(redirectUri) : undefined,
    });
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(200).json(result);
  }

  // GET /api/integrations/calendar/status
  if (normalizedPath === 'calendar/status' && req.method === 'GET') {
    const userId = req.query?.userId as string;
    if (!userId) {
      return res.status(400).json({ error: 'Falta parámetro userId' });
    }
    const { GoogleCalendarServerService } = await import('../../server/calendar/googleCalendarServerService.js');
    const status = await GoogleCalendarServerService.getIntegrationStatus(userId);
    return res.status(200).json({ success: true, ...status });
  }

  // POST /api/integrations/calendar/sync-event
  if (normalizedPath === 'calendar/sync-event' && req.method === 'POST') {
    const { userId, organizationId, action, event, googleCalendarEventId } = req.body || {};
    if (!userId || !organizationId || !action || !event) {
      return res.status(400).json({ error: 'Parámetros insuficientes para sincronizar evento' });
    }
    const { GoogleCalendarServerService } = await import('../../server/calendar/googleCalendarServerService.js');
    const result = await GoogleCalendarServerService.syncEventToGoogle({
      userId,
      organizationId,
      action,
      event,
      googleCalendarEventId,
    });
    return res.status(200).json(result);
  }

  // POST /api/integrations/calendar/disconnect
  if (normalizedPath === 'calendar/disconnect' && req.method === 'POST') {
    const { userId, organizationId } = req.body || {};
    if (!userId) {
      return res.status(400).json({ error: 'Falta parámetro userId' });
    }
    const { GoogleCalendarServerService } = await import('../../server/calendar/googleCalendarServerService.js');
    await GoogleCalendarServerService.disconnect(userId, organizationId || 'd0000000-0000-0000-0000-000000000001');
    return res.status(200).json({ success: true, message: 'Google Calendar desconectado exitosamente' });
  }

  // Fallback 404
  return res.status(404).json({
    error: 'Not Found',
    message: `Endpoint '/api/integrations/${normalizedPath}' no encontrado.`,
    availableEndpoints: [
      'POST /api/integrations/kyc/session',
      'GET /api/integrations/kyc/status',
      'POST /api/integrations/kyc/didit/webhook',
      'POST /api/integrations/kyc/reconcile',
      'POST /api/integrations/kyc/test-force',
      'POST /api/integrations/signature/create-process',
      'POST /api/integrations/signature/firma-gub/webhook',
      'POST /api/integrations/signature/mock-sign',
      'GET /api/integrations/signature/health',
      'GET /api/integrations/admin/settings',
      'GET /api/integrations/calendar/auth-url',
      'POST /api/integrations/calendar/callback',
      'GET /api/integrations/calendar/status',
      'POST /api/integrations/calendar/sync-event',
      'POST /api/integrations/calendar/disconnect',
    ],
  });
}
