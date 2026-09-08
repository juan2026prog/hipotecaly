// ==============================================================================
// HIPOTECALY: Servicio de Simulaciones del Cliente (Persistencia Real Supabase)
// Permite guardar, listar, eliminar y vincular simulaciones con solicitudes reales.
// Gestiona el guardado seguro temporal pre-autenticación y consolidación en Supabase.
// ==============================================================================

import { supabase } from './supabase';

export interface SavedSimulation {
  id: string;
  userId?: string;
  organizationId?: string;
  requestedAmount: number;
  currency: string;
  propertyValue: number;
  termMonths: number;
  propertyType: string;
  department: string;
  legalStatus?: string;
  incomeType?: string;
  repaymentMode?: string;
  monthlyPaymentEstimated: number;
  rateAnnual: number;
  ltvPercentage: number;
  closingCostsEstimated?: number;
  createdAt: string;
  applicationId?: string;
  applicationPublicId?: string;
}

const PENDING_SIMULATION_KEY = 'hipotecaly_pending_simulation_v1';
const LOCAL_CACHE_KEY_PREFIX = 'hipotecaly_saved_sims_cache_';

function getCacheKey(userId?: string): string {
  return `${LOCAL_CACHE_KEY_PREFIX}${userId || 'guest'}`;
}

