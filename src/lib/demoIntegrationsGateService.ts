// ==============================================================================
// HIPOTECALY: Control Centralizado de Seguridad para Integraciones Externas (Gate Service)
// Impide que organizaciones demo (Estudio Nova) disparen acciones externas reales
// ==============================================================================

import { supabase } from './supabase';
import { DEMO_ORGANIZATION_ID, DEMO_ORGANIZATION_SLUG, isDemoOrganization } from './demoControl';
import { auditService } from './auditService';

export interface TenantGateState {
  organizationId: string;
  organizationSlug: string;
  isDemo: boolean;
  externalIntegrationsEnabled: boolean;
  environmentMode: 'demo' | 'production';
  externalActionsMode: 'blocked' | 'allowed';
  updatedAt: string;
}

// Estado en memoria para resiliencia y pruebas
const memoryGateStates = new Map<string, TenantGateState>();

// Valores semilla iniciales
function getInitialGateState(orgIdOrSlug: string): TenantGateState {
  const isDemo = isDemoOrganization(orgIdOrSlug);
  const extEnabled = !isDemo; // Por defecto: Estudio Nova = OFF, Resto = ON

  return {
    organizationId: isDemo ? DEMO_ORGANIZATION_ID : (orgIdOrSlug.includes('-') ? orgIdOrSlug : 'a0000000-0000-0000-0000-000000000001'),
    organizationSlug: isDemo ? DEMO_ORGANIZATION_SLUG : orgIdOrSlug,
    isDemo,
    externalIntegrationsEnabled: extEnabled,
    environmentMode: isDemo ? 'demo' : 'production',
    externalActionsMode: extEnabled ? 'allowed' : 'blocked',
    updatedAt: new Date().toISOString(),
  };
}

