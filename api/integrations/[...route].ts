// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/integrations/[...route]
// Punto de entrada oficial para KYC (Didit API v3 / Hosted Flow) y Firma Digital
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

  try {
    const rawParam = req.query?.route || req.query?.path;
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

    // 1. POST /api/integrations/kyc/session
    if ((normalizedPath === 'kyc/session' || normalizedPath === 'session') && req.method === 'POST') {
      const {
        tenantId = 'a0000000-0000-0000-0000-000000000001',
        userId,
        caseId,
        documentType = 'CI',
        country = 'UY',
        vendorData,
        callbackUrl,
      } = req.body || {};

      const baseUrl = (
        process.env.DIDIT_BASE_URL ||
        'https://verification.didit.me'
      ).replace(/\/$/, '');

      const apiKey = process.env.DIDIT_API_KEY;
      const workflowId = process.env.DIDIT_WORKFLOW_ID;
      const kycMode = process.env.KYC_MODE || 'live';

      if (!apiKey) {
        return res.status(500).json({
          error: 'CONFIG_ERROR',
          message: 'DIDIT_API_KEY no está configurada en las variables de entorno del servidor.',
        });
      }

      if (!workflowId) {
        return res.status(500).json({
          error: 'CONFIG_ERROR',
          message: 'DIDIT_WORKFLOW_ID no está configurado en las variables de entorno del servidor.',
        });
      }

      const opaqueVendorData = vendorData || (caseId ? case_\ : kyc_\);

      const payload: Record<string, unknown> = {
        workflow_id: workflowId,
        vendor_data: opaqueVendorData,
      };

      if (callbackUrl) {
        payload.callback = callbackUrl;
      }

      // Llamada oficial a Didit API v3 (POST https://verification.didit.me/v3/session/)
      const diditResponse = await fetch(\/v3/session/, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!diditResponse.ok) {
        const errorText = await diditResponse.text();
        let errorParsed = errorText;
        try {
          const jsonErr = JSON.parse(errorText);
          errorParsed = jsonErr.message || jsonErr.error || errorText;
        } catch {}

        console.error('[Didit KYC] Error de Didit API:', diditResponse.status, errorParsed);

        return res.status(diditResponse.status).json({
          error: 'DIDIT_API_ERROR',
          message: Error de Didit API (\): \,
        });
      }

      const diditData: any = await diditResponse.json();
      const sessionId = diditData.session_id || diditData.id;
      const sessionUrl = diditData.url;
      const nowIso = new Date().toISOString();

      const session = {
        id: sessionId,
        sessionId,
        sessionUrl,
        provider: 'didit',
        mode: kycMode,
        status: 'created',
        createdAt: diditData.created_at || nowIso,
        expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        metadata: {
          workflowId: diditData.workflow_id || workflowId,
          vendorData: opaqueVendorData,
          documentType,
          country,
          diditSessionId: sessionId,
        },
      };

      // Persistir en Supabase identity_verifications
      try {
        await supabaseAdmin.from('identity_verifications').insert({
          tenant_id: tenantId,
          user_id: userId || null,
          case_id: caseId || null,
          provider: 'didit',
          provider_session_id: sessionId,
          session_url: sessionUrl,
          mode: kycMode,
          status: 'created',
          expires_at: session.expiresAt,
          metadata: session.metadata,
          created_at: nowIso,
          updated_at: nowIso,
        });
      } catch (dbErr) {
        console.error('[Didit KYC] Error guardando verificación en DB:', dbErr);
      }

      return res.status(200).json({
        success: true,
        session,
      });
    }

    // 2. GET /api/integrations/kyc/status
    if ((normalizedPath === 'kyc/status' || normalizedPath === 'status') && req.method === 'GET') {
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

    // 3. POST /api/integrations/kyc/didit/webhook
    if ((normalizedPath === 'kyc/didit/webhook' || normalizedPath === 'didit/webhook') && req.method === 'POST') {
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
    }

    // 4. GET /api/integrations/admin/settings
    if ((normalizedPath === 'admin/settings' || normalizedPath === 'settings') && req.method === 'GET') {
      const hasDiditKey = Boolean(process.env.DIDIT_API_KEY);
      const hasDiditWorkflow = Boolean(process.env.DIDIT_WORKFLOW_ID);
      const hasDiditSecret = Boolean(process.env.DIDIT_WEBHOOK_SECRET);
      const kycMode = (process.env.KYC_MODE || 'live').toLowerCase();

      return res.status(200).json({
        kyc: {
          provider: 'didit',
          mode: kycMode,
          configured: hasDiditKey && hasDiditWorkflow && hasDiditSecret,
          apiKeyConfigured: hasDiditKey,
          workflowConfigured: hasDiditWorkflow,
          secretConfigured: hasDiditSecret,
          hostedFlow: true,
        },
      });
    }

    // Fallback info / status
    return res.status(200).json({
      service: 'Hipotecaly Integrations API',
      status: 'OPERATIONAL',
      normalizedPath,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  } catch (globalErr: any) {
    console.error('[Integrations API] Fatal error:', globalErr);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: globalErr?.message || 'Error interno en el servidor de integraciones',
    });
  }
}
