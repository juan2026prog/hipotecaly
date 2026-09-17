// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/integrations
// Orquestador Central Serverless para KYC (Didit API v3) y Firma Digital
// Control estricto de autorización server-side, fail-closed webhooks y validación de sesiones
// ==============================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { requireAuth, requireRole, requireApplicationAccess } from '../server/security/authGuards.js';

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

      const { applicationId, caseId } = bodyData || {};

      if (!applicationId) {
        return res.status(400).json({ error: 'Falta applicationId en el body.' });
      }

      // 1. Autorización Server-Side Estricta sobre el expediente
      const appGuard = await requireApplicationAccess(req, applicationId);
      if (!appGuard.authorized || !appGuard.data) {
        return res.status(appGuard.status || 403).json({
          success: false,
          error: appGuard.error || 'Acceso denegado: No tienes autorización sobre este expediente.',
        });
      }

      const { auth: callerAuth, application: app } = appGuard.data;
      const targetUserId = callerAuth.userId;
      const isDemoOrg = app.organization_id === 'd0000000-0000-0000-0000-000000000001' || applicationId.includes('demo');

      // 2. Consultar autoritativamente KYC status en identity_verifications
      let isVerified = false;

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
      const { error: updateErr } = await supabaseAdmin
        .from('applications')
        .update({
          status: 'submitted',
          submitted_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', applicationId);

      if (updateErr) {
        return res.status(500).json({
          success: false,
          error: 'DATABASE_ERROR',
          message: 'Error al actualizar el estado de la solicitud.',
        });
      }

      await supabaseAdmin.from('application_status_history').insert({
        application_id: applicationId,
        from_status: 'draft',
        to_status: 'submitted',
        notes: `Solicitud enviada formalmente por usuario ${targetUserId} vía Serverless Gate con KYC verificado`,
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
      const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';

      const isDemoModeReq = !isProd && (kycMode === 'mock' || kycMode === 'demo' || bodyData?.isDemo || bodyData?.mode === 'demo');

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

      // Validar autenticación server-side para sesiones de verificación reales
      const authGuard = await requireAuth(req);
      if (!authGuard.authorized || !authGuard.data) {
        return res.status(authGuard.status || 401).json({
          error: authGuard.error || 'Autenticación requerida para iniciar sesión de verificación KYC.',
        });
      }

      const effectiveUserId = authGuard.data.userId;
      const effectiveTenantId = authGuard.data.organizationId || tenantId;

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

      const opaqueVendorData = vendorData || (caseId ? `case_${caseId}` : `kyc_${effectiveUserId}_${Date.now()}`);

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
          tenant_id: effectiveTenantId,
          user_id: effectiveUserId,
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

      // Validar autenticación
      const authGuard = await requireAuth(req);
      if (!authGuard.authorized || !authGuard.data) {
        return res.status(authGuard.status || 401).json({
          error: authGuard.error || 'Autenticación requerida para consultar estado KYC.',
        });
      }

      let query = supabaseAdmin.from('identity_verifications').select('*');
      if (sessionId) {
        query = query.eq('provider_session_id', sessionId);
      } else if (caseId) {
        // Validar propiedad del caso/expediente antes de responder
        if (!authGuard.data.isSuperAdmin) {
          const { data: appData } = await supabaseAdmin
            .from('applications')
            .select('organization_id, borrower_id')
            .or(`id.eq.${caseId},public_id.eq.${caseId}`)
            .maybeSingle();

          if (appData) {
            const isOwner = appData.borrower_id === authGuard.data.userId;
            const isOrgMember = appData.organization_id === authGuard.data.organizationId;
            if (!isOwner && !isOrgMember) {
              return res.status(403).json({
                error: 'ACCESO_DENEGADO_KYC_CASE',
                message: 'No tienes autorización para consultar el estado KYC de este expediente.',
              });
            }
          }
        }
        query = query.eq('case_id', caseId).order('created_at', { ascending: false }).limit(1);
      } else if (userId) {
        // Solo Super Admin o el propio usuario pueden consultar su KYC
        if (!authGuard.data.isSuperAdmin && authGuard.data.userId !== userId) {
          return res.status(403).json({ error: 'Acceso denegado: No puedes consultar verificaciones de otro usuario.' });
        }
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

      // Validar pertenencia del registro recuperado al caller
      if (!authGuard.data.isSuperAdmin && data.tenant_id && authGuard.data.organizationId) {
        if (data.tenant_id !== authGuard.data.organizationId && data.user_id !== authGuard.data.userId) {
          return res.status(403).json({ error: 'Acceso denegado a este registro de verificación KYC.' });
        }
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
      const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';

      // 1. FAIL-CLOSED: Validación de secreto y firma HMAC
      if (!secret) {
        if (isProd) {
          return res.status(500).json({
            error: 'INTEGRATION_NOT_CONFIGURED',
            message: 'DIDIT_WEBHOOK_SECRET no está configurada en el servidor (Fail-Closed).',
          });
        }
      }

      if (secret || signature || isProd) {
        if (!secret) {
          return res.status(500).json({
            error: 'INTEGRATION_NOT_CONFIGURED',
            message: 'DIDIT_WEBHOOK_SECRET no configurada.',
          });
        }

        if (!signature) {
          return res.status(401).json({
            error: 'INVALID_HMAC_SIGNATURE',
            message: 'Encabezado de firma HMAC ausente.',
          });
        }

        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(rawBody);
        const calculated = hmac.digest('hex');

        let isMatch = false;
        try {
          const bufCalc = Buffer.from(calculated, 'hex');
          const bufSig = Buffer.from(signature, 'hex');
          isMatch = bufCalc.length === bufSig.length && crypto.timingSafeEqual(bufCalc, bufSig);
        } catch {
          isMatch = false;
        }

        if (!isMatch) {
          return res.status(401).json({
            error: 'INVALID_HMAC_SIGNATURE',
            message: 'Firma HMAC inválida.',
          });
        }
      }

      let payload: any;
      try {
        payload = typeof req.body === 'object' ? req.body : JSON.parse(rawBody);
      } catch {
        return res.status(400).json({ error: 'INVALID_JSON_PAYLOAD', message: 'Payload inválido o corrupto.' });
      }

      const sessionId = payload.session_id || payload.sessionId || payload.id;
      const eventType = payload.event || payload.action || payload.type || 'status.updated';
      const eventId = (req.headers['x-event-id'] as string) || payload.event_id || payload.id || `evt_${sessionId}_${Date.now()}`;
      
      const rawStatus = (
        payload.status ||
        payload.decision ||
        payload.workflow_status ||
        payload.verification?.status ||
        payload.session?.status ||
        'in_progress'
      ).toString().toLowerCase().trim();

      // 2. Comprobar Idempotencia Autoritativa en DB (provider_webhook_events)
      try {
        const { data: existingEvt } = await supabaseAdmin
          .from('provider_webhook_events')
          .select('processed')
          .eq('provider', 'didit')
          .eq('event_id', eventId)
          .maybeSingle();

        if (existingEvt?.processed) {
          return res.status(200).json({ status: 'ok', sessionId, event: eventType, duplicate: true });
        }
      } catch {}

      // 3. Mapeo Autoritativo de Estados Didit v3 -> HIPOTECALY
      let mappedStatus = 'in_progress';
      if (['approved', 'verified', 'passed', 'success'].includes(rawStatus)) {
        mappedStatus = 'verified';
      } else if (['declined', 'failed', 'rejected'].includes(rawStatus)) {
        mappedStatus = 'failed';
      } else if (['in review', 'in_review', 'pending review', 'pending_review', 'review'].includes(rawStatus)) {
        mappedStatus = 'pending_review';
      } else if (['resubmission required', 'resubmission_required', 'resubmission_requested', 'resubmit', 'resubmitted'].includes(rawStatus)) {
        mappedStatus = 'resubmission_required';
      } else if (['expired'].includes(rawStatus)) {
        mappedStatus = 'expired';
      } else if (['created', 'pending'].includes(rawStatus)) {
        mappedStatus = 'created';
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
              mode: (process.env.KYC_MODE || 'sandbox').toLowerCase().trim(),
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
      const authGuard = await requireRole(req, ['super_admin', 'tenant_admin', 'platform_admin']);
      if (!authGuard.authorized) {
        return res.status(authGuard.status || 403).json({
          error: authGuard.error || 'Acceso denegado: Se requieren permisos administrativos.',
        });
      }

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

    // --------------------------------------------------------------------------
    // 5. GET /api/integrations/signature/status
    // --------------------------------------------------------------------------
    if (cleanPath.includes('signature') && cleanPath.includes('status') && req.method === 'GET') {
      const processId = (req.query?.processId || req.query?.process_id || req.query?.id) as string;
      if (!processId) {
        return res.status(400).json({ error: 'Falta parámetro processId' });
      }

      const { data: proc, error: pErr } = await supabaseAdmin
        .from('signature_processes')
        .select(`*, documents:signature_documents(*), signers:signature_signers(*)`)
        .or(`id.eq.${processId},provider_process_id.eq.${processId}`)
        .maybeSingle();

      if (pErr || !proc) {
        return res.status(404).json({
          error: 'PROCESS_NOT_FOUND',
          message: 'El proceso de firma no fue encontrado en el sistema.',
        });
      }

      return res.status(200).json({
        success: true,
        process: proc,
      });
    }

    // --------------------------------------------------------------------------
    // 6. GET /api/integrations/ai/status y POST /api/integrations/ai/test
    // --------------------------------------------------------------------------
    if (cleanPath.includes('ai')) {
      const apiKey = process.env.OPENAI_API_KEY;
      const isEnabled = process.env.AI_ENABLED !== 'false';

      if (!isEnabled) {
        return res.status(200).json({
          configured: Boolean(apiKey),
          active: false,
          status: 'DISABLED',
          provider: 'OpenAI',
          message: 'El servicio de IA se encuentra desactivado administrativamente.',
        });
      }

      if (!apiKey || apiKey.trim().length === 0) {
        return res.status(200).json({
          configured: false,
          active: false,
          status: 'NOT_CONFIGURED',
          provider: 'OpenAI',
          message: 'OPENAI_API_KEY no está configurada en el entorno del servidor.',
        });
      }

      return res.status(200).json({
        configured: true,
        active: true,
        status: 'HEALTHY',
        provider: 'OpenAI',
        models: {
          extraction: process.env.OPENAI_MODEL_EXTRACTION || 'gpt-4o-mini',
          reasoning: process.env.OPENAI_MODEL_REASONING || 'gpt-4o',
          deep: process.env.OPENAI_MODEL_DEEP || 'o3-mini',
          embeddings: 'text-embedding-3-small',
        },
      });
    }

    // --------------------------------------------------------------------------
    // 7. GET /api/integrations/calendar/status
    // --------------------------------------------------------------------------
    if (cleanPath.includes('calendar')) {
      const gcalClientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
      const configured = Boolean(gcalClientId && gcalClientId.trim().length > 0);

      return res.status(200).json({
        configured,
        provider: 'google_calendar',
        status: configured ? 'PARTIAL' : 'NOT_CONFIGURED',
        message: configured
          ? 'Google Calendar disponible mediante sincronización OAuth individual y enlaces directos.'
          : 'GOOGLE_CALENDAR_CLIENT_ID no configurado.',
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

