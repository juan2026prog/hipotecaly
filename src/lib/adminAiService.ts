// ==============================================================================
// HIPOTECALY: Admin AI Service (Frontend Client para /api/admin/ai/*)
// Invocación segura de endpoints de administración desde el panel de Super Admin
// ==============================================================================

import { supabase } from './supabase';

export interface ModelCheckItem {
  role: string;
  model: string;
  accessible: boolean;
}

export interface AdminAiStatus {
  provider: string;
  configured: boolean;
  active: boolean;
  maskedKey: string | null;
  lastTestedAt: string | null;
  lastTestStatus: 'PASS' | 'FAIL' | 'PARTIAL' | 'UNTESTED' | string;
  lastTestMessage: string;
  secretSource: 'vault' | 'environment' | 'none';
  configuredModels: {
    extraction: string;
    reasoning: string;
    deep: string;
  };
  modelsStatus: ModelCheckItem[];
  systemHealth: {
    supabaseConnected: boolean;
    vaultActive: boolean;
    memory3Available: boolean;
    walletCasosActive: boolean;
  };
}

export interface TestConnectionResponse {
  success: boolean;
  status: 'PASS' | 'FAIL' | 'PARTIAL';
  message: string;
  testedAt: string;
  latencyMs: number;
  models?: ModelCheckItem[];
}

export interface HealthCheckResponse {
  success: boolean;
  message: string;
  reply: string;
  model: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  costUsd: number;
  latencyMs: number;
  testedAt: string;
}

class AdminAiService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      } else {
        // Token de sesión de Super Admin predeterminado para testing local
        headers['Authorization'] = 'Bearer superadmin-valid-token';
      }
    } catch {
      headers['Authorization'] = 'Bearer superadmin-valid-token';
    }

    return headers;
  }

  /**
   * Obtiene el estado actual de conexión, clave y modelos de HIPOTECALY AI
   */
  public async getStatus(): Promise<AdminAiStatus> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/admin/ai/status', {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || `HTTP ${res.status} al consultar estado.`);
    }

    return res.json();
  }

  /**
   * Carga o reemplaza la API Key en Supabase Vault previa prueba de conexión
   */
  public async saveApiKey(apiKey: string): Promise<{ success: boolean; configured: boolean; maskedKey: string; message: string }> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/admin/ai/openai-key', {
      method: 'POST',
      headers,
      body: JSON.stringify({ apiKey }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Fallo al guardar la API Key en Supabase Vault.');
    }

    return data;
  }

  /**
   * Elimina la API Key de Supabase Vault y desactiva la IA
   */
  public async deleteApiKey(): Promise<{ success: boolean; configured: boolean; active: boolean; message: string }> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/admin/ai/openai-key', {
      method: 'DELETE',
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Fallo al eliminar la API Key.');
    }

    return data;
  }

  /**
   * Ejecuta una prueba de conectividad y accesibilidad de modelos
   */
  public async testConnection(): Promise<TestConnectionResponse> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/admin/ai/test-connection', {
      method: 'POST',
      headers,
    });

    const data = await res.json();
    if (!res.ok && !data.models) {
      throw new Error(data.message || data.error || 'Fallo en la prueba de conexión.');
    }

    return data;
  }

  /**
   * Enciende el Master Switch global de HIPOTECALY AI
   */
  public async activateAi(): Promise<{ success: boolean; active: boolean; message: string }> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/admin/ai/activate', {
      method: 'POST',
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Fallo al activar HIPOTECALY AI.');
    }

    return data;
  }

  /**
   * Apaga el Master Switch global de HIPOTECALY AI sin borrar la clave
   */
  public async deactivateAi(): Promise<{ success: boolean; active: boolean; message: string }> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/admin/ai/deactivate', {
      method: 'POST',
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Fallo al desactivar HIPOTECALY AI.');
    }

    return data;
  }

  /**
   * Ejecuta una consulta de prueba técnica directa (0 costo para estudios)
   */
  public async runHealthCheck(): Promise<HealthCheckResponse> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('/api/admin/ai/health-check', {
      method: 'POST',
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || data.error || 'Fallo en la prueba técnica.');
    }

    return data;
  }
}

export const adminAiService = new AdminAiService();
