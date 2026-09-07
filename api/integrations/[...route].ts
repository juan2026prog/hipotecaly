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

  const routeParam = req.query?.route;
  const subpath = Array.isArray(routeParam)
    ? routeParam.join('/')
    : (typeof routeParam === 'string' ? routeParam : '');

  const normalizedPath = (
    subpath ||
    (req.url ? req.url.replace(/^\/api\/integrations\/?/, '').split('?')[0] : '')
  ).toLowerCase().replace(/\/$/, '');

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
    const sessionId = req.query?.sessionId as string;
    if (!sessionId) {
      return res.status(400).json({ error: 'Falta parámetro sessionId' });
    }
    try {
      const status = await KycService.getStatus(sessionId);
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
    const kycMode = process.env.KYC_MODE || 'mock';
    const signatureProvider = process.env.SIGNATURE_PROVIDER || 'mock';
    const signatureMode = process.env.SIGNATURE_MODE || 'mock';
    const hasDiditSecret = Boolean(process.env.DIDIT_WEBHOOK_SECRET);
    const hasDiditKey = Boolean(process.env.DIDIT_API_KEY);
    const hasDiditWorkflow = Boolean(process.env.DIDIT_WORKFLOW_ID);
    const hasFirmaGubApiUrl = Boolean(
      process.env.FIRMA_GUB_API_BASE_URL || process.env.FIRMA_GUB_BASE_URL
    );
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

    return res.status(200).json({
      kyc: {
        provider: kycProvider,
        mode: kycMode,
        configured: kycProvider === 'mock' || (hasDiditKey && hasDiditSecret),
        apiKeyConfigured: hasDiditKey,
        workflowConfigured: hasDiditWorkflow,
        secretConfigured: hasDiditSecret,
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
    ],
  });
}
