// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/admin/qa/revoke
// Revocación inmediata de sesión QA
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
    const { sessionId } = req.body || {};

    if (!sessionId) {
      return res.status(400).json({ error: 'El campo "sessionId" es obligatorio.' });
    }

    await QaSessionService.revokeSession(sessionId, auth.adminId);

    return res.status(200).json({
      success: true,
      message: 'Sesión QA revocada exitosamente.',
      sessionId,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Error al revocar sesión QA',
      message: error?.message || 'Error interno del servidor.',
    });
  }
}
