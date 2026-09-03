// ==============================================================================
// HIPOTECALY AI CORE: Cliente Frontend Seguro (Server-Side Execution via HTTP)
// ==============================================================================

import {
  HipotecalyAiReport,
  AiEstimationResult,
  AiWalletState,
  ApplicationCaseInput,
} from './ai/types';

export class AiService {
  /**
   * Ejecuta el análisis de un expediente hipotecario (CASO).
   * Llama exclusivamente al endpoint serverless server-side /api/ai/analyze.
   */
  public async runCaseAnalysis(params: ApplicationCaseInput): Promise<{
    report: HipotecalyAiReport;
    walletDeduction: {
      success: boolean;
      promotionalDeducted: number;
      purchasedDeducted: number;
      isFullyCoveredByHipotecaly: boolean;
      remainingTotal: number;
      message: string;
    };
  }> {
    const response = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(err.message || err.error || `HTTP ${response.status}: Error al analizar caso`);
    }

    return await response.json();
  }

  /**
   * Obtiene la estimación de consumo antes de lanzar el análisis
   */
  public async estimateCaseConsumption(params: {
    organizationId: string;
    pagesCount: number;
    imagesCount: number;
    documentsCount: number;
    cachedDocumentsCount?: number;
    runType?: 'preliminary' | 'full' | 'deep';
  }): Promise<AiEstimationResult> {
    const response = await fetch('/api/ai/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(err.message || err.error || 'Error al estimar consumo');
    }

    return await response.json();
  }

  /**
   * Obtiene el estado de la billetera del estudio
   */
  public async getWalletState(organizationId: string): Promise<AiWalletState> {
    try {
      const response = await fetch(`/api/ai/wallet?organizationId=${encodeURIComponent(organizationId)}`);
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Fallback para dev local
    }

    return {
      organizationId,
      promotionalCaseBalance: 10,
      purchasedCaseBalance: 0,
      totalCaseBalance: 10,
      currentPromoMonth: 1,
      isFreeTierActive: true,
      promoCasesGrantedMonth: 10,
    };
  }

  /**
   * Guarda una corrección humana profesional
   */
  public async submitHumanCorrection(params: {
    applicationId: string;
    conclusionId?: string;
    itemCategory: string;
    action: 'confirm' | 'correct' | 'request_doc' | 'incorrect_ai';
    originalAiOutput: unknown;
    humanCorrectionText: string;
    correctionReason: string;
    department: string;
    propertyType: string;
  }): Promise<boolean> {
    try {
      const response = await fetch('/api/ai/corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return response.ok;
    } catch {
      return true;
    }
  }

  /**
   * Registra una recarga de CASOS comprados
   */
  public async purchaseCases(organizationId: string, caseUnits: number): Promise<AiWalletState> {
    const response = await fetch('/api/ai/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId, action: 'purchase', caseUnits }),
    });
    if (!response.ok) {
      throw new Error('Error al recargar saldo');
    }
    return await response.json();
  }

  /**
   * Concede créditos del mes según el esquema 10/5/3
   */
  public async grantMonthlyCredits(organizationId: string, monthNumber: number): Promise<AiWalletState> {
    const response = await fetch('/api/ai/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId, action: 'grant_promo', monthNumber }),
    });
    if (!response.ok) {
      throw new Error('Error al asignar créditos promocionales');
    }
    return await response.json();
  }
}

export const aiService = new AiService();
