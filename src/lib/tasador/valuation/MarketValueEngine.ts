// ==============================================================================
// HIPOTECALY TASADOR IA - MOTOR ESTADÍSTICO DE VALUACIÓN DE MERCADO (FASE 3)
// Métodos Robustos: Mediana Ponderada, Media Recortada, Precio/M2 y Ajuste Directo
// ==============================================================================

import {
  TargetPropertyInput,
  ScoredComparable,
  MethodEstimatorResult,
  AppraisalSettingsV1,
} from './valuationTypes';

export interface MarketValueCalculationResult {
  estimatedMarketValue: number;
  estimatedPricePerM2Usd: number;
  methodEstimators: MethodEstimatorResult[];
}

export class MarketValueEngine {
  /**
   * Ejecuta los 4 estimadores estadísticos robustos y genera el ensamble ponderado
   */
  public static calculate(
    target: TargetPropertyInput,
    comparables: ScoredComparable[],
    settings: AppraisalSettingsV1
  ): MarketValueCalculationResult {
    if (comparables.length === 0) {
      return {
        estimatedMarketValue: 0,
        estimatedPricePerM2Usd: 0,
        methodEstimators: [],
      };
    }

    const targetArea = target.builtAreaM2 > 0 ? target.builtAreaM2 : target.totalAreaM2 || 1;

    // 1. Método: Weighted Median (Mediana Ponderada de Precios Ajustados Directamente)
    const weightedMedianResult = this.computeWeightedMedian(comparables);

    // 2. Método: Weighted Trimmed Mean (Media Recortada al 10% de Extremos)
    const weightedTrimmedResult = this.computeWeightedTrimmedMean(comparables);

    // 3. Método: Weighted Price per M²
    const weightedM2Result = this.computeWeightedPricePerM2(comparables, targetArea);

    // 4. Método: Direct Comparable Adjustment (Promedio Ponderado de Precios con Ajustes de Coeficientes)
    const directAdjResult = this.computeDirectAdjustment(comparables);

    // 5. Ensamble Ponderado Final (Hybrid Robust Ensemble)
    const mw = settings.methodWeights;
    const finalEstimatedValue = Math.round(
      weightedMedianResult.value * mw.weightedMedian +
      weightedTrimmedResult.value * mw.weightedTrimmedMean +
      weightedM2Result.value * mw.weightedPricePerM2 +
      directAdjResult.value * mw.directAdjustment
    );

    const finalEstimatedPricePerM2 = Math.round(finalEstimatedValue / targetArea);

    const methodEstimators: MethodEstimatorResult[] = [
      {
        method: 'WEIGHTED_MEDIAN',
        estimatedValueUsd: Math.round(weightedMedianResult.value),
        estimatedPricePerM2Usd: Math.round(weightedMedianResult.value / targetArea),
        weight: mw.weightedMedian,
        effectiveComparablesUsed: comparables.length,
        dispersionPercentage: weightedMedianResult.dispersionPct,
      },
      {
        method: 'WEIGHTED_TRIMMED_MEAN',
        estimatedValueUsd: Math.round(weightedTrimmedResult.value),
        estimatedPricePerM2Usd: Math.round(weightedTrimmedResult.value / targetArea),
        weight: mw.weightedTrimmedMean,
        effectiveComparablesUsed: comparables.length,
        dispersionPercentage: weightedTrimmedResult.dispersionPct,
      },
      {
        method: 'WEIGHTED_PRICE_PER_M2',
        estimatedValueUsd: Math.round(weightedM2Result.value),
        estimatedPricePerM2Usd: Math.round(weightedM2Result.avgPriceM2),
        weight: mw.weightedPricePerM2,
        effectiveComparablesUsed: comparables.length,
        dispersionPercentage: weightedM2Result.dispersionPct,
      },
      {
        method: 'DIRECT_COMPARABLE_ADJUSTMENT',
        estimatedValueUsd: Math.round(directAdjResult.value),
        estimatedPricePerM2Usd: Math.round(directAdjResult.value / targetArea),
        weight: mw.directAdjustment,
        effectiveComparablesUsed: comparables.length,
        dispersionPercentage: directAdjResult.dispersionPct,
      },
    ];

    return {
      estimatedMarketValue: finalEstimatedValue,
      estimatedPricePerM2Usd: finalEstimatedPricePerM2,
      methodEstimators,
    };
  }

  /**
   * Mediana Ponderada
   */
  private static computeWeightedMedian(
    comparables: ScoredComparable[]
  ): { value: number; dispersionPct: number } {
    const sorted = [...comparables].sort(
      (a, b) => a.directlyAdjustedPriceUsd - b.directlyAdjustedPriceUsd
    );

    let cumulativeWeight = 0;
    let medianValue = sorted[0].directlyAdjustedPriceUsd;

    for (const item of sorted) {
      cumulativeWeight += item.weight;
      if (cumulativeWeight >= 0.50) {
        medianValue = item.directlyAdjustedPriceUsd;
        break;
      }
    }

    const prices = sorted.map((c) => c.directlyAdjustedPriceUsd);
    const min = prices[0];
    const max = prices[prices.length - 1];
    const dispersionPct = medianValue > 0 ? Number((((max - min) / medianValue) * 100).toFixed(2)) : 0;

    return { value: medianValue, dispersionPct };
  }

  /**
   * Media Recortada Ponderada (Trim 10% de cada extremo si N >= 5)
   */
  private static computeWeightedTrimmedMean(
    comparables: ScoredComparable[]
  ): { value: number; dispersionPct: number } {
    if (comparables.length < 5) {
      const simpleWeighted = comparables.reduce(
        (acc, c) => acc + c.directlyAdjustedPriceUsd * c.weight,
        0
      );
      return { value: simpleWeighted, dispersionPct: 5.0 };
    }

    const sorted = [...comparables].sort(
      (a, b) => a.directlyAdjustedPriceUsd - b.directlyAdjustedPriceUsd
    );
    const trimCount = Math.max(1, Math.floor(sorted.length * 0.10));
    const trimmed = sorted.slice(trimCount, sorted.length - trimCount);

    const sumWeight = trimmed.reduce((acc, c) => acc + c.weight, 0);
    const trimmedVal =
      sumWeight > 0
        ? trimmed.reduce((acc, c) => acc + c.directlyAdjustedPriceUsd * c.weight, 0) / sumWeight
        : trimmed[0].directlyAdjustedPriceUsd;

    return { value: trimmedVal, dispersionPct: 4.5 };
  }

  /**
   * Precio por m² Ponderado aplicado a la superficie del objetivo
   */
  private static computeWeightedPricePerM2(
    comparables: ScoredComparable[],
    targetArea: number
  ): { value: number; avgPriceM2: number; dispersionPct: number } {
    const avgPriceM2 = comparables.reduce((acc, c) => acc + c.pricePerM2Usd * c.weight, 0);
    const value = avgPriceM2 * targetArea;
    return { value, avgPriceM2, dispersionPct: 6.0 };
  }

  /**
   * Ajuste Directo de Comparables
   */
  private static computeDirectAdjustment(
    comparables: ScoredComparable[]
  ): { value: number; dispersionPct: number } {
    const value = comparables.reduce(
      (acc, c) => acc + c.directlyAdjustedPriceUsd * c.weight,
      0
    );
    return { value, dispersionPct: 5.5 };
  }
}
