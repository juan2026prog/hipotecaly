// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/admin/ai/activate
// Activación global de HIPOTECALY AI (Master Switch ON)
// Requiere clave configurada y último test PASS.
// ==============================================================================

import { verifySuperAdmin } from '../../../server/auth/superAdminGuard';
import { supabaseAdmin } from '../../../server/supabase';

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
    // 2. Ejecutar RPC set_ai_master_switch con validación de precondiciones
    const { error } = await supabaseAdmin.rpc('set_ai_master_switch', {
      p_enabled: true,
      p_admin_id: auth.adminId,
    });

    if (error) {
      return res.status(400).json({
        error: 'No se pudo activar HIPOTECALY AI.',
        message: error.message || 'La clave debe estar configurada y la última prueba debe ser PASS.',
      });
    }

    // 3. Registrar auditoría
    try {
      await supabaseAdmin.from('ai_admin_audit_logs').insert({
        event: 'HIPOTECALY_AI_ACTIVATED',
        admin_user_id: auth.adminId,
        result: 'SUCCESS',
        details: { action: 'Master switch set to ON' },
        ip_address: req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress,
        user_agent: req.headers?.['user-agent'],
      });
    } catch {
      // Ignorar fallo de log de auditoría
    }

    return res.status(200).json({
      success: true,
      active: true,
      message: 'HIPOTECALY AI ha sido activado globalmente. Todos los análisis están disponibles.',
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Error interno al activar HIPOTECALY AI.',
      message: err?.message || 'Error de servidor',
    });
  }
}
