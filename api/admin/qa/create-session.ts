// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/admin/qa/create-session
// Creación segura de sesión QA para Super Admin con emisión de tokens Supabase
// ==============================================================================

import { verifySuperAdmin } from '../../../server/auth/superAdminGuard.js';
import { QaSessionService } from '../../../server/qa/qaSessionService.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // 1. Validar autorización de Super Admin (Rechaza anónimos con 401, no-superadmin con 403)
  const auth = await verifySuperAdmin(req);
  if (!auth.authorized) {
    return res.status(auth.status || 401).json({ error: auth.error });
  }

  try {
    const { role, tenantId, durationHours = 8, source = 'super_admin_ui', keepOnDevice = false } = req.body || {};

    if (!role) {
      return res.status(400).json({ error: 'El campo "role" es obligatorio.' });
    }

    if (!tenantId) {
      return res.status(400).json({ error: 'El campo "tenantId" es obligatorio.' });
    }

    // 2. Crear sesión QA e inicializar usuario Supabase
    const result = await QaSessionService.createSession({
      adminId: auth.adminId || 'superadmin-master',
      role,
      tenantId,
      durationHours: Number(durationHours),
      source,
      keepOnDevice: Boolean(keepOnDevice),
    });

    return res.status(200).json({
      success: true,
      message: 'Sesión QA generada exitosamente.',
      qaSession: result.qaSession,
      authSession: result.authSession,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Error al generar sesión QA',
      message: error?.message || 'Error interno del servidor.',
    });
  }
}
