// ==============================================================================
// VERCEL CONSOLIDATED SERVERLESS FUNCTION: /api/v1/[...route]
// Punto de entrada REST oficial para todos los endpoints de API v1 de HIPOTECALY
// ==============================================================================

import crypto from 'crypto';
import { EnterpriseApiKeyService } from '../../server/enterprise/apiKeyService';
import { EnterpriseWebhookDispatcher } from '../../server/enterprise/webhookDispatcher';
import { supabaseAdmin } from '../../server/supabase';

// ------------------------------------------------------------------------------
// 1. HANDLER: Simulación Hipotecaria Paramétrica (/api/v1/simulations)
// ------------------------------------------------------------------------------
export async function simulationsHandler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Este endpoint solo admite solicitudes HTTP POST.',
    });
  }

  const authHeader = req.headers?.authorization || req.headers?.['x-api-key'];
  const auth = await EnterpriseApiKeyService.authenticateApiKey(authHeader, 'read:simulations');

  if (!auth.authenticated) {
    return res.status(auth.statusCode).json({
      error: 'Unauthorized',
      message: auth.error,
    });
  }

  const tenantId = auth.tenantId!;

  try {
    const {
      propertyValueUsd,
      requestedAmountUsd,
      termMonths = 36,
      propertyDepartment = 'Montevideo',
      propertyType = 'casa',
    } = req.body || {};

    if (!propertyValueUsd || typeof propertyValueUsd !== 'number' || propertyValueUsd <= 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'El campo propertyValueUsd es obligatorio y debe ser un número positivo.',
      });
    }

    if (!requestedAmountUsd || typeof requestedAmountUsd !== 'number' || requestedAmountUsd <= 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'El campo requestedAmountUsd es obligatorio y debe ser un número positivo.',
      });
    }

    if (termMonths < 6 || termMonths > 240) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'El plazo termMonths debe ubicarse entre 6 y 240 meses.',
      });
    }

    let maxLtv = 40.0;
    let baseRate = 11.5;

    try {
      const { data: policyData } = await supabaseAdmin
        .from('underwriting_policies')
        .select('max_ltv, default_interest_rate')
        .eq('organization_id', tenantId)
        .maybeSingle();

      if (policyData) {
        if (typeof policyData.max_ltv === 'number') maxLtv = policyData.max_ltv;
        if (typeof policyData.default_interest_rate === 'number') baseRate = policyData.default_interest_rate;
      }
    } catch {
      // Defaults
    }

    const ltvPct = Math.round((requestedAmountUsd / propertyValueUsd) * 100);
    const maxAllowedLoanUsd = Math.round(propertyValueUsd * (maxLtv / 100));

    if (ltvPct > maxLtv) {
      return res.status(422).json({
        valid: false,
        ltvPct,
        maxAllowedLoanUsd,
        appliedPolicy: {
          maxLtvAllowed: maxLtv,
          annualInterestRatePct: baseRate,
        },
        rejectionReason: `El LTV solicitado (${ltvPct}%) excede la política crediticia máxima configurada (${maxLtv}%).`,
      });
    }

    const monthlyRate = baseRate / 100 / 12;
    const monthlyPayment = Math.round(
      (requestedAmountUsd * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
        (Math.pow(1 + monthlyRate, termMonths) - 1)
    );

    return res.status(200).json({
      valid: true,
      ltvPct,
      maxAllowedLoanUsd,
      estimatedMonthlyPaymentUsd: monthlyPayment,
      annualInterestRatePct: baseRate,
      propertyDetails: {
        department: propertyDepartment,
        propertyType,
      },
    });
  } catch {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'No se pudo procesar la simulación en este momento.',
    });
  }
}

