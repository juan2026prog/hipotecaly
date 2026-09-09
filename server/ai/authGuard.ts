// ==============================================================================
// HIPOTECALY AI: Middleware Guard de Autorización Server-Side
// Control estricto de acceso y prevención de ataques Cross-Tenant / IDOR
// ==============================================================================

import { supabaseAdmin } from '../supabase.js';
import { requireAuth, AuthContext } from '../security/authGuards.js';

export interface AiAuthOptions {
  applicationId?: string;
  targetOrganizationId?: string;
  allowedRoles?: string[];
}

export interface AiAuthResult {
  authorized: boolean;
  status: 200 | 400 | 401 | 403 | 404 | 500;
  statusCode: 200 | 400 | 401 | 403 | 404 | 500;
  error?: string;
  errorCode?: string;
  errorMessage?: string;
  userId?: string;
  organizationId?: string;
  role?: string;
  isSuperAdmin?: boolean;
  application?: any;
}

/**
 * Middleware central para todos los endpoints de Inteligencia Artificial.
 * Valida sesión JWT, pertenencia a la organización y acceso legítimo al expediente.
 */
export async function requireAiAuthorization(
  req: any,
  options: AiAuthOptions = {}
): Promise<AiAuthResult> {
  // 1. Validar autenticación JWT
  const auth = await requireAuth(req);
  if (!auth.authorized || !auth.data) {
    const errText = auth.error || 'No autorizado: Sesión de usuario inválida o ausente.';
    return {
      authorized: false,
      status: auth.status,
      statusCode: auth.status,
      error: errText,
      errorCode: auth.status === 403 ? 'FORBIDDEN' : 'UNAUTHORIZED',
      errorMessage: errText,
    };
  }

  const { userId, isSuperAdmin } = auth.data;

  // 2. Si es Super Admin, acceso global garantizado
  if (isSuperAdmin) {
    let app: any = null;
    let effectiveOrgId = options.targetOrganizationId || auth.data.organizationId || 'a0000000-0000-0000-0000-000000000001';

    if (options.applicationId) {
      const { data: foundApp } = await supabaseAdmin
        .from('applications')
        .select('*')
        .eq('id', options.applicationId)
        .maybeSingle();
      if (foundApp) {
        app = foundApp;
        effectiveOrgId = foundApp.organization_id;
      }
    }

    return {
      authorized: true,
      status: 200,
      userId,
      organizationId: effectiveOrgId,
      role: 'super_admin',
      isSuperAdmin: true,
      application: app,
    };
  }

  // 3. Si se especificó expediente, verificar propiedad del expediente y organización
  if (options.applicationId) {
    try {
      const { data: app, error } = await supabaseAdmin
        .from('applications')
        .select('*')
        .eq('id', options.applicationId)
        .maybeSingle();

      if (error || !app) {
        return {
          authorized: false,
          status: 404,
          statusCode: 404,
          error: 'Expediente no encontrado.',
          errorCode: 'APPLICATION_NOT_FOUND',
          errorMessage: 'Expediente no encontrado.',
        };
      }

      // Validar si el usuario es miembro activo de la organización del expediente
      const { data: member } = await supabaseAdmin
        .from('organization_members')
        .select('role, is_active')
        .eq('user_id', userId)
        .eq('organization_id', app.organization_id)
        .eq('is_active', true)
        .maybeSingle();

      if (!member) {
        // Verificar si es el prestatario titular asignado
        const { data: borrower } = await supabaseAdmin
          .from('borrowers')
          .select('id')
          .eq('user_id', userId)
          .eq('id', app.borrower_id)
          .maybeSingle();

        if (!borrower) {
          const deniedMsg = 'Acceso denegado: No tienes permisos sobre este expediente ni perteneces a la organización titular.';
          return {
            authorized: false,
            status: 403,
            statusCode: 403,
            error: deniedMsg,
            errorCode: 'FORBIDDEN',
            errorMessage: deniedMsg,
          };
        }

        return {
          authorized: true,
          status: 200,
          statusCode: 200,
          userId,
          organizationId: app.organization_id,
          role: 'borrower',
          isSuperAdmin: false,
          application: app,
        };
      }

      // Validar roles si fueron requeridos
      if (options.allowedRoles && options.allowedRoles.length > 0 && !options.allowedRoles.includes(member.role)) {
        const roleDeniedMsg = `Acceso denegado: Tu rol (${member.role}) no tiene permisos para esta función de IA.`;
        return {
          authorized: false,
          status: 403,
          statusCode: 403,
          error: roleDeniedMsg,
          errorCode: 'ROLE_FORBIDDEN',
          errorMessage: roleDeniedMsg,
        };
      }

      return {
        authorized: true,
        status: 200,
        statusCode: 200,
        userId,
        organizationId: app.organization_id,
        role: member.role,
        isSuperAdmin: false,
        application: app,
      };
    } catch {
      return {
        authorized: false,
        status: 500,
        statusCode: 500,
        error: 'Error al verificar autorización sobre el expediente.',
        errorCode: 'INTERNAL_AUTH_ERROR',
        errorMessage: 'Error al verificar autorización sobre el expediente.',
      };
    }
  }

  // 4. Si se especificó organización objetivo
  const targetOrgId = options.targetOrganizationId || auth.data.organizationId;
  if (!targetOrgId) {
    return {
      authorized: false,
      status: 400,
      statusCode: 400,
      error: 'Debe especificarse organizationId o applicationId para ejecutar esta operación.',
      errorCode: 'MISSING_ORG_OR_APP',
      errorMessage: 'Debe especificarse organizationId o applicationId para ejecutar esta operación.',
    };
  }

  try {
    const { data: member } = await supabaseAdmin
      .from('organization_members')
      .select('role, is_active')
      .eq('user_id', userId)
      .eq('organization_id', targetOrgId)
      .eq('is_active', true)
      .maybeSingle();

    if (!member) {
      const orgDeniedMsg = 'Acceso denegado: No eres miembro activo de la organización especificada.';
      return {
        authorized: false,
        status: 403,
        statusCode: 403,
        error: orgDeniedMsg,
        errorCode: 'ORG_FORBIDDEN',
        errorMessage: orgDeniedMsg,
      };
    }

    if (options.allowedRoles && options.allowedRoles.length > 0 && !options.allowedRoles.includes(member.role)) {
      const roleDeniedMsg = `Acceso denegado: Tu rol (${member.role}) no tiene permisos para esta función de IA.`;
      return {
        authorized: false,
        status: 403,
        statusCode: 403,
        error: roleDeniedMsg,
        errorCode: 'ROLE_FORBIDDEN',
        errorMessage: roleDeniedMsg,
      };
    }

    return {
      authorized: true,
      status: 200,
      statusCode: 200,
      userId,
      organizationId: targetOrgId,
      role: member.role,
      isSuperAdmin: false,
    };
  } catch {
    return {
      authorized: false,
      status: 500,
      statusCode: 500,
      error: 'Error al verificar membresía en la organización.',
      errorCode: 'INTERNAL_AUTH_ERROR',
      errorMessage: 'Error al verificar membresía en la organización.',
    };
  }
}
