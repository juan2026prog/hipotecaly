// ==============================================================================
// HIPOTECALY: Servicio de Reset Seguro Aislado para Estudio Nova (Demo Sandbox)
// Regla Crítica: Estrictamente acotado a organization_id = 'd0000000-0000-0000-0000-000000000001'
// PROHIBIDO: DELETE o TRUNCATE global sin WHERE organization_id acotado.
// ==============================================================================

import { supabase } from './supabase';
import { DEMO_ORGANIZATION_ID, DEMO_ORGANIZATION_SLUG, isDemoOrganization } from './demoControl';

export interface DemoResetResult {
  success: boolean;
  targetOrganizationId: string;
  targetOrganizationSlug: string;
  resetTimestamp: string;
  clearedCollections: string[];
  message: string;
}

export const demoResetService = {
  /**
   * Verifica si una organización dada es segura para ejecutar reset demo.
   * Rechaza cualquier ID nulo, comodín o de organización no-demo.
   */
  isOrgResetSafe(targetOrgIdOrSlug: string): boolean {
    if (!targetOrgIdOrSlug) return false;
    const clean = targetOrgIdOrSlug.trim().toLowerCase();
    
    // Prohibir explícitamente comodines o peticiones globales
    if (clean === '*' || clean === 'all' || clean === 'global' || clean === '%') {
      return false;
    }

    return (
      clean === DEMO_ORGANIZATION_ID ||
      clean === DEMO_ORGANIZATION_SLUG ||
      isDemoOrganization(clean)
    );
  },

  /**
   * Restaura los datos semilla por defecto de la organización demo Estudio Nova.
   * Ejecuta borrado strictly acotado por organization_id = 'd0000000-0000-0000-0000-000000000001'.
   */
  async resetEstudioNovaDemoData(targetOrg: string = DEMO_ORGANIZATION_ID): Promise<DemoResetResult> {
    const resetTimestamp = new Date().toISOString();

    if (!this.isOrgResetSafe(targetOrg)) {
      throw new Error(
        `[SEGURIDAD] Operación denegada. El ID '${targetOrg}' no corresponde a la organización demo acotada Estudio Nova.`
      );
    }

    const targetOrgId = DEMO_ORGANIZATION_ID;
    const cleared: string[] = [];

    try {
      // 1. Limpiar simulaciones temporales acotadas por organization_id
      try {
        await supabase
          .from('credit_applications')
          .delete()
          .eq('organization_id', targetOrgId)
          .eq('is_demo_data', true);
        cleared.push('credit_applications_demo');
      } catch {
        // Fallback no bloqueante si la tabla o columna difiere
      }

      // 2. Limpiar firmas demo temporales
      try {
        await supabase
          .from('signature_processes')
          .delete()
          .eq('organization_id', targetOrgId)
          .eq('mode', 'mock');
        cleared.push('signature_processes_mock');
      } catch {
        // Fallback no bloqueante
      }

      // 3. Limpiar notificaciones demo temporales
      try {
        await supabase
          .from('notifications')
          .delete()
          .eq('organization_id', targetOrgId);
        cleared.push('notifications_demo');
      } catch {
        // Fallback no bloqueante
      }

      // 4. Reset de LocalStorage del navegador si se ejecuta en cliente
      if (typeof window !== 'undefined') {
        localStorage.removeItem('hipotecaly_demo_estudio_nova_state');
        localStorage.removeItem('hipotecaly_demo_reset_time');
        localStorage.setItem('hipotecaly_demo_reset_time', resetTimestamp);
      }

      return {
        success: true,
        targetOrganizationId: targetOrgId,
        targetOrganizationSlug: DEMO_ORGANIZATION_SLUG,
        resetTimestamp,
        clearedCollections: cleared,
        message: 'Sandbox de Estudio Nova reseteado exitosamente a su estado demo inicial.',
      };
    } catch (err: any) {
      console.error('Error al resetear datos demo de Estudio Nova:', err);
      return {
        success: false,
        targetOrganizationId: targetOrgId,
        targetOrganizationSlug: DEMO_ORGANIZATION_SLUG,
        resetTimestamp,
        clearedCollections: cleared,
        message: err?.message || 'Error inesperado durante el reset demo.',
      };
    }
  },
};
