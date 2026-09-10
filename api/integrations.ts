// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/integrations
// Orquestador Central Serverless para KYC (Didit API v3) y Firma Digital
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

  const rawUrl = req.url || '';
  const cleanPath = rawUrl.split('?')[0].toLowerCase();

  try {
    // --------------------------------------------------------------------------
    // 0. POST /api/integrations/applications/submit (Backend Submission Gate)
    // --------------------------------------------------------------------------
    if (cleanPath.includes('applications/submit') && req.method === 'POST') {
      let bodyData = req.body;
      if (typeof bodyData === 'string') {
        try {
          bodyData = JSON.parse(bodyData);
        } catch {
          bodyData = {};
        }
      }

      const { applicationId, userId, caseId } = bodyData || {};

      if (!applicationId) {
        return res.status(400).json({ error: 'Falta applicationId en el body.' });
      }

      // 1. Obtener la solicitud desde PostgreSQL
      const { data: app, error: appErr } = await supabaseAdmin
        .from('applications')
        .select('id, public_id, organization_id, status')
        .eq('id', applicationId)
        .maybeSingle();

      if (appErr || !app) {
        return res.status(404).json({ error: 'Solicitud no encontrada.' });
      }

      const isDemoOrg = app.organization_id === 'd0000000-0000-0000-0000-000000000001' || applicationId.includes('demo');

      // 2. Consultar autoritativamente KYC status en identity_verifications
      let isVerified = false;
      const targetUserId = userId || (req.headers['x-user-id'] as string);

      if (targetUserId) {
        const { data: kycUser } = await supabaseAdmin
          .from('identity_verifications')
          .select('status')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (kycUser && (kycUser.status === 'verified' || kycUser.status === 'approved')) {
          isVerified = true;
        }
      }

      if (!isVerified && (app.public_id || caseId)) {
        const targetCase = caseId || app.public_id;
        const { data: kycCase } = await supabaseAdmin
          .from('identity_verifications')
          .select('status')
          .eq('case_id', targetCase)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (kycCase && (kycCase.status === 'verified' || kycCase.status === 'approved')) {
          isVerified = true;
        }
      }

      // 3. Bloqueo Backend Gate
      if (!isVerified && !isDemoOrg) {
        try {
          await supabaseAdmin.from('application_status_history').insert({
            application_id: applicationId,
            from_status: 'draft',
            to_status: 'draft',
            notes: 'ENVÍO FORMAL RECHAZADO POR SERVERLESS GATE: KYC_REQUIRED',
          });
        } catch {}

        return res.status(403).json({
          success: false,
          error: 'KYC_REQUIRED',
          code: 'KYC_REQUIRED',
          message: 'Necesitás verificar tu identidad antes de enviar la solicitud.',
        });
      }

      // 4. Actualización autoritativa a 'submitted'
      const nowIso = new Date().toISOString();
      await supabaseAdmin
        .from('applications')
        .update({
          status: 'submitted',
          submitted_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', applicationId);

      await supabaseAdmin.from('application_status_history').insert({
        application_id: applicationId,
        from_status: 'draft',
        to_status: 'submitted',
        notes: 'Solicitud enviada formalmente vía Serverless Gate con KYC verificado',
      });

      return res.status(200).json({
        success: true,
        applicationId,
        status: 'submitted',
        message: 'Solicitud enviada formalmente con éxito.',
      });
    }

    // --------------------------------------------------------------------------
    // 1. POST /api/integrations/kyc/session
    // --------------------------------------------------------------------------
    if (cleanPath.includes('session') && req.method === 'POST') {
      let bodyData = req.body;
      if (typeof bodyData === 'string') {
        try {
          bodyData = JSON.parse(bodyData);
        } catch {
          bodyData = {};
        }
      }

      const {
        tenantId = 'a0000000-0000-0000-0000-000000000001',
        userId,
        caseId,
        documentType = 'CI',
        country = 'UY',
        vendorData,
        callbackUrl,
      } = bodyData || {};

      const baseUrl = (
        process.env.DIDIT_BASE_URL ||
        'https://verification.didit.me'
      ).replace(/\/$/, '');

      const apiKey = process.env.DIDIT_API_KEY;
      const workflowId = process.env.DIDIT_WORKFLOW_ID;
      const kycMode = (process.env.KYC_MODE || 'sandbox').toLowerCase().trim();

      const isDemoModeReq = kycMode === 'mock' || kycMode === 'demo' || bodyData?.isDemo || bodyData?.mode === 'demo';

      if (isDemoModeReq && (!apiKey || !workflowId)) {
        const sessionId = `mock_kyc_${Date.now()}`;
        const mockUrl = `/demo/kyc-simulator?session_id=${sessionId}`;
        return res.status(200).json({
          success: true,
          session: {
            id: sessionId,
            sessionId,
            sessionUrl: mockUrl,
            provider: 'didit_demo',
            mode: 'demo',
            status: 'created',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
          },
        });
      }

      if (!apiKey) {
        return res.status(500).json({
          error: 'CONFIG_ERROR',
          message: 'DIDIT_API_KEY no está configurada en las variables de entorno de Vercel.',
        });
      }

      if (!workflowId) {
        return res.status(500).json({
          error: 'CONFIG_ERROR',
          message: 'DIDIT_WORKFLOW_ID no está configurado en las variables de entorno de Vercel.',
        });
      }

      const opaqueVendorData = vendorData || (caseId ? `case_${caseId}` : `kyc_${Date.now()}`);

      const payload: Record<string, unknown> = {
        workflow_id: workflowId,
        vendor_data: opaqueVendorData,
      };

      if (callbackUrl) {
        payload.callback = callbackUrl;
      }

      // Llamada oficial a Didit API v3 (POST https://verification.didit.me/v3/session/)
      const diditResponse = await fetch(`${baseUrl}/v3/session/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(payload),
      });

      const responseText = await diditResponse.text();

      if (!diditResponse.ok) {
        let errorParsed = responseText;
        try {
          const jsonErr = JSON.parse(responseText);
          errorParsed = jsonErr.message || jsonErr.error || responseText;
        } catch {}

        console.error('[Didit KYC] Error de Didit API:', diditResponse.status, errorParsed);

        return res.status(diditResponse.status).json({
          error: 'DIDIT_API_ERROR',
          message: `Error de Didit API (${diditResponse.status}): ${errorParsed}`,
        });
      }

      let diditData: any = {};
      try {
        diditData = JSON.parse(responseText);
      } catch (parseErr) {
        console.error('[Didit KYC] Error parseando respuesta JSON de Didit:', parseErr, responseText);
        return res.status(502).json({
          error: 'DIDIT_INVALID_RESPONSE',
          message: 'Didit API retornó una respuesta que no es JSON válido.',
          raw: responseText,
        });
      }

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
        console.error('[Didit KYC] Error persistiendo en DB:', dbErr);
      }

      return res.status(200).json({
        success: true,
        session,
      });
    }

    // --------------------------------------------------------------------------
    // 2. GET /api/integrations/kyc/status
    // --------------------------------------------------------------------------
    if (cleanPath.includes('status') && req.method === 'GET') {
      const sessionId = (req.query?.sessionId || req.query?.session_id) as string;
      const caseId = (req.query?.caseId || req.query?.case_id) as string;
      const userId = (req.query?.userId || req.query?.user_id) as string;

      if (!sessionId && !caseId && !userId) {
        return res.status(400).json({ error: 'Falta parámetro sessionId, caseId o userId' });
      }

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
            mode: (process.env.KYC_MODE || 'sandbox').toLowerCase().trim(),
          },
        });
      }

      return res.status(200).json({ success: true, verification: data });
    }

    // --------------------------------------------------------------------------
    // 3. POST /api/integrations/kyc/didit/webhook
    // --------------------------------------------------------------------------
    if (cleanPath.includes('webhook') && req.method === 'POST') {
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const signature =
        (req.headers['x-signature-v2'] ||
          req.headers['X-Signature-V2'] ||
          req.headers['x-signature'] ||
          req.headers['x-hmac-signature']) as string || '';
      const secret = process.env.DIDIT_WEBHOOK_SECRET || '';
      const kycMode = (process.env.KYC_MODE || 'sandbox').toLowerCase().trim();

      // 1. Validar firma HMAC si está configurada en producción/sandbox o si viene firma
      if (secret || (kycMode !== 'mock' && signature)) {
        if (!secret) {
          return res.status(500).json({ error: 'DIDIT_WEBHOOK_SECRET no está configurada.' });
        }

        if (!signature) {
          return res.status(401).json({ error: 'Invalid HMAC signature: Signature header missing' });
        }

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
      const eventId = (req.headers['x-event-id'] as string) || payload.event_id || payload.id || `evt_${sessionId}_${Date.now()}`;
      const rawStatus = (payload.status || payload.decision || payload.action || 'in_progress').toString().toLowerCase().trim();

      // 2. Comprobar Idempotencia
      try {
        const { data: existingEvt } = await supabaseAdmin
          .from('provider_webhook_events')
          .select('processed')
          .eq('provider', 'didit')
          .eq('event_id', eventId)
          .maybeSingle();

        if (existingEvt?.processed) {
          return res.status(200).json({ status: 'ok', sessionId, duplicate: true });
        }
      } catch {}

      // 3. Mapeo Autoritativo de Estados Didit -> HIPOTECALY
      let mappedStatus = 'in_progress';
      if (['approved', 'verified', 'passed', 'success', 'decision.approved'].includes(rawStatus)) {
        mappedStatus = 'verified';
      } else if (['declined', 'failed', 'rejected', 'decision.declined'].includes(rawStatus)) {
        mappedStatus = 'failed';
      } else if (['in_review', 'pending_review', 'review'].includes(rawStatus)) {
        mappedStatus = 'pending_review';
      } else if (['resubmission_required', 'resubmission_requested', 'resubmit'].includes(rawStatus)) {
        mappedStatus = 'resubmission_required';
      } else if (['expired'].includes(rawStatus)) {
        mappedStatus = 'expired';
      }

      const nowIso = new Date().toISOString();

      if (sessionId) {
        // Actualizar registro en identity_verifications
        await supabaseAdmin
          .from('identity_verifications')
          .update({
            status: mappedStatus,
            provider_status: rawStatus,
            decision_code: payload.decision_code || payload.code || null,
            reason: payload.reason || null,
            completed_at: mappedStatus === 'verified' ? nowIso : null,
            updated_at: nowIso,
          })
          .eq('provider_session_id', sessionId);

        // Registrar auditoría omitiendo PII / fotos / biometría / secretos
        try {
          await supabaseAdmin.from('identity_verification_events').insert({
            provider: 'didit',
            event_type: `KYC_${mappedStatus.toUpperCase()}`,
            status: mappedStatus,
            metadata: {
              sessionId,
              mode: kycMode,
              providerStatus: rawStatus,
            },
          });
        } catch {}
      }

      // Registrar evento para idempotencia
      try {
        await supabaseAdmin.from('provider_webhook_events').upsert(
          {
            provider: 'didit',
            event_id: eventId,
            payload_hash: crypto.createHash('sha256').update(rawBody).digest('hex'),
            processed: true,
            processed_at: nowIso,
            status: 'processed',
          },
          { onConflict: 'provider,event_id' }
        );
      } catch {}

      return res.status(200).json({ status: 'ok', sessionId, mappedStatus, rawStatus });
    }

    // --------------------------------------------------------------------------
    // 4. GET /api/integrations/admin/settings
    // --------------------------------------------------------------------------
    if (cleanPath.includes('settings') && req.method === 'GET') {
      const hasDiditKey = Boolean(process.env.DIDIT_API_KEY);
      const hasDiditWorkflow = Boolean(process.env.DIDIT_WORKFLOW_ID);
      const hasDiditSecret = Boolean(process.env.DIDIT_WEBHOOK_SECRET);
      const kycMode = (process.env.KYC_MODE || 'sandbox').toLowerCase().trim();
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

    // Default fallback
    return res.status(200).json({
      service: 'Hipotecaly Integrations API',
      status: 'OPERATIONAL',
      path: cleanPath,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Integrations API] Server Error:', err);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: err?.message || 'Error interno en el servidor de integraciones.',
    });
  }
}
