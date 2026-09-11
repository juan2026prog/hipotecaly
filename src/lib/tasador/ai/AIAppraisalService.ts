// ==============================================================================
// HIPOTECALY TASADOR IA - SERVICIO INTEGRAL DE ENRIQUECIMIENTO IA (FASE 4)
// Coordinación de Texto, Visión (Shadow Mode), Explicabilidad y Fallback Total
// ==============================================================================

import { ValuationResultReport } from '../valuation/valuationTypes';
import { AIEnrichmentResult, QualitativeFeature } from './aiTypes';
import { PropertyTextAnalyzer } from './PropertyTextAnalyzer';
import { PropertyVisionAnalyzer, RawPhotoToAnalyze } from './PropertyVisionAnalyzer';
import { ReportGenerator } from './ReportGenerator';
import { AIUsageTracker } from './AIUsageTracker';
import { BudgetGuard } from './BudgetGuard';

export class AIAppraisalService {
  private static instance: AIAppraisalService;

  private constructor() {}

  public static getInstance(): AIAppraisalService {
    if (!AIAppraisalService.instance) {
      AIAppraisalService.instance = new AIAppraisalService();
    }
    return AIAppraisalService.instance;
  }

  /**
   * Ejecuta el enriquecimiento de IA sobre una tasación calculada
   * GARANTÍA DE FALLBACK: Si OpenAI o la red fallan, la tasación concluye con éxito.
   */
  public async enrichValuation(params: {
    valuation: ValuationResultReport;
    rawDescription?: string | null;
    rawTitle?: string | null;
    photos?: RawPhotoToAnalyze[];
  }): Promise<AIEnrichmentResult> {
    const budgetGuard = BudgetGuard.getInstance();
    const usageTracker = AIUsageTracker.getInstance();

    const config = budgetGuard.getConfig();

    // 1. Verificación de permisos y presupuesto
    if (!config.aiEnabled) {
      const reportSections = ReportGenerator.generateReportSections(params.valuation, null, []);
      return {
        status: 'UNAVAILABLE',
        textAnalysis: null,
        visionAnalyses: [],
        qualitativeFeatures: [],
        reportSections,
        totalAiCostUsd: 0,
        totalTokensConsumed: 0,
        isShadowMode: true,
        fallbackReason: 'AI_DISABLED_BY_ADMIN',
      };
    }

    try {
      const qualitativeFeatures: QualitativeFeature[] = [];

      // 2. Análisis de Texto
      const textAnalysis = await PropertyTextAnalyzer.analyze(
        params.rawDescription,
        params.rawTitle
      );
      if (textAnalysis.extractedFeatures.length > 0) {
        qualitativeFeatures.push(...textAnalysis.extractedFeatures);
      }

      // 3. Análisis de Fotos con Computer Vision (Shadow Mode)
      let visionAnalyses: any[] = [];
      if (config.visionEnabled && params.photos && params.photos.length > 0) {
        const visionRes = await PropertyVisionAnalyzer.analyzePhotos(
          params.photos,
          params.valuation.valuationId,
          params.valuation.propertyMasterId
        );
        visionAnalyses = visionRes.analyses;
        qualitativeFeatures.push(...visionRes.qualitativeFeatures);
      }

      // 4. Generación de Explicación Profesional
      const reportSections = ReportGenerator.generateReportSections(
        params.valuation,
        textAnalysis,
        visionAnalyses
      );

      // 5. Resumen de Costos y Tokens
      const costSummary = usageTracker.getValuationCostSummary(params.valuation.valuationId);

      return {
        status: 'COMPLETED',
        textAnalysis,
        visionAnalyses,
        qualitativeFeatures,
        reportSections,
        totalAiCostUsd: costSummary.totalCostUsd,
        totalTokensConsumed: costSummary.totalTokens,
        isShadowMode: true,
      };
    } catch (err: any) {
      // Fallback seguro ante cualquier error inesperado de IA
      const reportSections = ReportGenerator.generateReportSections(params.valuation, null, []);
      return {
        status: 'FALLBACK_HEURISTIC',
        textAnalysis: null,
        visionAnalyses: [],
        qualitativeFeatures: [],
        reportSections,
        totalAiCostUsd: 0,
        totalTokensConsumed: 0,
        isShadowMode: true,
        fallbackReason: `FALLBACK_TRIGGERED: ${err?.message || 'Error de procesamiento en servicio de IA'}`,
      };
    }
  }
}
