import type { GuardResult } from './authGuards.js';
import { requireTenant } from './authGuards.js';
import { supabaseAdmin } from '../supabase.js';

/**
 * Autorización RBAC flexible por organización.
 * Super Admin siempre pasa. El Owner conserva control último.
 * Para el resto, la fuente de verdad es user_has_org_permission().
 */
export async function requireOrganizationPermission(
  req: any,
  organizationId: string,
  permissionKey: string
): Promise<GuardResult> {
  const auth = await requireTenant(req, organizationId);
  if (!auth.authorized || !auth.data) return auth;

  if (auth.data.isSuperAdmin) return auth;

  const { data, error } = await supabaseAdmin.rpc('user_has_org_permission', {
    p_organization_id: organizationId,
    p_permission_key: permissionKey,
    p_user_id: auth.data.userId,
  });

  if (error) {
    return {
      authorized: false,
      status: 500,
      error: 'Error al verificar permisos de la organización.',
    };
  }

  if (!data) {
    return {
      authorized: false,
      status: 403,
      error: `Acceso denegado: falta el permiso ${permissionKey}.`,
    };
  }

  return auth;
}
