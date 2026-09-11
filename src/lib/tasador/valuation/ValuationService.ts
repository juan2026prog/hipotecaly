// ==============================================================================
// HIPOTECALY TASADOR IA - SERVICIO CENTRAL DE VALUACIÓN DETERMINÍSTICA (FASE 3)
// Orquestación E2E, Trazabilidad Matemática y Persistencia Inmutable de Versiones
// ==============================================================================

import {
  TargetPropertyInput,
  ValuationResultReport,
  AppraisalSettingsV1,
} from './valuationTypes';
import { AppraisalSettingsManager } from './AppraisalSettingsManager';
import { ComparableCandidateFinder } from './ComparableCandidateFinder';
import { ComparableScoringEngine } from './ComparableScoringEngine';
import { ComparableOutlierFilter } from './ComparableOutlierFilter';
import { ComparableWeightEngine } from './ComparableWeightEngine';
import { MarketValueEngine } from './MarketValueEngine';
import { ValuationRangeEngine } from './ValuationRangeEngine';
import { ValuationConfidenceEngine } from './ValuationConfidenceEngine';
import { NormalizedListing } from '../types/tasadorPipelineTypes';
import { IngestionEngine } from '../crawler/IngestionEngine';

export class ValuationService {
  private static instance: ValuationService;

  // Repositorio en memoria de tasaciones y versiones
  public valuations: Map<string, ValuationResultReport> = new Map();
  public valuationVersions: Map<string, ValuationResultReport[]> = new Map();

  private constructor() {}

  public static getInstance(): ValuationService {
    if (!ValuationService.instance) {
      ValuationService.instance = new ValuationService();
    }
    return ValuationService.instance;
  }

  /**
   * Ejecuta una tasación determinística completa para una propiedad objetivo
   */
  public async appraiseProperty(
    target: TargetPropertyInput,
    customListings?: NormalizedListing[],
    customSettings?: AppraisalSettingsV1
  ): Promise<ValuationResultReport> {
    const settings = customSettings || AppraisalSettingsManager.getInstance().getSettings();
    const allListings =
      customListings || Array.from(IngestionEngine.getInstance().normalizedListings.values());

    const targetArea = target.builtAreaM2 > 0 ? target.builtAreaM2 : target.totalAreaM2 || 1;

    // 1. Búsqueda Progresiva de Candidatos y Aplicación del 12% a asking prices
    const finderResult = ComparableCandidateFinder.findCandidates(target, allListings, settings);

    // 2. Scoring de Similitud Multidimensional para cada candidato
    const scoredCandidates = finderResult.candidates.map((cand) =>
      ComparableScoringEngine.scoreCandidate(target, cand, settings)
    );

    // 3. Filtrado Robusto de Outliers (IQR / MAD)
    const outlierResult = ComparableOutlierFilter.filterOutliers(scoredCandidates, settings);

    // 4. Ordenar comparables aceptados por similitud y tomar los mejores (hasta maxComparables)
    const topComparables = outlierResult.acceptedComparables
      .sort((a, b) => b.similarity.finalSimilarityScore - a.similarity.finalSimilarityScore)
      .slice(0, settings.maxComparables);

    // 5. Ponderación Normalizada de Pesos (sum(weights) === 1.0)
    const weightedComparables = ComparableWeightEngine.computeWeights(topComparables);

    // 6. Cálculo Estadístico Multi-Método (Ensemble de 4 estimadores robustos)
    const marketValueResult = MarketValueEngine.calculate(
      target,
      weightedComparables,
      settings
    );

    // 7. Cálculo de Rango de Mercado y Valor de Referencia Prudente (sin doble 12%)
    const rangeResult = ValuationRangeEngine.calculateRange(
      marketValueResult.estimatedMarketValue,
      targetArea,
      weightedComparables
    );

    // 8. Evaluación de Confianza Multiseñal (0-100)
    const confidenceResult = ValuationConfidenceEngine.evaluate(
      weightedComparables,
      finderResult.geographicLevel,
      rangeResult.dispersionCoefficient,
      settings
    );

    // 9. Construir Reporte Final Estructurado
    const valuationId = `val_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const version = 1;

    const report: ValuationResultReport = {
      valuationId,
      propertyMasterId: target.propertyMasterId,
      version,
      generatedAt: new Date().toISOString(),
      algorithmVersion: 'VALUATION_V1_DETERMINISTIC',
      settingsVersion: settings.version,
      targetProperty: target,
      estimatedMarketValue: rangeResult.estimatedMarketValue,
      estimatedRangeLow: rangeResult.estimatedRangeLow,
      estimatedRangeHigh: rangeResult.estimatedRangeHigh,
      prudentReferenceValue: rangeResult.prudentReferenceValue,
      currency: 'USD',
      estimatedPricePerM2Usd: rangeResult.estimatedPricePerM2Usd,
      totalComparablesDiscovered: finderResult.candidates.length,
      effectiveComparablesUsed: weightedComparables.length,
      outliersExcludedCount: outlierResult.excludedOutliers.length,
      geographicSearchLevel: finderResult.geographicLevel,
      geographicSearchRadiusMeters: finderResult.searchRadiusMeters,
      confidence: confidenceResult,
      methods: marketValueResult.methodEstimators,
      selectedComparables: weightedComparables,
      excludedOutliers: outlierResult.excludedOutliers,
      askingPriceAdjustmentApplied: true,
      askingPriceAdjustmentPercentage: settings.askingPriceAdjustment * 100,
      warnings: [...confidenceResult.warnings],
    };

    // 10. Persistencia inmutable en repositorios
    this.valuations.set(valuationId, report);
    const history = this.valuationVersions.get(valuationId) || [];
    history.push(report);
    this.valuationVersions.set(valuationId, history);

    return report;
  }

  public getValuation(valuationId: string): ValuationResultReport | undefined {
    return this.valuations.get(valuationId);
  }

  public getValuationHistory(valuationId: string): ValuationResultReport[] {
    return this.valuationVersions.get(valuationId) || [];
  }

  public resetState(): void {
    this.valuations.clear();
    this.valuationVersions.clear();
  }
}
