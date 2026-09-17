// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/domains
// Verificación Server-Side Real de Dominios y SSL con Vercel API
// ==============================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireRole } from '../server/security/authGuards.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'GET') {
    const authGuard = await requireRole(req, ['super_admin', 'tenant_admin', 'platform_admin']);
    if (!authGuard.authorized) {
      return res.status(authGuard.status || 403).json({
        configured: false,
        error: authGuard.error || 'Acceso denegado: Se requieren permisos administrativos.',
      });
    }

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

      return res.status(200).json({
        configured: true,
        vercelTokenConfigured: true,
        vercelProjectIdConfigured: true,
        vercelTeamIdConfigured: teamIdConfigured,
        httpStatus,
        projectFound: true,
        projectName: projectData?.name || 'hipotecaly',
      });
    } catch (err: unknown) {
      return res.status(500).json({
        configured: true,
        error: err instanceof Error ? err.message : 'Error inesperado al consultar Vercel API.',
      });
    }
  }

  if (req.method === 'POST') {
    const authGuard = await requireRole(req, ['super_admin', 'tenant_admin', 'platform_admin']);
    if (!authGuard.authorized) {
      return res.status(authGuard.status || 403).json({
        success: false,
        configured: false,
        error: authGuard.error || 'Acceso denegado: Se requieren permisos administrativos.',
      });
    }

    let bodyData = req.body;
    if (typeof bodyData === 'string') {
      try {
        bodyData = JSON.parse(bodyData);
      } catch {
        bodyData = {};
      }
    }

    const { organizationId, domainId, domain } = bodyData || {};

    if (!organizationId && !domainId && !domain) {
      return res.status(400).json({
        success: false,
        configured: false,
        error: 'Faltan parámetros organizationId y domainId en el cuerpo de la solicitud.',
      });
    }

    const vercelToken = process.env.VERCEL_TOKEN;
    const vercelProjectId = process.env.VERCEL_PROJECT_ID;
    const vercelTeamId = process.env.VERCEL_TEAM_ID;

    if (!vercelToken || !vercelProjectId) {
      return res.status(200).json({
        success: false,
        configured: false,
        status: 'NOT_CONFIGURED',
        isVerified: false,
        error: 'VERCEL_TOKEN o VERCEL_PROJECT_ID no configurados en las variables de entorno de Vercel.',
      });
    }

    try {
      const teamParam = vercelTeamId ? `?teamId=${encodeURIComponent(vercelTeamId)}` : '';
      const domainToCheck = domain || 'custom.domain.uy';
      const verifyUrl = `https://api.vercel.com/v9/projects/${encodeURIComponent(vercelProjectId)}/domains/${encodeURIComponent(domainToCheck)}/verify${teamParam}`;

      const verifyRes = await fetch(verifyUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
        },
      });

      const verifyData = await verifyRes.json().catch(() => ({}));
      const isVerified = Boolean(verifyData?.verified);
      const domainStatus = isVerified ? 'VERIFIED' : verifyRes.ok ? 'DNS_PENDING' : 'FAILED';

      return res.status(200).json({
        success: isVerified,
        configured: true,
        status: domainStatus,
        isVerified,
        sslStatus: isVerified ? 'active' : 'pending',
        statusMessage: isVerified ? 'Dominio verificado con éxito en Vercel Edge Network.' : 'Pendiente de propagación DNS de registros CNAME/TXT.',
        verificationDetails: verifyData,
      });
    } catch (err: unknown) {
      return res.status(500).json({
        success: false,
        configured: true,
        status: 'FAILED',
        error: err instanceof Error ? err.message : 'Error inesperado al verificar dominio.',
      });
    }
  }

  return res.status(405).json({ error: 'METHOD_NOT_ALLOWED', message: 'Método no soportado.' });
}
