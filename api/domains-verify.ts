// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/domains-verify
// Verificación Server-Side Real de Dominios y SSL con Vercel API / DNS
// ==============================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../server/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed', message: 'Solo se admite POST.' });
  }

  const { organizationId, domainId } = req.body || {};

  if (!organizationId || !domainId) {
    return res.status(400).json({ error: 'Bad Request', message: 'organizationId y domainId son obligatorios.' });
  }

  try {
    // 1. Obtener registro de dominio
    const { data: domData, error: domError } = await supabaseAdmin
      .from('organization_domains')
      .select('*')
      .eq('id', domainId)
      .eq('organization_id', organizationId)
      .single();

    if (domError || !domData) {
      return res.status(404).json({ error: 'Not Found', message: 'Dominio no encontrado para esta organización.' });
    }

    const domainName = domData.domain;

    // 2. Verificar disponibilidad de credenciales Vercel Server-Side
    const vercelToken = process.env.VERCEL_TOKEN;
    const vercelProjectId = process.env.VERCEL_PROJECT_ID;
    const vercelTeamId = process.env.VERCEL_TEAM_ID;

    // Si NO están configuradas las credenciales de Vercel en el entorno server-side:
    if (!vercelToken || !vercelProjectId) {
      const pendingMessage = 'Integración de dominios pendiente de configuración en Vercel (se requieren variables server-side VERCEL_PROJECT_ID y VERCEL_TOKEN).';

      await supabaseAdmin
        .from('organization_domains')
        .update({
          status: 'dns_pending',
          last_checked_at: new Date().toISOString(),
          last_error: pendingMessage,
        })
        .eq('id', domainId);

      await supabaseAdmin.from('tenant_audit_logs').insert({
        tenant_id: organizationId,
        action: 'domain_verification_requested',
        changes: {
          domain: domainName,
          status: 'dns_pending',
          configured: false,
          note: pendingMessage,
        },
      });

      return res.status(200).json({
        success: false,
        configured: false,
        status: 'dns_pending',
        isVerified: false,
        sslStatus: 'pending',
        statusMessage: pendingMessage,
      });
    }

    // 3. Consultar Vercel Domains API con credenciales reales
    const teamParam = vercelTeamId ? `?teamId=${vercelTeamId}` : '';
    const vercelUrl = `https://api.vercel.com/v9/projects/${vercelProjectId}/domains/${domainName}${teamParam}`;

    const vercelRes = await fetch(vercelUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
    });

    const vercelData = await vercelRes.json();

    if (vercelRes.ok && vercelData?.verified) {
      // Dominio verificado en Vercel
      await supabaseAdmin
        .from('organization_domains')
        .update({
          is_verified: true,
          ssl_status: 'active',
          status: 'verified',
          verified_at: new Date().toISOString(),
          last_checked_at: new Date().toISOString(),
          last_error: null,
          vercel_domain_id: vercelData.id || null,
        })
        .eq('id', domainId);

      await supabaseAdmin.from('tenant_audit_logs').insert({
        tenant_id: organizationId,
        action: 'domain_verified',
        changes: { domain: domainName, verified_at: new Date().toISOString() },
      });

      return res.status(200).json({
        success: true,
        configured: true,
        status: 'verified',
        isVerified: true,
        sslStatus: 'active',
        statusMessage: 'Dominio verificado exitosamente y certificado SSL activo en Vercel.',
      });
    } else {
      // No verificado todavía
      const reason = vercelData?.verification?.reason || vercelData?.error?.message || 'Registros DNS pendientes de propagación.';

      await supabaseAdmin
        .from('organization_domains')
        .update({
          is_verified: false,
          ssl_status: 'pending',
          status: 'dns_pending',
          last_checked_at: new Date().toISOString(),
          last_error: reason,
        })
        .eq('id', domainId);

      await supabaseAdmin.from('tenant_audit_logs').insert({
        tenant_id: organizationId,
        action: 'domain_verification_failed',
        changes: { domain: domainName, reason },
      });

      return res.status(200).json({
        success: false,
        configured: true,
        status: 'dns_pending',
        isVerified: false,
        sslStatus: 'pending',
        statusMessage: `Verificación pendiente: ${reason}`,
      });
    }
  } catch (err: unknown) {
    console.error('[verify-domain] Error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: err instanceof Error ? err.message : 'Error inesperado al verificar dominio.',
    });
  }
}
