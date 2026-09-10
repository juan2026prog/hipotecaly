// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/domains-verify
// Verificación Server-Side Real de Dominios y SSL con Vercel API / DNS
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
  // 1. GET: Comprobación de estado del runtime y llamada real a la API de Vercel
  if (req.method === 'GET') {
    const vercelToken = process.env.VERCEL_TOKEN;
    const vercelProjectId = process.env.VERCEL_PROJECT_ID;
    const vercelTeamId = process.env.VERCEL_TEAM_ID;

    const tokenConfigured = Boolean(vercelToken && vercelToken.trim().length > 0);
    const projectIdConfigured = Boolean(vercelProjectId && vercelProjectId.trim().length > 0);
    const teamIdConfigured = Boolean(vercelTeamId && vercelTeamId.trim().length > 0);

    if (!tokenConfigured || !projectIdConfigured) {
      return res.status(200).json({
        configured: false,
        vercelTokenConfigured: tokenConfigured,
        vercelProjectIdConfigured: projectIdConfigured,
        vercelTeamIdConfigured: teamIdConfigured,
        projectFound: false,
        message: 'Variables de entorno VERCEL_TOKEN o VERCEL_PROJECT_ID no configuradas en runtime server-side.',
      });
    }

    try {
      const teamParam = vercelTeamId ? `?teamId=${encodeURIComponent(vercelTeamId)}` : '';
      const projectUrl = `https://api.vercel.com/v9/projects/${encodeURIComponent(vercelProjectId!)}${teamParam}`;

      const projectRes = await fetch(projectUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
        },
      });

      const httpStatus = projectRes.status;
      const projectData = await projectRes.json().catch(() => ({}));

      if (!projectRes.ok) {
        return res.status(200).json({
          configured: true,
          vercelTokenConfigured: true,
          vercelProjectIdConfigured: true,
          vercelTeamIdConfigured: teamIdConfigured,
          httpStatus,
          projectFound: false,
          error: projectData?.error?.message || `Vercel API retornó código HTTP ${httpStatus}`,
        });
      }

      // Obtener lista de dominios asociados al proyecto desde Vercel
      const domainsUrl = `https://api.vercel.com/v9/projects/${encodeURIComponent(vercelProjectId!)}/domains${teamParam}`;
      const domainsRes = await fetch(domainsUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
        },
      });
      const domainsData = await domainsRes.json().catch(() => ({ domains: [] }));

      const maskedProjectId = vercelProjectId!.length > 8
        ? `${vercelProjectId!.substring(0, 4)}...${vercelProjectId!.substring(vercelProjectId!.length - 4)}`
        : vercelProjectId;

      const maskedAccountId = projectData?.accountId
        ? (typeof projectData.accountId === 'string' && projectData.accountId.length > 8
            ? `${projectData.accountId.substring(0, 4)}...${projectData.accountId.substring(projectData.accountId.length - 4)}`
            : projectData.accountId)
        : (vercelTeamId || 'personal');

      const domainList = (domainsData?.domains || []).map((d: any) => ({
        name: d.name,
        verified: Boolean(d.verified),
        apexName: d.apexName,
        createdAt: d.createdAt,
      }));

      return res.status(200).json({
        configured: true,
        vercelTokenConfigured: true,
        vercelProjectIdConfigured: true,
        vercelTeamIdConfigured: teamIdConfigured,
        httpStatus,
        projectFound: true,
        projectName: projectData?.name || 'hipotecaly',
        projectIdMasked: maskedProjectId,
        accountOrTeam: maskedAccountId,
        domainsCount: domainList.length,
        domains: domainList,
      });
    } catch (err: unknown) {
      return res.status(500).json({
        configured: true,
        vercelTokenConfigured: true,
        vercelProjectIdConfigured: true,
        projectFound: false,
        error: err instanceof Error ? err.message : 'Error inesperado al consultar Vercel API.',
      });
    }
  }

  // 2. POST: Verificación de un dominio específico
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed', message: 'Solo se admiten GET o POST.' });
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
    const teamParam = vercelTeamId ? `?teamId=${encodeURIComponent(vercelTeamId)}` : '';
    const vercelUrl = `https://api.vercel.com/v9/projects/${encodeURIComponent(vercelProjectId)}/domains/${encodeURIComponent(domainName)}${teamParam}`;

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
