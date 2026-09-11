// ==============================================================================
// HIPOTECALY TASADOR IA - SERVICIO DE FEEDBACK CUALITATIVO (FASE 6)
// Captura de sentimiento de analistas, aislamiento por organización y métricas
// PRINCIPIO: El feedback cualitativo NO es Ground Truth de precios de cierre.
// ==============================================================================

import { supabase, isSupabaseConfigured } from '../../supabase';
import { ValuationFeedback, ValuationFeedbackType } from './calibrationTypes';

export class ValuationFeedbackService {
  private static instance: ValuationFeedbackService;

  public feedbacks: Map<string, ValuationFeedback> = new Map();

  private constructor() {}

  public static getInstance(): ValuationFeedbackService {
    if (!ValuationFeedbackService.instance) {
      ValuationFeedbackService.instance = new ValuationFeedbackService();
    }
    return ValuationFeedbackService.instance;
  }

  /**
   * Registra una observación cualitativa de un analista/usuario sobre una valuación
   */
  public async submitFeedback(params: {
    organizationId: string;
    caseId?: string | null;
    valuationId: string;
    valuationVersionId?: string | null;
    propertyMasterId?: string | null;
    feedbackType: ValuationFeedbackType;
    rating?: number;
    comment?: string;
    suggestedValue?: number;
    createdBy?: string;
  }): Promise<ValuationFeedback> {
    const feedbackId = `fb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const feedback: ValuationFeedback = {
      id: feedbackId,
      organizationId: params.organizationId,
      caseId: params.caseId || null,
      valuationId: params.valuationId,
      valuationVersionId: params.valuationVersionId || null,
      propertyMasterId: params.propertyMasterId || null,
      feedbackType: params.feedbackType,
      rating: params.rating || null,
      comment: params.comment || null,
      suggestedValue: params.suggestedValue || null,
      createdBy: params.createdBy || null,
      createdAt: new Date().toISOString(),
    };

    this.feedbacks.set(feedbackId, feedback);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('valuation_feedback').insert({
          id: feedbackId.startsWith('fb-') && feedbackId.length === 36 ? feedbackId : undefined,
          organization_id: params.organizationId,
          case_id: params.caseId,
          valuation_id: params.valuationId,
          property_master_id: params.propertyMasterId,
          feedback_type: params.feedbackType,
          rating: params.rating,
          comment: params.comment,
          suggested_value: params.suggestedValue,
          created_by: params.createdBy,
        });
      } catch (err) {
        console.warn('Persistencia en Supabase de valuation_feedback omitida:', err);
      }
    }

    return feedback;
  }

  /**
   * Obtiene el feedback de una organización
   */
  public getFeedbackForOrg(organizationId: string): ValuationFeedback[] {
    return Array.from(this.feedbacks.values()).filter(
      (f) => f.organizationId === organizationId
    );
  }

  /**
   * Métricas agregadas de feedback cualitativo
   */
  public getFeedbackSummary(organizationId?: string): {
    totalCount: number;
    averageRating: number;
    distribution: Record<ValuationFeedbackType, number>;
  } {
    const list = organizationId
      ? this.getFeedbackForOrg(organizationId)
      : Array.from(this.feedbacks.values());

    const totalCount = list.length;
    const ratedList = list.filter((f) => f.rating !== null && f.rating !== undefined);
    const averageRating =
      ratedList.length > 0
        ? Number(
            (
              ratedList.reduce((acc, f) => acc + (f.rating || 0), 0) / ratedList.length
            ).toFixed(2)
          )
        : 0;

    const distribution: Record<ValuationFeedbackType, number> = {
      VALUATION_TOO_HIGH: 0,
      VALUATION_TOO_LOW: 0,
      COMPARABLE_INCORRECT: 0,
      PROPERTY_DATA_INCORRECT: 0,
      VISUAL_FEATURE_INCORRECT: 0,
      RANGE_TOO_WIDE: 0,
      RANGE_TOO_NARROW: 0,
      GOOD_RESULT: 0,
      PROFESSIONAL_OVERRIDE: 0,
      OTHER: 0,
    };

    for (const f of list) {
      if (distribution[f.feedbackType] !== undefined) {
        distribution[f.feedbackType]++;
      }
    }

    return { totalCount, averageRating, distribution };
  }
}
