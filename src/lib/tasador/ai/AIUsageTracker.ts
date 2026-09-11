// ==============================================================================
// HIPOTECALY TASADOR IA - TRACKER DE USO Y COSTOS DE IA (FASE 4)
// Registro Append-Only, Auditoría de Tokens y Cálculo de Costo por Tasación
// ==============================================================================

import { AIUsageEvent } from './aiTypes';

export class AIUsageTracker {
  private static instance: AIUsageTracker;
  private events: AIUsageEvent[] = [];

  // Tarifario de referencia vigente para modelos estándar
  private static readonly MODEL_PRICING: Record<
    string,
    { inputCostPer1M: number; outputCostPer1M: number; imageCostUsd: number }
  > = {
    'gpt-4o': { inputCostPer1M: 5.0, outputCostPer1M: 15.0, imageCostUsd: 0.0025 },
    'gpt-4o-mini': { inputCostPer1M: 0.15, outputCostPer1M: 0.60, imageCostUsd: 0.0008 },
    'local_heuristic': { inputCostPer1M: 0.0, outputCostPer1M: 0.0, imageCostUsd: 0.0 },
  };

  private constructor() {}

  public static getInstance(): AIUsageTracker {
    if (!AIUsageTracker.instance) {
      AIUsageTracker.instance = new AIUsageTracker();
    }
    return AIUsageTracker.instance;
  }

  /**
   * Registra un evento de consumo de IA
   */
  public logEvent(params: {
    valuationId?: string;
    propertyMasterId?: string;
    eventType: 'TEXT_FEATURE_EXTRACTION' | 'VISION_ANALYSIS' | 'VALUATION_EXPLANATION';
    provider: 'openai' | 'local_heuristic';
    modelName: string;
    inputTokens: number;
    outputTokens: number;
    executionTimeMs: number;
    imagesCount?: number;
    success: boolean;
    errorCode?: string | null;
  }): AIUsageEvent {
    const pricing = AIUsageTracker.MODEL_PRICING[params.modelName] || AIUsageTracker.MODEL_PRICING['gpt-4o-mini'];

    const tokenCost =
      (params.inputTokens / 1_000_000) * pricing.inputCostPer1M +
      (params.outputTokens / 1_000_000) * pricing.outputCostPer1M;

    const imageCost = (params.imagesCount || 0) * pricing.imageCostUsd;
    const estimatedCostUsd = Number((tokenCost + imageCost).toFixed(6));

    const event: AIUsageEvent = {
      id: `ai_ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      valuationId: params.valuationId,
      propertyMasterId: params.propertyMasterId,
      eventType: params.eventType,
      provider: params.provider,
      modelName: params.modelName,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      totalTokens: params.inputTokens + params.outputTokens,
      estimatedCostUsd,
      executionTimeMs: params.executionTimeMs,
      imagesCount: params.imagesCount || 0,
      success: params.success,
      errorCode: params.errorCode || null,
      createdAt: new Date().toISOString(),
    };

    this.events.push(event);
    return event;
  }

  /**
   * Calcula el costo total y desglose para una tasación específica
   */
  public getValuationCostSummary(valuationId: string): {
    totalCostUsd: number;
    textCostUsd: number;
    visionCostUsd: number;
    explanationCostUsd: number;
    totalTokens: number;
    eventsCount: number;
  } {
    const valEvents = this.events.filter((e) => e.valuationId === valuationId);

    let textCostUsd = 0;
    let visionCostUsd = 0;
    let explanationCostUsd = 0;
    let totalTokens = 0;

    for (const ev of valEvents) {
      totalTokens += ev.totalTokens;
      if (ev.eventType === 'TEXT_FEATURE_EXTRACTION') textCostUsd += ev.estimatedCostUsd;
      else if (ev.eventType === 'VISION_ANALYSIS') visionCostUsd += ev.estimatedCostUsd;
      else if (ev.eventType === 'VALUATION_EXPLANATION') explanationCostUsd += ev.estimatedCostUsd;
    }

    return {
      totalCostUsd: Number((textCostUsd + visionCostUsd + explanationCostUsd).toFixed(6)),
      textCostUsd: Number(textCostUsd.toFixed(6)),
      visionCostUsd: Number(visionCostUsd.toFixed(6)),
      explanationCostUsd: Number(explanationCostUsd.toFixed(6)),
      totalTokens,
      eventsCount: valEvents.length,
    };
  }

  /**
   * Resumen global para métricas de Super Admin
   */
  public getGlobalStats(): {
    totalEvents: number;
    totalCostUsd: number;
    todayCostUsd: number;
    monthCostUsd: number;
    avgCostPerValuationUsd: number;
    totalTokens: number;
    errorCount: number;
  } {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalCost = 0;
    let todayCost = 0;
    let monthCost = 0;
    let totalTokens = 0;
    let errorCount = 0;

    const valuationsSeen = new Set<string>();

    for (const ev of this.events) {
      totalCost += ev.estimatedCostUsd;
      totalTokens += ev.totalTokens;
      if (!ev.success) errorCount++;
      if (ev.valuationId) valuationsSeen.add(ev.valuationId);

      const evDate = new Date(ev.createdAt);
      if (ev.createdAt.startsWith(todayStr)) {
        todayCost += ev.estimatedCostUsd;
      }
      if (evDate.getMonth() === currentMonth && evDate.getFullYear() === currentYear) {
        monthCost += ev.estimatedCostUsd;
      }
    }

    const valCount = Math.max(1, valuationsSeen.size);
    const avgCostPerValuationUsd = Number((totalCost / valCount).toFixed(4));

    return {
      totalEvents: this.events.length,
      totalCostUsd: Number(totalCost.toFixed(4)),
      todayCostUsd: Number(todayCost.toFixed(4)),
      monthCostUsd: Number(monthCost.toFixed(4)),
      avgCostPerValuationUsd,
      totalTokens,
      errorCount,
    };
  }

  public getAllEvents(): AIUsageEvent[] {
    return [...this.events];
  }

  public clear(): void {
    this.events = [];
  }
}
