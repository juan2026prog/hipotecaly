// ==============================================================================
// VERCEL SERVERLESS FUNCTION: /api/admin/ai/deactivate
// Desactivación global de HIPOTECALY AI (Master Switch OFF)
// Conserva la clave en Vault pero impide nuevas ejecuciones.
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
    // 2. Desactivar master switch
    const { data, error } = await supabaseAdmin.rpc('set_ai_master_switch', {
      p_enabled: false,
      p_admin_id: auth.adminId,
    });

    if (error) {
      return res.status(500).json({
        error: 'No se pudo desactivar HIPOTECALY AI.',
        message: error.message,
      });
    }

    // 3. Registrar auditoría
    await supabaseAdmin.from('ai_admin_audit_logs').insert({
      event: 'HIPOTECALY_AI_DEACTIVATED',
      admin_user_id: auth.adminId,
      result: 'SUCCESS',
      details: { action: 'Master switch set to OFF (key retained in Vault)' },
      ip_address: req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress,
      user_agent: req.headers?.['user-agent'],
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      active: false,
      message: 'HIPOTECALY AI ha sido desactivado. La plataforma continúa funcionando normalmente y no se ejecutarán nuevos análisis.',
    });
  } catch (err: any) {
    return res.status(500).json({
      error: 'Error interno al desactivar HIPOTECALY AI.',
      message: err?.message || 'Error de servidor',
    });
  }
}
