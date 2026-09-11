// ==============================================================================
// HIPOTECALY TASADOR IA - MOTOR DE RANGOS DE VALUACIÓN Y VALOR PRUDENTE (FASE 3)
// Cálculo Estadístico de Dispersión, Rango (Low/High) y Valor de Referencia Prudente
// ==============================================================================

import { ScoredComparable, ValuationRangeResult } from './valuationTypes';

export class ValuationRangeEngine {
  /**
   * Calcula el rango de mercado y el valor de referencia prudente de forma estadística
   * REGLA ESTRICTA: NO aplica un segundo -12% arbitrario. Deriva la prudencia de la dispersión empírica.
   */
  public static calculateRange(
    estimatedMarketValue: number,
    targetArea: number,
    comparables: ScoredComparable[]
  ): ValuationRangeResult {
    if (comparables.length === 0 || estimatedMarketValue <= 0) {
      return {
        estimatedMarketValue,
        estimatedRangeLow: estimatedMarketValue,
        estimatedRangeHigh: estimatedMarketValue,
        prudentReferenceValue: estimatedMarketValue,
        estimatedPricePerM2Usd: targetArea > 0 ? Math.round(estimatedMarketValue / targetArea) : 0,
        dispersionCoefficient: 0,
      };
    }

    // 1. Calcular Varianza y Desviación Estándar Ponderada
    const mean = estimatedMarketValue;

    const weightedVariance = comparables.reduce((acc, c) => {
      const diff = c.directlyAdjustedPriceUsd - mean;
      return acc + c.weight * Math.pow(diff, 2);
    }, 0);

    const stdDev = Math.sqrt(Math.max(0, weightedVariance));
    const cv = mean > 0 ? stdDev / mean : 0.08; // Coeficiente de variación

    // 2. Semiancho de banda de mercado calibrado entre [6%, 18%]
    const bandWidthPct = Math.max(0.06, Math.min(0.18, cv * 1.25));

    const estimatedRangeLow = Math.round(estimatedMarketValue * (1 - bandWidthPct));
    const estimatedRangeHigh = Math.round(estimatedMarketValue * (1 + bandWidthPct));

    // 3. Valor de Referencia Prudente (Prudent Reference Value):
    // Derivado estadísticamente como el percentil inferior (aproximadamente Q1 / z = -0.675 stdDev)
    // Representa un valor de liquidación prudente de mercado basado en la dispersión real de comparables
    const prudentReferenceValue = Math.round(
      Math.max(estimatedRangeLow, estimatedMarketValue - stdDev * 0.675)
    );

    const estimatedPricePerM2Usd =
      targetArea > 0 ? Math.round(estimatedMarketValue / targetArea) : 0;

    return {
      estimatedMarketValue,
      estimatedRangeLow,
      estimatedRangeHigh,
      prudentReferenceValue,
      estimatedPricePerM2Usd,
      dispersionCoefficient: Number(cv.toFixed(4)),
    };
  }
}
