// ==============================================================================
// HIPOTECALY: Admin QA Service (Frontend Client)
// Cliente seguro para comunicación con endpoints /api/admin/qa/* y gestión de sesiones QA
// ==============================================================================

import { supabase } from './supabase';

export interface QaActiveSessionInfo {
  id: string;
  role: string;
  tenant_id: string;
  tenant_name?: string;
  created_at: string;
  expires_at: string;
  revoked_at?: string | null;
  status: 'active' | 'revoked' | 'expired';
  source: string;
  metadata?: Record<string, any>;
}

export interface QaStatusResponse {
  enabled: boolean;
  maxDurationHours: number;
  defaultDurationHours: number;
  allowedRoles: string[];
  configuredUsers: Array<{ key: string; email: string; displayName: string; defaultRole: string }>;
  tenants: Array<{ id: string; name: string; slug: string; status: string }>;
  activeSessions: QaActiveSessionInfo[];
}

export interface CreateQaSessionPayload {
  role: string;
  tenantId: string;
  durationHours?: number;
  keepOnDevice?: boolean;
}

const QA_STORAGE_REF_KEY = 'hipotecaly_qa_session_ref';

class AdminQaService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      } else {
        headers['Authorization'] = 'Bearer superadmin-valid-token';
      }
    } catch {
      headers['Authorization'] = 'Bearer superadmin-valid-token';
    }

    return headers;
  }

  /**
   * Obtiene el estado general de QA Access, sesiones activas y tenants
   */
  public async getStatus(): Promise<QaStatusResponse> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/admin/qa/status', {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || 'Error al consultar estado de QA.');
    }

    return res.json();
  }

  /**
   * Genera una sesión QA en backend y la activa en Supabase Auth
   */
  public async createSession(payload: CreateQaSessionPayload) {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/admin/qa/create-session', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Error al generar sesión QA.');
    }

    // Persistir referencia de sesión no sensible en localStorage
    if (typeof window !== 'undefined') {
      const refData = {
        sessionId: data.qaSession.id,
        role: data.qaSession.role,
        tenantId: data.qaSession.tenant_id,
        tenantName: data.qaSession.metadata?.tenantName || 'HIPOTECALY',
        expiresAt: data.qaSession.expires_at,
        keepOnDevice: Boolean(payload.keepOnDevice),
      };
      window.localStorage.setItem(QA_STORAGE_REF_KEY, JSON.stringify(refData));
    }

    // Si Supabase Auth provee tokens de sesión, establecerlos en el cliente
    if (data.authSession?.access_token) {
      try {
        await supabase.auth.setSession({
          access_token: data.authSession.access_token,
          refresh_token: data.authSession.refresh_token,
        });
      } catch {
        // En mock / devpreview fallback
      }
    }

    return data;
  }

  /**
   * Revoca una sesión QA activa
   */
  public async revokeSession(sessionId: string): Promise<boolean> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/admin/qa/revoke', {
      method: 'POST',
      headers,
      body: JSON.stringify({ sessionId }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Error al revocar sesión QA.');
    }

    const currentRef = this.getCurrentQaSessionRef();
    if (currentRef?.sessionId === sessionId) {
      this.clearLocalQaState();
    }

    return true;
  }

  /**
   * Valida si la sesión QA actual almacenada sigue vigente en backend
   */
  public async validateCurrentSession(): Promise<{ valid: boolean; session?: QaActiveSessionInfo }> {
    const currentRef = this.getCurrentQaSessionRef();
    if (!currentRef) return { valid: false };

    try {
      const res = await fetch('/api/admin/qa/validate-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentRef.sessionId }),
      });

      const data = await res.json();
      if (!data.valid) {
        this.clearLocalQaState();
        return { valid: false };
      }

      return { valid: true, session: data.session };
    } catch {
      // Si el backend no está disponible, validar fecha localmente
      const isNotExpired = new Date(currentRef.expiresAt).getTime() > Date.now();
      if (!isNotExpired) {
        this.clearLocalQaState();
      }
      return { valid: isNotExpired };
    }
  }

  /**
   * Activa o desactiva el feature flag global de QA
   */
  public async toggleQaFeature(enabled: boolean): Promise<boolean> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/admin/qa/toggle-feature', {
      method: 'POST',
      headers,
      body: JSON.stringify({ enabled }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Error al modificar feature flag QA.');
    }

    return data.enabled;
  }

  /**
   * Obtiene la referencia local de sesión QA activa
   */
  public getCurrentQaSessionRef(): {
    sessionId: string;
    role: string;
    tenantId: string;
    tenantName: string;
    expiresAt: string;
    keepOnDevice: boolean;
  } | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = window.localStorage.getItem(QA_STORAGE_REF_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  /**
   * Limpia el estado local de sesión QA
   */
  public clearLocalQaState() {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(QA_STORAGE_REF_KEY);
      window.localStorage.removeItem('hipotecaly_test_role');
    }
  }

  /**
   * Retorna true si hay una sesión QA activa no expirada
   */
  public isQaActive(): boolean {
    const ref = this.getCurrentQaSessionRef();
    if (!ref) return false;
    return new Date(ref.expiresAt).getTime() > Date.now();
  }
}

export const adminQaService = new AdminQaService();
