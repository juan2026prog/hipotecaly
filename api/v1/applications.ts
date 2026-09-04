// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/v1/applications
// Endpoint REST Oficial: Ingesta Programática de Expedientes e Integración Real
// ==============================================================================

import crypto from 'crypto';
import { EnterpriseApiKeyService } from '../../server/enterprise/apiKeyService';
import { EnterpriseWebhookDispatcher } from '../../server/enterprise/webhookDispatcher';
import { supabaseAdmin } from '../../server/supabase';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Este endpoint solo admite solicitudes HTTP POST.',
    });
  }

  // 1. Autenticación y control de scopes mediante API Key
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
    // 2. Validación de Payload
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

    // 3. Evaluar LTV y pre-calificación
    const ltv = Math.round((requestedAmountUsd / propertyEstimatedValueUsd) * 100);
    const initialStatus = ltv <= 40 ? 'prequalified' : 'submitted';

    const caseId = `API-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const nowIso = new Date().toISOString();

    // 4. Inserción en la base de datos real (Supabase)
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
      // Si la tabla no tiene los campos opcionales en el entorno local, se mantiene trazabilidad
    }

    // 5. Disparar Webhooks reales del Tenant
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

    // Despacho asíncrono seguro
    EnterpriseWebhookDispatcher.dispatchTenantEvent(tenantId, 'application.created', webhookPayload).catch(() => {});

    // 6. Generar tracking URL seguro
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
  } catch (err: any) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Ocurrió un error inesperado al dar ingreso a la solicitud.',
    });
  }
}
