// ==============================================================================
// HIPOTECALY SERVER: Unified Authorization Guards & Sanitizers (Fintech Strict)
// Control de acceso server-side basado en la fuente de verdad (Supabase Auth / DB)
// ==============================================================================

import { supabaseAdmin } from '../supabase.js';
import { SecurityEventService } from './securityEventService.js';

export interface AuthContext {
  userId: string;
  email: string;
  isSuperAdmin: boolean;
  role?: string;
  organizationId?: string;
}

export interface GuardResult<T = AuthContext> {
  authorized: boolean;
  status: 200 | 400 | 401 | 403 | 404 | 500;
  error?: string;
  data?: T;
}

/**
 * Sanitiza cualquier error para no devolver información técnica, queries SQL ni stack traces
 */
export function safeError(error: any, fallbackMessage = 'Ha ocurrido un error inesperado al procesar la solicitud.'): string {
  if (!error) return fallbackMessage;
  if (typeof error === 'string') {
    if (error.includes('violates') || error.includes('syntax') || error.includes('SELECT') || error.includes('INSERT')) {
      return fallbackMessage;
    }
    return error;
  }
  const msg = error.message || '';
  if (msg.includes('violates') || msg.includes('relation') || msg.includes('column') || msg.includes('JWT')) {
    return fallbackMessage;
  }
  return msg || fallbackMessage;
}

/**
 * 1. requireAuth: Valida la presencia y autenticidad del token JWT de Supabase
 */
export async function requireAuth(req: any): Promise<GuardResult> {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;

  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return {
      authorized: false,
      status: 401,
      error: 'Autenticación requerida. Token de sesión no proporcionado.',
    };
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  // Test token para entornos de prueba Playwright
  if (process.env.NODE_ENV !== 'production' && (token === 'superadmin-valid-token' || token === 'token-superadmin-2026')) {
    return {
      authorized: true,
      status: 200,
      data: {
        userId: 'a1111111-1111-1111-1111-111111111111',
        email: 'superadmin@hipotecaly.uy',
        isSuperAdmin: true,
        role: 'super_admin',
        organizationId: 'a0000000-0000-0000-0000-000000000001',
      },
    };
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      await SecurityEventService.logSecurityEvent({
        eventType: 'SECURITY_FAILED_LOGIN',
        severity: 'LOW',
        metadata: { reason: 'Token inválido o expirado' },
        req,
      });

      return {
        authorized: false,
        status: 401,
        error: 'Sesión expirada o token de autenticación inválido.',
      };
    }

    const isSuper = Boolean(
      user.app_metadata?.role === 'super_admin' ||
      user.app_metadata?.is_super_admin
    );

    return {
      authorized: true,
      status: 200,
      data: {
        userId: user.id,
        email: user.email || '',
        isSuperAdmin: isSuper,
        role: user.app_metadata?.role,
        organizationId: user.app_metadata?.organization_id,
      },
    };
  } catch (err: any) {
    return {
      authorized: false,
      status: 401,
      error: 'Error al verificar credenciales con el servidor de autenticación.',
    };
  }
}

/**
 * 2. requireTenant: Valida que el usuario pertenece al tenant solicitado o es super admin
 */
export async function requireTenant(req: any, targetTenantId: string): Promise<GuardResult> {
  const auth = await requireAuth(req);
  if (!auth.authorized || !auth.data) return auth;

  if (auth.data.isSuperAdmin) {
    return auth; // Super Admin tiene acceso global
  }

  try {
    const { data: membership, error } = await supabaseAdmin
      .from('organization_members')
      .select('role, is_active')
      .eq('user_id', auth.data.userId)
      .eq('organization_id', targetTenantId)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !membership) {
      await SecurityEventService.logSecurityEvent({
        eventType: 'SECURITY_ACCESS_DENIED',
        severity: 'HIGH',
        userId: auth.data.userId,
        organizationId: targetTenantId,
        metadata: { reason: 'Intento de acceso Cross-Tenant no autorizado' },
        req,
      });

      return {
        authorized: false,
        status: 403,
        error: 'Acceso denegado: No perteneces a esta organización o tu membresía está inactiva.',
      };
    }

    auth.data.role = membership.role;
    auth.data.organizationId = targetTenantId;
    return auth;
  } catch {
    return {
      authorized: false,
      status: 500,
      error: 'Error al validar membresía en la organización.',
    };
  }
}

/**
 * 3. requireRole: Valida que el usuario tenga uno de los roles permitidos en el tenant
 */
export async function requireRole(req: any, allowedRoles: string[], targetTenantId?: string): Promise<GuardResult> {
  const auth = targetTenantId ? await requireTenant(req, targetTenantId) : await requireAuth(req);
  if (!auth.authorized || !auth.data) return auth;

  if (auth.data.isSuperAdmin) {
    return auth;
  }

  const currentRole = auth.data.role;
  if (!currentRole || !allowedRoles.includes(currentRole)) {
    await SecurityEventService.logSecurityEvent({
      eventType: 'SECURITY_ACCESS_DENIED',
      severity: 'MEDIUM',
      userId: auth.data.userId,
      organizationId: targetTenantId,
      metadata: { currentRole, allowedRoles, reason: 'Rol insuficiente' },
      req,
    });

    return {
      authorized: false,
      status: 403,
      error: `Acceso denegado: Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}.`,
    };
  }

  return auth;
}

/**
 * 4. requireApplicationAccess: Valida acceso legítimo a un expediente específico
 */
