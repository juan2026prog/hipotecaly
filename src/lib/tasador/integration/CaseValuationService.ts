// ==============================================================================
// HIPOTECALY TASADOR IA - SERVICIO DE TASACIÓN DE EXPEDIENTES (FASE 5)
// Tasación a demanda, versionado inmutable, Human-in-the-Loop y AI Fallback
// ==============================================================================

import { supabase, isSupabaseConfigured } from '../../supabase';
import { MasterPropertyResolver } from '../master/MasterPropertyResolver';
import { ValuationService } from '../valuation/ValuationService';
import { AIAppraisalService } from '../ai/AIAppraisalService';
import { AppraisalSettingsManager } from '../valuation/AppraisalSettingsManager';
import { TargetPropertyInput } from '../valuation/valuationTypes';
import {
  CaseValuationSnapshot,
  CaseValuationReviewAction,
  CaseValuationReviewStatus,
} from './casePropertyTypes';
import { ProfessionalAppraisalService } from './ProfessionalAppraisalService';

export class CaseValuationService {
  private static instance: CaseValuationService;

  // Snapshots históricos indexados por caseId
  public caseValuations: Map<string, CaseValuationSnapshot[]> = new Map();

  private constructor() {}

  public static getInstance(): CaseValuationService {
    if (!CaseValuationService.instance) {
      CaseValuationService.instance = new CaseValuationService();
    }
    return CaseValuationService.instance;
  }

  /**
   * Ejecuta o recupera una tasación a demanda para un expediente con versionado inmutable
   */
  public async requestCaseValuation(params: {
    caseId: string;
    organizationId: string;
    propertyMasterId: string;
    userId?: string;
    forceNewVersion?: boolean;
    customTarget?: Partial<TargetPropertyInput>;
  }): Promise<CaseValuationSnapshot> {
    const { caseId, organizationId, propertyMasterId, userId: _userId, forceNewVersion } = params;

    const masterResolver = MasterPropertyResolver.getInstance();
    const master = masterResolver.masters.get(propertyMasterId);

    const history = this.caseValuations.get(caseId) || [];
    const settings = AppraisalSettingsManager.getInstance().getSettings();
    const idempotencyKey = `val-${caseId}-${propertyMasterId}-v${settings.version}`;

    // Si no es forzada y ya existe una tasación idéntica para esta versión de settings, devolverla
    if (!forceNewVersion && history.length > 0) {
      const existing = history.find((h) => h.idempotencyKey === idempotencyKey);
      if (existing) {
        return existing;
      }
    }

    const rawPropType = params.customTarget?.propertyType || master?.propertyType || 'APARTMENT';
    const targetInput: TargetPropertyInput = {
      department: params.customTarget?.department || master?.department || 'Montevideo',
      city: params.customTarget?.city || master?.city || 'Montevideo',
      neighborhood: params.customTarget?.neighborhood || master?.neighborhood || 'Pocitos',
      propertyType: (rawPropType.toUpperCase() === 'APARTAMENTO' ? 'APARTMENT' : rawPropType.toUpperCase() === 'CASA' ? 'HOUSE' : rawPropType.toUpperCase()) as any,
      builtAreaM2: params.customTarget?.builtAreaM2 || master?.builtAreaM2 || master?.coveredSurfaceM2 || 75,
      totalAreaM2: params.customTarget?.totalAreaM2 || master?.totalAreaM2 || master?.coveredSurfaceM2 || 75,
      bedrooms: params.customTarget?.bedrooms ?? master?.bedrooms ?? 2,
      bathrooms: params.customTarget?.bathrooms ?? master?.bathrooms ?? 1,
      garages: params.customTarget?.garages ?? master?.garages ?? 0,
      constructionYear: params.customTarget?.constructionYear ?? master?.constructionYear ?? 2018,
      cadastralNumber: params.customTarget?.cadastralNumber || master?.cadastralNumber,
      latitude: params.customTarget?.latitude || master?.latitude,
      longitude: params.customTarget?.longitude || master?.longitude,
    };

    // 1. Ejecutar Valuación Determinística
    const valuationService = ValuationService.getInstance();
    const report = await valuationService.appraiseProperty(targetInput);

    // 2. Ejecutar Enriquecimiento IA con Fallback Total Resiliente
    let aiStatus: 'COMPLETED' | 'UNAVAILABLE' | 'DISABLED' | 'FAILED' = 'COMPLETED';
    let aiFeatures = null;

    try {
      const aiAppraisal = AIAppraisalService.getInstance();
      const enrichment = await aiAppraisal.enrichValuation({
        valuation: report,
        rawDescription: master?.canonicalAddress || 'Inmueble residencial para garantía hipotecaria',
        rawTitle: `${targetInput.propertyType} en ${targetInput.neighborhood}`,
        photos: [],
      });

      if (enrichment.status === 'UNAVAILABLE') {
        aiStatus = 'UNAVAILABLE';
      } else {
        aiFeatures = enrichment.qualitativeFeatures as any;
      }
    } catch (aiErr) {
      console.warn('AI Enrichment Fallback activado:', aiErr);
      aiStatus = 'UNAVAILABLE';
    }

    // 3. Obtener tasación profesional externa si existe
    const profAppraisalService = ProfessionalAppraisalService.getInstance();
    const professionalAppraisal = profAppraisalService.getLatestForCase(caseId, organizationId);

    // 4. Crear Snapshot Inmutable Versionado
    const nextVersionNumber = history.length + 1;
    const valuationId = `val-${caseId}-${nextVersionNumber}-${Date.now()}`;

    const snapshot: CaseValuationSnapshot = {
      valuationId,
      caseId,
      organizationId,
      propertyMasterId,
      versionNumber: nextVersionNumber,
      idempotencyKey,
      reviewStatus: 'PENDING',
      aiStatus,
      estimatedMarketValue: report.estimatedMarketValue,
      estimatedRangeLow: report.estimatedRangeLow,
      estimatedRangeHigh: report.estimatedRangeHigh,
      prudentReferenceValue: report.prudentReferenceValue,
      currency: 'USD',
      confidenceScore: report.confidence.confidenceScore,
      confidenceLevel: report.confidence.confidenceLevel,
      report,
      aiFeatures,
      professionalAppraisal,
      generatedAt: new Date().toISOString(),
      settingsVersion: settings.version,
    };

    history.push(snapshot);
    this.caseValuations.set(caseId, history);

    // Persistir en Supabase si está disponible
    if (isSupabaseConfigured) {
      try {
        await supabase.from('property_valuations').insert({
          id: valuationId.startsWith('val-') && valuationId.length === 36 ? valuationId : undefined,
          organization_id: organizationId,
          case_id: caseId,
          property_master_id: propertyMasterId.startsWith('master-') && propertyMasterId.length === 36 ? propertyMasterId : null,
          valuation_type: 'HIPOTECALY_AUTOMATED',
          valuation_status: 'DRAFT',
          market_value: report.estimatedMarketValue,
          probable_min_value: report.estimatedRangeLow,
          probable_max_value: report.estimatedRangeHigh,
          conservative_value: report.prudentReferenceValue,
          currency: 'USD',
          confidence_score: report.confidence.confidenceScore,
          methodology_version: report.algorithmVersion,
          idempotency_key: idempotencyKey,
          review_status: 'PENDING',
          ai_status: aiStatus,
        });
      } catch (err) {
        console.warn('Persistencia en Supabase de property_valuations omitida:', err);
      }
    }

    return snapshot;
  }

