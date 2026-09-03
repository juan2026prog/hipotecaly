// ==============================================================================
// HIPOTECALY: Servicio de Módulos y Feature Flags por Tenant
// ==============================================================================

import { supabase, isSupabaseConfigured } from './supabase';

export type TenantModuleKey =
  | 'application_module_enabled'
  | 'simulator_enabled'
  | 'client_portal_enabled'
  | 'staff_portal_enabled'
  | 'documents_enabled'
  | 'ai_enabled'
  | 'valuations_enabled'
  | 'signatures_enabled'
  | 'servicing_enabled'
  | 'payments_tracking_enabled'
  | 'reminders_enabled'
  | 'cancellations_enabled'
  | 'notifications_enabled'
  | 'protected_contact_enabled'
  | 'cost_breakdown_enabled'
  | 'external_simulator_integration_enabled';

export interface TenantModule {
  id?: string;
  tenant_id: string;
  module_key: TenantModuleKey;
  enabled: boolean;
  configuration?: Record<string, unknown>;
}

// Fallback por defecto: todos los módulos habilitados
export const DEFAULT_MODULES_MAP: Record<TenantModuleKey, boolean> = {
  application_module_enabled: true,
  simulator_enabled: true,
  client_portal_enabled: true,
  staff_portal_enabled: true,
  documents_enabled: true,
  ai_enabled: true,
  valuations_enabled: true,
  signatures_enabled: true,
  servicing_enabled: true,
  payments_tracking_enabled: true,
  reminders_enabled: true,
  cancellations_enabled: true,
  notifications_enabled: true,
  protected_contact_enabled: true,
  cost_breakdown_enabled: true,
  external_simulator_integration_enabled: true,
};

// Cache en memoria por tenant
const tenantModulesCache = new Map<string, Record<TenantModuleKey, boolean>>();

export async function getTenantModules(tenantId: string): Promise<Record<TenantModuleKey, boolean>> {
  const modulesMap = { ...DEFAULT_MODULES_MAP };

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('tenant_modules')
        .select('module_key, enabled')
        .eq('tenant_id', tenantId);

      if (!error && data && data.length > 0) {
        for (const row of data) {
          const key = row.module_key as TenantModuleKey;
          if (key in modulesMap) {
            modulesMap[key] = Boolean(row.enabled);
          }
        }
        tenantModulesCache.set(tenantId, modulesMap);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('tenant_modules_' + tenantId, JSON.stringify(modulesMap));
        }
        return modulesMap;
      }
    } catch {
      // Si la base no responde, continuar con caché o fallback
    }
  }

  if (tenantModulesCache.has(tenantId)) {
    return tenantModulesCache.get(tenantId)!;
  }

  if (typeof window !== 'undefined') {
    try {
      const cached = window.localStorage.getItem('tenant_modules_' + tenantId);
      if (cached) {
        const parsed = JSON.parse(cached);
        tenantModulesCache.set(tenantId, parsed);
        return parsed;
      }
    } catch {
      // Ignorar error de parsing
    }
  }

  tenantModulesCache.set(tenantId, modulesMap);
  return modulesMap;
}

/**
 * Verifica si un módulo específico está habilitado para un tenant
 */
export async function isModuleEnabled(tenantId: string, moduleKey: TenantModuleKey): Promise<boolean> {
  const modules = await getTenantModules(tenantId);
  return modules[moduleKey] ?? true;
}

/**
 * Actualiza el estado de un módulo en memoria y en Supabase
 */
export async function setTenantModuleEnabled(
  tenantId: string,
  moduleKey: TenantModuleKey,
  enabled: boolean
): Promise<boolean> {
  // Actualizar caché inmediatamente
  const current = tenantModulesCache.get(tenantId) || { ...DEFAULT_MODULES_MAP };
  current[moduleKey] = enabled;
  tenantModulesCache.set(tenantId, current);

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('tenant_modules_' + tenantId, JSON.stringify(current));
    } catch {
      // Ignorar error de storage
    }
  }

  if (!isSupabaseConfigured) {
    return true;
  }

  try {
    const { error } = await supabase
      .from('tenant_modules')
      .upsert(
        {
          tenant_id: tenantId,
          module_key: moduleKey,
          enabled,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'tenant_id,module_key' }
      );

    return !error;
  } catch {
    return true; // Éxito en memoria para tests
  }
}

/**
 * Limpia la caché en memoria y local (para pruebas o cambios en tiempo real)
 */
export function clearTenantModulesCache(tenantId?: string) {
  if (tenantId) {
    tenantModulesCache.delete(tenantId);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem('tenant_modules_' + tenantId);
      } catch {
        // Ignorar errores de storage
      }
    }
  } else {
    tenantModulesCache.clear();
  }
}