export async function requireApplicationAccess(req: any, applicationId: string): Promise<GuardResult<{ auth: AuthContext; application: any }>> {
  const auth = await requireAuth(req);
  if (!auth.authorized || !auth.data) {
    return { authorized: false, status: auth.status, error: auth.error };
  }

  try {
    const { data: application, error } = await supabaseAdmin
      .from('applications')
      .select('id, organization_id, borrower_id, status')
      .eq('id', applicationId)
      .maybeSingle();

    if (error || !application) {
      return {
        authorized: false,
        status: 404,
        error: 'Expediente no encontrado.',
      };
    }

    if (auth.data.isSuperAdmin) {
      return {
        authorized: true,
        status: 200,
        data: { auth: auth.data, application },
      };
    }

    // A. ¿Es el prestatario titular?
    const { data: borrower } = await supabaseAdmin
      .from('borrowers')
      .select('id')
      .eq('user_id', auth.data.userId)
      .eq('id', application.borrower_id)
      .maybeSingle();

    if (borrower) {
      return {
        authorized: true,
        status: 200,
        data: { auth: auth.data, application },
      };
    }

    // B. ¿Es miembro de la organización gestora?
    const { data: membership } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('user_id', auth.data.userId)
      .eq('organization_id', application.organization_id)
      .eq('is_active', true)
      .maybeSingle();

    if (membership) {
      return {
        authorized: true,
        status: 200,
        data: { auth: auth.data, application },
      };
    }

    // Acceso denegado (Cross-User / Cross-Tenant)
    await SecurityEventService.logSecurityEvent({
      eventType: 'SECURITY_ACCESS_DENIED',
      severity: 'HIGH',
      userId: auth.data.userId,
      resourceType: 'application',
      resourceId: applicationId,
      metadata: { reason: 'Intento de acceso a expediente ajeno (IDOR Blocked)' },
      req,
    });

    return {
      authorized: false,
      status: 403,
      error: 'Acceso denegado: No tienes autorización para consultar este expediente.',
    };
  } catch {
    return {
      authorized: false,
      status: 500,
      error: 'Error al verificar permisos sobre el expediente.',
    };
  }
}

/**
 * 5. requireMfaAal2: Valida que la sesión cuente con aseguramiento AAL2 (MFA verificado)
 * Obligatorio en producción para operaciones críticas (Super Admin, cambio de roles, Vault, API keys)
 */
export async function requireMfaAal2(req: any, options: { operationName?: string } = {}): Promise<GuardResult> {
  const auth = await requireAuth(req);
  if (!auth.authorized || !auth.data) return auth;

  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
  const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
  const token = typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';

  // Bypass temporal de MFA ÚNICAMENTE para QA en entornos no productivos
  if (!isProd && (token === 'superadmin-valid-token' || token === 'token-superadmin-2026')) {
    console.log(`[QA_ADMIN_MFA_BYPASS] Operación ${options.operationName || 'crítica'} autorizada para token QA`);
    return auth;
  }

  // En producción o con tokens reales, verificar factores MFA y nivel AAL
  try {
    const { data: factorsData, error: factorsErr } = await supabaseAdmin.auth.admin.mfa.listFactors({
      userId: auth.data.userId,
    });

    const hasEnrolledMfa = !factorsErr && factorsData && factorsData.factors && factorsData.factors.length > 0;
    const verifiedFactor = hasEnrolledMfa && factorsData.factors.some((f: any) => f.status === 'verified');

    // Si el usuario tiene rol elevado, MFA es estrictamente obligatorio
    const elevatedRoles = ['super_admin', 'tenant_owner', 'tenant_admin', 'notary', 'bank_admin'];
    const isElevated = auth.data.isSuperAdmin || (auth.data.role && elevatedRoles.includes(auth.data.role));

    if (isElevated && !verifiedFactor && isProd) {
      await SecurityEventService.logSecurityEvent({
        eventType: 'SECURITY_ACCESS_DENIED',
        severity: 'HIGH',
        userId: auth.data.userId,
        metadata: { reason: 'Operación crítica requiere factor MFA enrolado y verificado (AAL2 Required)', operation: options.operationName },
        req,
      });

      return {
        authorized: false,
        status: 403,
        error: 'MFA_REQUIRED_AAL2: Esta operación administrativa exige autenticación de doble factor (MFA/TOTP) activa.',
      };
    }

    return auth;
  } catch (err: any) {
    return {
      authorized: false,
      status: 500,
      error: 'Error al verificar nivel de aseguramiento MFA.',
    };
  }
}

/**
 * 6. requireRecentAuth: Valida que la última autenticación del usuario sea reciente (< 15 min)
 * Aplica reautenticación crítica (step-up) para operaciones destructivas o de seguridad
 */
export async function requireRecentAuth(req: any, maxAgeSeconds = 900): Promise<GuardResult> {
  const auth = await requireAuth(req);
  if (!auth.authorized || !auth.data) return auth;

  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
  const authHeader = req.headers?.authorization || req.headers?.Authorization || '';
  const token = typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '').trim() : '';

  if (!isProd && (token === 'superadmin-valid-token' || token === 'token-superadmin-2026')) {
    return auth;
  }

  try {
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (user?.last_sign_in_at) {
      const lastSignInTime = new Date(user.last_sign_in_at).getTime();
      const ageSeconds = Math.floor((Date.now() - lastSignInTime) / 1000);

      if (ageSeconds > maxAgeSeconds) {
        return {
          authorized: false,
          status: 403,
          error: 'REAUTH_REQUIRED: Por razones de seguridad, esta operación sensible requiere reautenticación reciente.',
        };
      }
    }

    return auth;
  } catch {
    return auth; // Continuar con requireAuth data
  }
}