  /**
   * Obtiene el historial de tasaciones de un expediente garantizando aislamiento por organización
   */
  public getCaseValuationHistory(caseId: string, organizationId: string): CaseValuationSnapshot[] {
    const list = this.caseValuations.get(caseId) || [];
    return list.filter((s) => s.organizationId === organizationId);
  }

  /**
   * Obtiene la tasación activa más reciente de un expediente
   */
  public getLatestCaseValuation(
    caseId: string,
    organizationId: string
  ): CaseValuationSnapshot | null {
    const history = this.getCaseValuationHistory(caseId, organizationId);
    if (history.length === 0) return null;
    return history[history.length - 1];
  }

  /**
   * Aplica una acción del flujo Human-in-the-Loop (Aceptar referencia, solicitar retasación, peritaje)
   */
  public applyReviewAction(params: {
    caseId: string;
    organizationId: string;
    valuationId: string;
    action: CaseValuationReviewAction;
    userId?: string;
    notes?: string;
  }): CaseValuationSnapshot | null {
    const { caseId, organizationId, valuationId, action, userId, notes } = params;
    const history = this.getCaseValuationHistory(caseId, organizationId);
    const targetSnapshot = history.find((s) => s.valuationId === valuationId);

    if (!targetSnapshot) return null;

    let nextStatus: CaseValuationReviewStatus = 'PENDING';
    if (action === 'ACCEPT_REFERENCE') nextStatus = 'ACCEPTED_REFERENCE';
    else if (action === 'REQUEST_REVALUATION') nextStatus = 'REVALUATION_REQUESTED';
    else if (action === 'REQUEST_HUMAN_REVIEW') nextStatus = 'HUMAN_REVIEW_REQUESTED';

    targetSnapshot.reviewStatus = nextStatus;
    targetSnapshot.reviewedBy = userId || null;
    targetSnapshot.reviewedAt = new Date().toISOString();
    targetSnapshot.reviewNotes = notes || null;

    return targetSnapshot;
  }
}
