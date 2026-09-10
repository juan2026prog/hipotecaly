// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/integrations-kyc-session
// Creación oficial de sesión Didit KYC (API v3 / Hosted Flow) y persistencia en Supabase
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

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Este endpoint solo admite solicitudes HTTP POST.',
    });
  }

  try {
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

    // 1. Llamada HTTP directa y oficial a Didit API v3
    const diditResponse = await fetch(`${baseUrl}/v3/session/`, {
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

      console.error('[Didit KYC] Error retornado por Didit API:', diditResponse.status, errorParsed);

      return res.status(diditResponse.status).json({
        error: 'DIDIT_API_ERROR',
        message: `Error de Didit API (${diditResponse.status}): ${errorParsed}`,
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
      },
    };

    // 2. Persistir en base de datos Supabase: identity_verifications
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

    // 3. Devolver sesión creada con sessionUrl real al frontend
    return res.status(200).json({
      success: true,
      session,
    });
  } catch (err: any) {
    console.error('[Didit KYC] Error inesperado en el servidor:', err);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: err?.message || 'Error inesperado al iniciar sesión de verificación KYC.',
    });
  }
}