// ------------------------------------------------------------------------------
// 2. HANDLER: Ingesta Programática de Expedientes (/api/v1/applications)
// ------------------------------------------------------------------------------
export async function applicationsHandler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Este endpoint solo admite solicitudes HTTP POST.',
    });
  }

  const authHeader = req.headers?.authorization || req.headers?.['x-api-key'];
  const auth = await EnterpriseApiKeyService.authenticateApiKey(authHeader, 'write:applications');

  if (!auth.authenticated) {
    return res.status(auth.statusCode).json({
      error: 'Unauthorized',
      message: auth.error,
    });
  }

  const tenantId = auth.tenantId!;

  try {
    const {
      borrowerName,
      borrowerEmail,
      borrowerPhone,
      requestedAmountUsd,
      propertyEstimatedValueUsd,
      propertyDepartment = 'Montevideo',
      propertyPadron,
    } = req.body || {};

    if (!borrowerName || typeof borrowerName !== 'string' || borrowerName.trim().length < 3) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'El nombre del solicitante (borrowerName) es obligatorio.',
      });
    }

    if (!borrowerEmail || !borrowerEmail.includes('@')) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'El correo electrónico (borrowerEmail) es obligatorio y debe tener formato válido.',
      });
    }

    if (!requestedAmountUsd || typeof requestedAmountUsd !== 'number' || requestedAmountUsd <= 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'El monto solicitado (requestedAmountUsd) debe ser un número positivo.',
      });
    }

    if (!propertyEstimatedValueUsd || typeof propertyEstimatedValueUsd !== 'number' || propertyEstimatedValueUsd <= 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'El valor estimado del inmueble (propertyEstimatedValueUsd) debe ser un número positivo.',
      });
    }

    const ltv = Math.round((requestedAmountUsd / propertyEstimatedValueUsd) * 100);
    const initialStatus = ltv <= 40 ? 'prequalified' : 'submitted';

    const caseId = `API-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const nowIso = new Date().toISOString();

    let dbPersisted = false;
    try {
      const { error: insertError } = await supabaseAdmin.from('applications').insert({
        id: caseId,
        organization_id: tenantId,
        applicant_name: borrowerName.trim(),
        applicant_email: borrowerEmail.trim().toLowerCase(),
        applicant_phone: borrowerPhone ? String(borrowerPhone).trim() : null,
        amount: requestedAmountUsd,
        property_value: propertyEstimatedValueUsd,
        property_department: propertyDepartment,
        property_padron: propertyPadron ? String(propertyPadron).trim() : null,
        status: initialStatus,
        source: 'REST_API_V1',
        created_at: nowIso,
        updated_at: nowIso,
      });

      if (!insertError) {
        dbPersisted = true;
      }
    } catch {
      // Fallback
    }

    const webhookPayload = {
      caseId,
      tenantId,
      status: initialStatus,
      applicantName: borrowerName,
      requestedAmountUsd,
      propertyEstimatedValueUsd,
      propertyDepartment,
      propertyPadron: propertyPadron || null,
      submittedAt: nowIso,
    };

    EnterpriseWebhookDispatcher.dispatchTenantEvent(tenantId, 'application.created', webhookPayload).catch(() => {});

    const trackingUrl = `https://hipotecaly.vercel.app/mi-cuenta?caseId=${caseId}`;

    return res.status(201).json({
      success: true,
      caseId,
      tenantId,
      status: initialStatus,
      submittedAt: nowIso,
      accessTrackingUrl: trackingUrl,
      dbPersisted,
    });
  } catch {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ocurrió un error inesperado al dar ingreso a la solicitud.',
    });
  }
}

// ------------------------------------------------------------------------------
// 3. HANDLER: Suscripción a Webhooks (/api/v1/webhooks)
// ------------------------------------------------------------------------------
export async function webhooksHandler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  const authHeader = req.headers?.authorization || req.headers?.['x-api-key'];
  const auth = await EnterpriseApiKeyService.authenticateApiKey(authHeader, 'admin:webhooks');

  if (!auth.authenticated) {
    return res.status(auth.statusCode).json({
      error: 'Unauthorized',
      message: auth.error,
    });
  }

  const tenantId = auth.tenantId!;

  if (req.method === 'POST') {
    try {
      const { url, events = ['application.created'] } = req.body || {};

      if (!url || typeof url !== 'string') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'El campo url es obligatorio y debe ser una URL válida.',
        });
      }

      if (!Array.isArray(events) || events.length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'El array events debe contener al menos un evento suscrito.',
        });
      }

      const ssrfCheck = EnterpriseWebhookDispatcher.validateUrlForSsrf(url);
      if (!ssrfCheck.valid) {
        return res.status(400).json({
          error: 'Bad Request',
          message: `URL no permitida por seguridad: ${ssrfCheck.reason}`,
        });
      }

      const webhook = await EnterpriseWebhookDispatcher.registerWebhook({
        tenantId,
        url,
        events,
      });

      return res.status(201).json({
        success: true,
        webhookId: webhook.id,
        tenantId: webhook.tenantId,
        url: webhook.url,
        events: webhook.events,
        signingSecret: webhook.signingSecret,
        createdAt: webhook.createdAt,
        message: 'Webhook registrado exitosamente. Guarde el signingSecret de forma segura para validar firmas HMAC-SHA256.',
      });
    } catch (err: any) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: err?.message || 'Error al registrar el webhook.',
      });
    }
  }

  return res.status(405).json({
    error: 'Method Not Allowed',
    message: 'Método no permitido.',
  });
}

// ------------------------------------------------------------------------------
// ROUTER PRINCIPAL DE API V1
// ------------------------------------------------------------------------------
export default async function handler(req: any, res: any) {
  const routeParam = req.query?.route;
  const subpath = Array.isArray(routeParam)
    ? routeParam.join('/')
    : (typeof routeParam === 'string' ? routeParam : '');

  const normalizedPath = (
    subpath ||
    (req.url ? req.url.replace(/^\/api\/v1\/?/, '').split('?')[0] : '')
  ).toLowerCase().replace(/\/$/, '');

  if (normalizedPath === 'simulations') {
    return simulationsHandler(req, res);
  }

  if (normalizedPath === 'applications') {
    return applicationsHandler(req, res);
  }

  if (normalizedPath === 'webhooks') {
    return webhooksHandler(req, res);
  }

  return res.status(404).json({
    error: 'Not Found',
    message: `Endpoint '/api/v1/${normalizedPath}' no encontrado.`,
    availableEndpoints: [
      'POST /api/v1/simulations',
      'POST /api/v1/applications',
      'POST /api/v1/webhooks',
    ],
  });
}
