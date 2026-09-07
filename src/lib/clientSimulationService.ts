// ==============================================================================
// HIPOTECALY: Servicio de Simulaciones del Cliente
// Permite guardar, listar, eliminar y vincular simulaciones con solicitudes.
// Gestiona el guardado seguro temporal pre-autenticación.
// ==============================================================================

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
const SAVED_SIMULATIONS_PREFIX = 'hipotecaly_saved_simulations_';

function getStorageKey(userId?: string): string {
  return `${SAVED_SIMULATIONS_PREFIX}${userId || 'guest'}`;
}

export const clientSimulationService = {
  /**
   * Obtiene todas las simulaciones guardadas por un usuario
   */
  getSavedSimulations(userId?: string): SavedSimulation[] {
    try {
      const key = getStorageKey(userId);
      const data = localStorage.getItem(key);
      if (!data) {
        // Semilla de demostración si es usuario demo
        if (userId && (userId.includes('borrower') || userId.includes('test') || userId === 'u-test-borrower')) {
          const demoSimulations: SavedSimulation[] = [
            {
              id: 'sim-demo-01',
              userId,
              requestedAmount: 80000,
              currency: 'USD',
              propertyValue: 220000,
              termMonths: 36,
              propertyType: 'apartamento',
              department: 'Montevideo',
              repaymentMode: 'solo_intereses',
              monthlyPaymentEstimated: 733,
              rateAnnual: 11.0,
              ltvPercentage: 36.36,
              closingCostsEstimated: 2420,
              createdAt: '2026-09-07T14:30:00Z',
              applicationPublicId: 'HIP-2026-43776',
            },
            {
              id: 'sim-demo-02',
              userId,
              requestedAmount: 50000,
              currency: 'USD',
              propertyValue: 160000,
              termMonths: 24,
              propertyType: 'casa',
              department: 'Canelones',
              repaymentMode: 'solo_intereses',
              monthlyPaymentEstimated: 458,
              rateAnnual: 11.0,
              ltvPercentage: 31.25,
              closingCostsEstimated: 1800,
              createdAt: '2026-09-05T10:15:00Z',
            },
          ];
          localStorage.setItem(key, JSON.stringify(demoSimulations));
          return demoSimulations;
        }
        return [];
      }
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  /**
   * Guarda una nueva simulación explícitamente para el usuario
   */
  saveSimulation(
    simData: Omit<SavedSimulation, 'id' | 'createdAt'>,
    userId?: string
  ): SavedSimulation {
    const newSim: SavedSimulation = {
      ...simData,
      id: `sim-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      createdAt: new Date().toISOString(),
    };

    try {
      const existing = this.getSavedSimulations(userId);
      const updated = [newSim, ...existing.filter((s) => s.id !== newSim.id)];
      localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
    } catch {
      // Ignorar error de storage
    }

    return newSim;
  },

  /**
   * Elimina una simulación guardada
   */
  deleteSimulation(simulationId: string, userId?: string): boolean {
    try {
      const existing = this.getSavedSimulations(userId);
      const filtered = existing.filter((s) => s.id !== simulationId);
      localStorage.setItem(getStorageKey(userId), JSON.stringify(filtered));
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Vincula una simulación con una solicitud iniciada
   */
  linkSimulationToApplication(
    simulationId: string,
    applicationPublicId: string,
    userId?: string
  ): void {
    try {
      const existing = this.getSavedSimulations(userId);
      const updated = existing.map((s) =>
        s.id === simulationId ? { ...s, applicationPublicId } : s
      );
      localStorage.setItem(getStorageKey(userId), JSON.stringify(updated));
    } catch {
      // Ignorar error
    }
  },

  /**
   * Guarda temporalmente una simulación pendiente cuando el usuario NO está autenticado
   */
  setPendingSimulation(simData: Omit<SavedSimulation, 'id' | 'createdAt'>): void {
    try {
      localStorage.setItem(PENDING_SIMULATION_KEY, JSON.stringify(simData));
    } catch {
      // Ignorar error
    }
  },

  /**
   * Obtiene la simulación pendiente si existe
   */
  getPendingSimulation(): Omit<SavedSimulation, 'id' | 'createdAt'> | null {
    try {
      const data = localStorage.getItem(PENDING_SIMULATION_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  /**
   * Limpia la simulación pendiente
   */
  clearPendingSimulation(): void {
    try {
      localStorage.removeItem(PENDING_SIMULATION_KEY);
    } catch {
      // Ignorar error
    }
  },

  /**
   * Consolida la simulación pendiente en la cuenta del usuario recién autenticado
   */
  consolidatePendingSimulation(userId: string): SavedSimulation | null {
    const pending = this.getPendingSimulation();
    if (!pending) return null;

    const saved = this.saveSimulation(pending, userId);
    this.clearPendingSimulation();
    return saved;
  },
};
