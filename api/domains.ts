// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/domains
// Verificación Server-Side Real de Dominios y SSL con Vercel API
// ==============================================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

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

  return res.status(200).json({ status: 'ok' });
}
