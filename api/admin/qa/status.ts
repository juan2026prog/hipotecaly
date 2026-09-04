// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/admin/qa/status
// Consulta de estado de QA Access, sesiones activas y roles disponibles
// ==============================================================================

import { verifySuperAdmin } from '../../../server/auth/superAdminGuard.js';
import { QaSessionService } from '../../../server/qa/qaSessionService.js';
import { QA_CONFIGURED_USERS } from '../../../server/qa/qaUserService.js';
import { supabaseAdmin } from '../../../server/supabase.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  // 1. Validar autorización de Super Admin
  const auth = await verifySuperAdmin(req);
  if (!auth.authorized) {
    return res.status(auth.status || 401).json({ error: auth.error });
  }

  try {
    const settings = await QaSessionService.getSettings();
    const activeSessions = await QaSessionService.getActiveSessions();

    // Obtener lista de tenants registrados
    let tenants: any[] = [];
    try {
      const { data } = await supabaseAdmin
        .from('organizations')
        .select('id, name, slug, organization_type, status')
        .order('name', { ascending: true });
      if (data) {
        tenants = data;
      }
    } catch {
      tenants = [
        { id: 'a0000000-0000-0000-0000-000000000001', name: 'HIPOTECALY Central', slug: 'hipotecaly', status: 'active' },
        { id: 'd0000000-0000-0000-0000-000000000001', name: 'NOVA Crédito Hipotecario', slug: 'nova-demo', status: 'active' },
      ];
    }

    return res.status(200).json({
      enabled: settings.enabled,
      maxDurationHours: settings.maxDurationHours,
      defaultDurationHours: settings.defaultDurationHours,
      allowedRoles: settings.allowedRoles,
      configuredUsers: Object.keys(QA_CONFIGURED_USERS).map((k) => ({
        key: k,
        ...QA_CONFIGURED_USERS[k],
      })),
      tenants,
      activeSessions,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Error al consultar estado de QA Access',
      message: error?.message || 'Error interno del servidor.',
    });
  }
}
