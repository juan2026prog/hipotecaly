// ==============================================================================
// HIPOTECALY SERVER: QA Session Service
// Gestión de sesiones temporales de acceso QA, expiración, revocación y auditoría
// ==============================================================================

import { supabaseAdmin } from '../supabase.js';
import { QaUserService } from './qaUserService.js';

export interface CreateSessionParams {
  adminId: string;
  role: string;
  tenantId: string;
  durationHours?: number;
  source?: string;
  keepOnDevice?: boolean;
}

export interface QaSessionRecord {
  id: string;
  created_by: string;
  qa_user_id: string;
  role: string;
  tenant_id: string;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
  status: 'active' | 'revoked' | 'expired';
  source: string;
  metadata: Record<string, any>;
  tenant_name?: string;
}

// Store en memoria para fallback o pruebas aisladas
const inMemorySessions: Map<string, QaSessionRecord> = new Map();
let inMemoryQaEnabled: boolean = true;

export class QaSessionService {
  /**
   * Obtiene la configuración global de Acceso QA
   */
  public static async getSettings(): Promise<{ enabled: boolean; maxDurationHours: number; defaultDurationHours: number; allowedRoles: string[] }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('qa_access_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (!error && data) {
        return {
          enabled: Boolean(data.enabled),
          maxDurationHours: data.max_duration_hours || 24,
          defaultDurationHours: data.default_duration_hours || 8,
          allowedRoles: data.allowed_roles || ['borrower', 'analyst', 'operator', 'tenant_admin', 'lender', 'super_admin'],
        };
      }
    } catch {
      // Fallback a memoria
    }

    return {
      enabled: inMemoryQaEnabled,
      maxDurationHours: 24,
      defaultDurationHours: 8,
      allowedRoles: ['borrower', 'analyst', 'operator', 'tenant_admin', 'lender', 'super_admin'],
    };
  }

  /**
   * Modifica el feature flag global de Acceso QA
   */
  public static async toggleEnabled(enabled: boolean): Promise<boolean> {
    inMemoryQaEnabled = enabled;
    try {
      await supabaseAdmin
        .from('qa_access_settings')
        .upsert({
          id: 'default',
          enabled,
          updated_at: new Date().toISOString(),
        })
        .select();
    } catch {
      // Fallback
    }
    return inMemoryQaEnabled;
  }

  /**
   * Crea una nueva sesión QA temporal y aprovisiona el usuario real
   */
  public static async createSession(params: CreateSessionParams) {
    const { adminId, role, tenantId, source = 'super_admin_ui', keepOnDevice = false } = params;
    const durationHours = Math.min(Math.max(params.durationHours || 8, 1), 24);

    // 1. Verificar si QA está habilitado
    const settings = await this.getSettings();
    if (!settings.enabled) {
      throw new Error('El Acceso QA está deshabilitado globalmente en HIPOTECALY.');
    }

    // 2. Aprovisionar o buscar usuario QA
    const qaUser = await QaUserService.getOrCreateQaUser(role, tenantId);

    // 3. Generar token de sesión Supabase Auth real
    const sessionTokenData = await QaUserService.generateAuthSessionToken(qaUser, durationHours);

    // 4. Crear registro de sesión
    const sessionId = `qa-sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const nowIso = new Date().toISOString();
    const expiresIso = sessionTokenData.expiresAtIso;

    const sessionRecord: QaSessionRecord = {
      id: sessionId,
      created_by: adminId,
      qa_user_id: qaUser.id,
      role: qaUser.role,
      tenant_id: tenantId,
      created_at: nowIso,
      expires_at: expiresIso,
      revoked_at: null,
      status: 'active',
      source,
      metadata: {
        keepOnDevice,
        userEmail: qaUser.email,
        displayName: qaUser.displayName,
        tenantName: qaUser.tenantName,
      },
      tenant_name: qaUser.tenantName,
    };

    inMemorySessions.set(sessionId, sessionRecord);

    try {
      await supabaseAdmin
        .from('qa_access_sessions')
        .insert({
          id: sessionId,
          created_by: adminId,
          qa_user_id: qaUser.id,
          role: qaUser.role,
          tenant_id: tenantId,
          created_at: nowIso,
          expires_at: expiresIso,
          status: 'active',
          source,
          metadata: sessionRecord.metadata,
        });

      // Registrar auditoría
      await this.logAuditEvent({
        sessionId,
        eventType: 'QA_SESSION_CREATED',
        userId: adminId,
        tenantId,
        role: qaUser.role,
        details: { source, durationHours, qaUserId: qaUser.id },
      });
    } catch {
      // Continuar con memoria si Supabase no tiene la tabla migrada aún
    }

    return {
      qaSession: sessionRecord,
      authSession: {
        access_token: sessionTokenData.access_token,
        token_type: sessionTokenData.token_type,
        expires_in: sessionTokenData.expires_in,
        expires_at: sessionTokenData.expires_at,
        refresh_token: sessionTokenData.refresh_token,
        user: sessionTokenData.user,
      },
    };
  }

  /**
   * Revoca una sesión QA activa
   */
  public static async revokeSession(sessionId: string, adminId?: string): Promise<boolean> {
    const mem = inMemorySessions.get(sessionId);
    const nowIso = new Date().toISOString();

    if (mem) {
      mem.status = 'revoked';
      mem.revoked_at = nowIso;
      inMemorySessions.set(sessionId, mem);
    }

    try {
      await supabaseAdmin
        .from('qa_access_sessions')
        .update({
          status: 'revoked',
          revoked_at: nowIso,
        })
        .eq('id', sessionId);

      await this.logAuditEvent({
        sessionId,
        eventType: 'QA_SESSION_REVOKED',
        userId: adminId,
        details: { revokedAt: nowIso },
      });
    } catch {
      // Ignorar
    }

    return true;
  }

  /**
   * Valida el estado de una sesión QA (activa, no expirada, no revocada)
   */
  public static async validateSession(sessionId: string): Promise<{ valid: boolean; session?: QaSessionRecord; reason?: string }> {
    let session: QaSessionRecord | undefined = inMemorySessions.get(sessionId);

    if (!session) {
      try {
        const { data, error } = await supabaseAdmin
          .from('qa_access_sessions')
          .select('*, organizations(name)')
          .eq('id', sessionId)
          .maybeSingle();

        if (!error && data) {
          session = {
            id: data.id,
            created_by: data.created_by,
            qa_user_id: data.qa_user_id,
            role: data.role,
            tenant_id: data.tenant_id,
            created_at: data.created_at,
            expires_at: data.expires_at,
            revoked_at: data.revoked_at,
            status: data.status,
            source: data.source,
            metadata: data.metadata || {},
            tenant_name: data.organizations?.name || 'Organización',
          };
          inMemorySessions.set(sessionId, session);
        }
      } catch {
        // Ignorar
      }
    }

    if (!session) {
      return { valid: false, reason: 'Sesión QA no encontrada.' };
    }

    if (session.status === 'revoked' || session.revoked_at) {
      return { valid: false, session, reason: 'La sesión QA ha sido revocada por un administrador.' };
    }

    const expiresAt = new Date(session.expires_at).getTime();
    if (Date.now() > expiresAt) {
      session.status = 'expired';
      inMemorySessions.set(sessionId, session);
      try {
        await supabaseAdmin
          .from('qa_access_sessions')
          .update({ status: 'expired' })
          .eq('id', sessionId);
        
        await this.logAuditEvent({
          sessionId,
          eventType: 'QA_SESSION_EXPIRED',
          details: { expiredAt: session.expires_at },
        });
      } catch {
        // Ignorar
      }
      return { valid: false, session, reason: 'La sesión QA ha expirado.' };
    }

    return { valid: true, session };
  }

  /**
   * Lista todas las sesiones activas recientes para el panel de Super Admin
   */
  public static async getActiveSessions(): Promise<QaSessionRecord[]> {
    const list: QaSessionRecord[] = [];

    try {
      const { data, error } = await supabaseAdmin
        .from('qa_access_sessions')
        .select('*, organizations(name)')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        data.forEach((d: any) => {
          list.push({
            id: d.id,
            created_by: d.created_by,
            qa_user_id: d.qa_user_id,
            role: d.role,
            tenant_id: d.tenant_id,
            created_at: d.created_at,
            expires_at: d.expires_at,
            revoked_at: d.revoked_at,
            status: d.status,
            source: d.source,
            metadata: d.metadata || {},
            tenant_name: d.organizations?.name || d.metadata?.tenantName || 'HIPOTECALY',
          });
        });
        return list;
      }
    } catch {
      // Ignorar
    }

    // Fallback memoria
    return Array.from(inMemorySessions.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * Registra un evento en la tabla de auditoría qa_audit_logs
   */
  public static async logAuditEvent(params: {
    sessionId: string;
    eventType: 'QA_SESSION_CREATED' | 'QA_SESSION_USED' | 'QA_SESSION_ROLE_CHANGED' | 'QA_SESSION_REVOKED' | 'QA_SESSION_EXPIRED';
    userId?: string;
    tenantId?: string;
    role?: string;
    details?: Record<string, any>;
  }) {
    try {
      await supabaseAdmin.from('qa_audit_logs').insert({
        session_id: params.sessionId,
        event_type: params.eventType,
        user_id: params.userId || null,
        tenant_id: params.tenantId || null,
        role: params.role || null,
        details: params.details || {},
      });
    } catch {
      // Fallback silencioso
    }
  }
}
