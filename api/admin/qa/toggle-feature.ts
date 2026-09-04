// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/admin/qa/toggle-feature
// Activa o desactiva globalmente el feature flag de Acceso QA
// ==============================================================================

import { verifySuperAdmin } from '../../../server/auth/superAdminGuard.js';
import { QaSessionService } from '../../../server/qa/qaSessionService.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // 1. Validar autorización de Super Admin
  const auth = await verifySuperAdmin(req);
  if (!auth.authorized) {
    return res.status(auth.status || 401).json({ error: auth.error });
  }

  try {
    const { enabled } = req.body || {};

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'El campo "enabled" debe ser booleano.' });
    }

    const nextState = await QaSessionService.toggleEnabled(enabled);

    return res.status(200).json({
      success: true,
      enabled: nextState,
      message: `Acceso QA ${nextState ? 'habilitado' : 'deshabilitado'} exitosamente.`,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Error al modificar configuración de Acceso QA',
      message: error?.message || 'Error interno del servidor.',
    });
  }
}