export const demoIntegrationsGateService = {
  /**
   * Consulta el estado actual de integraciones de una organización (Supabase -> Memory -> Default)
   */
  async getTenantGateState(orgIdOrSlug: string): Promise<TenantGateState> {
    if (!orgIdOrSlug) {
      return getInitialGateState(DEMO_ORGANIZATION_ID);
    }

    const cleanKey = orgIdOrSlug.trim().toLowerCase();
    if (memoryGateStates.has(cleanKey)) {
      return memoryGateStates.get(cleanKey)!;
    }

    const isDemo = isDemoOrganization(cleanKey);
    const targetId = isDemo ? DEMO_ORGANIZATION_ID : cleanKey;

    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, slug, is_demo, external_integrations_enabled, updated_at')
        .or(`id.eq.${targetId},slug.eq.${cleanKey}`)
        .maybeSingle();

      if (!error && data) {
        const state: TenantGateState = {
          organizationId: data.id,
          organizationSlug: data.slug,
          isDemo: Boolean(data.is_demo ?? isDemo),
          externalIntegrationsEnabled: Boolean(data.external_integrations_enabled ?? !isDemo),
          environmentMode: (data.is_demo ?? isDemo) ? 'demo' : 'production',
          externalActionsMode: (data.external_integrations_enabled ?? !isDemo) ? 'allowed' : 'blocked',
          updatedAt: data.updated_at || new Date().toISOString(),
        };
        memoryGateStates.set(cleanKey, state);
        memoryGateStates.set(data.id, state);
        memoryGateStates.set(data.slug, state);
        return state;
      }
    } catch {
      // Fallback
    }

    const fallbackState = getInitialGateState(cleanKey);
    memoryGateStates.set(cleanKey, fallbackState);
    return fallbackState;
  },

  /**
   * Permite exclusivamente a super_admin actualizar el estado del gate demo/integraciones
   */
  async updateTenantGateState(
    orgId: string,
    newIsDemo: boolean,
    newExternalIntegrationsEnabled: boolean,
    actorUser?: { id?: string; email?: string; role?: string; isSuperAdmin?: boolean }
  ): Promise<{ success: boolean; state?: TenantGateState; error?: string }> {
    const isSuper = Boolean(
      actorUser?.isSuperAdmin ||
      actorUser?.role === 'super_admin' ||
      actorUser?.role === 'platform_admin'
    );

    if (!isSuper) {
      return {
        success: false,
        error: 'REGLA DE SEGURIDAD: Únicamente super_admin puede modificar el estado de integraciones externas de una organización.',
      };
    }

    try {
      // Intento de actualización vía RPC segura
      const { error: rpcErr } = await supabase.rpc('update_organization_demo_gate', {
        target_org_id: orgId,
        new_is_demo: newIsDemo,
        new_external_integrations_enabled: newExternalIntegrationsEnabled,
      });

      if (rpcErr) {
        // Fallback directo a actualización de tabla si la RPC no está desplegada en local
        await supabase
          .from('organizations')
          .update({
            is_demo: newIsDemo,
            external_integrations_enabled: newExternalIntegrationsEnabled,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orgId);
      }
    } catch {
      // Fallback local
    }

    const updatedState: TenantGateState = {
      organizationId: orgId,
      organizationSlug: isDemoOrganization(orgId) ? DEMO_ORGANIZATION_SLUG : 'organization',
      isDemo: newIsDemo,
      externalIntegrationsEnabled: newExternalIntegrationsEnabled,
      environmentMode: newIsDemo ? 'demo' : 'production',
      externalActionsMode: newExternalIntegrationsEnabled ? 'allowed' : 'blocked',
      updatedAt: new Date().toISOString(),
    };

    memoryGateStates.set(orgId, updatedState);
    if (isDemoOrganization(orgId)) {
      memoryGateStates.set(DEMO_ORGANIZATION_SLUG, updatedState);
      memoryGateStates.set(DEMO_ORGANIZATION_ID, updatedState);
    }

    // Registrar en auditoría
    try {
      await auditService.logEvent({
        organizationId: orgId,
        action: 'ORGANIZATION_DEMO_MODE_CHANGED',
        entityType: 'organization',
        entityId: orgId,
        actorEmail: actorUser?.email || 'superadmin@hipotecaly.uy',
        metadata: {
          is_demo: newIsDemo,
          external_integrations_enabled: newExternalIntegrationsEnabled,
          timestamp: new Date().toISOString(),
        },
      });

      if (newExternalIntegrationsEnabled) {
        await auditService.logEvent({
          organizationId: orgId,
          action: 'EXTERNAL_INTEGRATIONS_ENABLED',
          entityType: 'organization',
          entityId: orgId,
          actorEmail: actorUser?.email || 'superadmin@hipotecaly.uy',
        });
      } else {
        await auditService.logEvent({
          organizationId: orgId,
          action: 'EXTERNAL_INTEGRATIONS_DISABLED',
          entityType: 'organization',
          entityId: orgId,
          actorEmail: actorUser?.email || 'superadmin@hipotecaly.uy',
        });
      }
    } catch {
      // Non-blocking
    }

    return { success: true, state: updatedState };
  },

  /**
   * Verifica si una acción externa real está autorizada para una organización dada
   */
  async isExternalActionAllowed(
    orgIdOrSlug: string,
    integrationName: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const state = await this.getTenantGateState(orgIdOrSlug);

    if (!state.externalIntegrationsEnabled) {
      // Registrar evento de bloqueo en auditoría
      try {
        await auditService.logEvent({
          organizationId: state.organizationId,
          action: 'EXTERNAL_ACTION_BLOCKED_DEMO',
          entityType: 'integration',
          entityId: integrationName,
          metadata: {
            integration: integrationName,
            is_demo: state.isDemo,
            external_integrations_enabled: state.externalIntegrationsEnabled,
            timestamp: new Date().toISOString(),
          },
        });
      } catch {
        // Non-blocking
      }

      return {
        allowed: false,
        reason: `[MODO DEMO] Acción externa '${integrationName}' bloqueada por configuración de Super Admin.`,
      };
    }

    return { allowed: true };
  },

  /**
   * Retorna el resumen de estado granular para la UI de Super Admin
   */
  async getIntegrationStatusSummary(orgIdOrSlug: string): Promise<
    Array<{ integration: string; name: string; statusLabel: string; isBlocked: boolean }>
  > {
    const state = await this.getTenantGateState(orgIdOrSlug);
    const isBlocked = !state.externalIntegrationsEnabled;

    return [
      {
        integration: 'didit_kyc',
        name: 'Didit KYC (Identidad)',
        statusLabel: isBlocked ? 'Bloqueado por modo demo / Simulación' : 'Activo (Producción)',
        isBlocked,
      },
      {
        integration: 'google_calendar',
        name: 'Google Calendar API',
        statusLabel: isBlocked ? 'Bloqueado por modo demo / Agenda interna' : 'API Real Conectada',
        isBlocked,
      },
      {
        integration: 'resend_email',
        name: 'Emails / Resend',
        statusLabel: isBlocked ? 'Bloqueado por modo demo / Sandbox QA' : 'Envío Real Activo',
        isBlocked,
      },
      {
        integration: 'digital_signature',
        name: 'Firma electrónica',
        statusLabel: isBlocked ? 'Simulación (DEMO)' : 'Firma.gub.uy Habilitada',
        isBlocked,
      },
      {
        integration: 'external_webhooks',
        name: 'Webhooks externos',
        statusLabel: isBlocked ? 'Bloqueados' : 'Despacho Activo',
        isBlocked,
      },
    ];
  },
};