export const clientSimulationService = {
  /**
   * Obtiene todas las simulaciones guardadas reales de Supabase para el usuario autenticado
   */
  async getSavedSimulations(userId?: string, organizationId?: string): Promise<SavedSimulation[]> {
    if (!userId) {
      // Si no está autenticado, revisar si hay alguna guardada localmente
      const localStr = localStorage.getItem(getCacheKey(userId));
      return localStr ? JSON.parse(localStr) : [];
    }

    try {
      let query = supabase
        .from('simulations')
        .select(`
          id,
          user_id,
          organization_id,
          requested_amount,
          currency,
          property_value,
          term_months,
          property_type,
          department,
          legal_status,
          income_type,
          repayment_mode,
          monthly_payment_estimated,
          rate_annual,
          ltv_percentage,
          closing_costs_estimated,
          application_id,
          created_at,
          applications (
            id,
            public_id
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (organizationId && organizationId !== 'a0000000-0000-0000-0000-000000000001') {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;

      if (error) {
        // Fallback a caché local si la tabla aún no existe o hubo error de red
        const localData = localStorage.getItem(getCacheKey(userId));
        return localData ? JSON.parse(localData) : [];
      }

      const mapped: SavedSimulation[] = (data || []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        organizationId: row.organization_id,
        requestedAmount: Number(row.requested_amount),
        currency: row.currency || 'USD',
        propertyValue: Number(row.property_value),
        termMonths: row.term_months || 36,
        propertyType: row.property_type || 'apartamento',
        department: row.department || 'Montevideo',
        legalStatus: row.legal_status,
        incomeType: row.income_type,
        repaymentMode: row.repayment_mode || 'solo_intereses',
        monthlyPaymentEstimated: Number(row.monthly_payment_estimated),
        rateAnnual: Number(row.rate_annual) || 11.0,
        ltvPercentage: Number(row.ltv_percentage),
        closingCostsEstimated: Number(row.closing_costs_estimated) || 0,
        createdAt: row.created_at,
        applicationId: row.application_id,
        applicationPublicId: row.applications?.public_id,
      }));

      // Actualizar caché local
      localStorage.setItem(getCacheKey(userId), JSON.stringify(mapped));
      return mapped;
    } catch {
      const localData = localStorage.getItem(getCacheKey(userId));
      return localData ? JSON.parse(localData) : [];
    }
  },

  /**
   * Guarda una nueva simulación explícitamente en Supabase
   */
  async saveSimulation(
    simData: Omit<SavedSimulation, 'id' | 'createdAt'>,
    userId?: string,
    organizationId?: string
  ): Promise<SavedSimulation> {
    const orgId = organizationId || simData.organizationId || 'a0000000-0000-0000-0000-000000000001';
    const now = new Date().toISOString();

    if (userId) {
      try {
        const { data, error } = await supabase
          .from('simulations')
          .insert({
            user_id: userId,
            organization_id: orgId,
            requested_amount: simData.requestedAmount,
            currency: simData.currency || 'USD',
            property_value: simData.propertyValue,
            term_months: simData.termMonths,
            property_type: simData.propertyType,
            department: simData.department,
            legal_status: simData.legalStatus || 'libre_gravamenes',
            income_type: simData.incomeType || 'dependiente',
            repayment_mode: simData.repaymentMode || 'solo_intereses',
            monthly_payment_estimated: simData.monthlyPaymentEstimated,
            rate_annual: simData.rateAnnual || 11.0,
            ltv_percentage: simData.ltvPercentage,
            closing_costs_estimated: simData.closingCostsEstimated || 0,
          })
          .select()
          .single();

        if (!error && data) {
          const newSim: SavedSimulation = {
            id: data.id,
            userId: data.user_id,
            organizationId: data.organization_id,
            requestedAmount: Number(data.requested_amount),
            currency: data.currency,
            propertyValue: Number(data.property_value),
            termMonths: data.term_months,
            propertyType: data.property_type,
            department: data.department,
            legalStatus: data.legal_status,
            incomeType: data.income_type,
            repaymentMode: data.repayment_mode,
            monthlyPaymentEstimated: Number(data.monthly_payment_estimated),
            rateAnnual: Number(data.rate_annual),
            ltvPercentage: Number(data.ltv_percentage),
            closingCostsEstimated: Number(data.closing_costs_estimated),
            createdAt: data.created_at,
          };

          // Actualizar caché local
          const cached = await this.getSavedSimulations(userId, orgId);
          localStorage.setItem(getCacheKey(userId), JSON.stringify([newSim, ...cached.filter((s) => s.id !== newSim.id)]));
          return newSim;
        }
      } catch (e) {
        console.warn('Fallo al guardar simulación en Supabase, guardando en respaldo local:', e);
      }
    }

    // Respaldo local si no hay auth o falló Supabase
    const fallbackSim: SavedSimulation = {
      ...simData,
      id: `sim-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      organizationId: orgId,
      createdAt: now,
    };

    const cached = await this.getSavedSimulations(userId, orgId);
    localStorage.setItem(getCacheKey(userId), JSON.stringify([fallbackSim, ...cached]));
    return fallbackSim;
  },

  /**
   * Elimina una simulación guardada
   */
  async deleteSimulation(simulationId: string, userId?: string): Promise<boolean> {
    if (userId && !simulationId.startsWith('sim-')) {
      try {
        await supabase
          .from('simulations')
          .delete()
          .eq('id', simulationId)
          .eq('user_id', userId);
      } catch (e) {
        console.warn('Error al eliminar simulación en Supabase:', e);
      }
    }

    const key = getCacheKey(userId);
    const existing = localStorage.getItem(key);
    if (existing) {
      try {
        const parsed: SavedSimulation[] = JSON.parse(existing);
        const filtered = parsed.filter((s) => s.id !== simulationId);
        localStorage.setItem(key, JSON.stringify(filtered));
      } catch {}
    }

    return true;
  },

  /**
   * Vincula una simulación con una solicitud creada
   */
  async linkSimulationToApplication(
    simulationId: string,
    applicationId: string,
    applicationPublicId?: string,
    userId?: string
  ): Promise<void> {
    if (userId && !simulationId.startsWith('sim-')) {
      try {
        await supabase
          .from('simulations')
          .update({
            application_id: applicationId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', simulationId);
      } catch (e) {
        console.warn('Error al vincular simulación con solicitud en Supabase:', e);
      }
    }

    const key = getCacheKey(userId);
    const existing = localStorage.getItem(key);
    if (existing) {
      try {
        const parsed: SavedSimulation[] = JSON.parse(existing);
        const updated = parsed.map((s) =>
          s.id === simulationId
            ? { ...s, applicationId, applicationPublicId: applicationPublicId || s.applicationPublicId }
            : s
        );
        localStorage.setItem(key, JSON.stringify(updated));
      } catch {}
    }
  },

  /**
   * Guarda temporalmente una simulación pre-autenticación
   */
  savePendingSimulation(simData: Omit<SavedSimulation, 'id' | 'createdAt'>): void {
    try {
      localStorage.setItem(
        PENDING_SIMULATION_KEY,
        JSON.stringify({
          ...simData,
          savedAt: new Date().toISOString(),
        })
      );
    } catch {}
  },

  /**
   * Recupera la simulación pendiente si existe
   */
  getPendingSimulation(): (Omit<SavedSimulation, 'id' | 'createdAt'> & { savedAt: string }) | null {
    try {
      const data = localStorage.getItem(PENDING_SIMULATION_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  /**
   * Borra la simulación pendiente
   */
  clearPendingSimulation(): void {
    try {
      localStorage.removeItem(PENDING_SIMULATION_KEY);
    } catch {}
  },

  /**
   * Consolida la simulación pendiente en Supabase una vez que el usuario se autentica
   */
  async consolidatePendingSimulation(userId: string, organizationId?: string): Promise<SavedSimulation | null> {
    const pending = this.getPendingSimulation();
    if (!pending) return null;

    try {
      const saved = await this.saveSimulation(pending, userId, organizationId);
      this.clearPendingSimulation();
      return saved;
    } catch {
      return null;
    }
  },
};
