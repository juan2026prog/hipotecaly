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

  /**
   * Envía un mensaje al Asistente IA contextual del expediente
   */
  public async sendChatMessage(params: {
    message: string;
    applicationId?: string;
    conversationId?: string;
    model?: string;
  }): Promise<{
    success: boolean;
    conversationId: string;
    message: string;
    sources: Array<{ title: string; type: string; id?: string }>;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      costUsd: number;
    };
  }> {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(err.message || err.error || `HTTP ${response.status}: Error al consultar asistente`);
    }

    return await response.json();
  }

  /**
   * Obtiene el historial de mensajes de la conversación
   */
  public async getChatHistory(params: {
    applicationId?: string;
    conversationId?: string;
  }): Promise<{
    conversationId: string | null;
    messages: Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
      sources?: Array<{ title: string; type: string; id?: string }>;
      created_at: string;
    }>;
  }> {
    const query = new URLSearchParams();
    if (params.applicationId) query.set('applicationId', params.applicationId);
    if (params.conversationId) query.set('conversationId', params.conversationId);

    const response = await fetch(`/api/ai/chat/history?${query.toString()}`);
    if (!response.ok) {
      return { conversationId: null, messages: [] };
    }

    return await response.json();
  }

  /**
   * Reinicia o elimina la conversación activa
   */
  public async clearConversation(params: {
    applicationId?: string;
    conversationId?: string;
  }): Promise<boolean> {
    const response = await fetch('/api/ai/chat/conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    return response.ok;
  }

  /**
   * Obtiene el estado del proveedor de IA y modelos disponibles
   */
  public async getAiStatus(): Promise<{
    configured: boolean;
    active: boolean;
    models: {
      extraction: string;
      reasoning: string;
      deep: string;
      embeddings: string;
    };
  }> {
    try {
      const response = await fetch('/api/ai/status');
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Fallback
    }

    return {
      configured: true,
      active: true,
      models: {
        extraction: 'gpt-4o-mini',
        reasoning: 'gpt-4o',
        deep: 'o3-mini',
        embeddings: 'text-embedding-3-small',
      },
    };
  }
}

export const aiService = new AiService();

