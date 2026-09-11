// ==============================================================================
// HIPOTECALY TASADOR IA - FILTRO ROBUSTO DE OUTLIERS DE COMPARABLES (FASE 3)
// Detección Estadística por IQR (Rango Intercuartílico) y MAD (Desviación Absoluta)
// ==============================================================================

import { ScoredComparable, OutlierFilterResult, AppraisalSettingsV1 } from './valuationTypes';

export class ComparableOutlierFilter {
  /**
   * Identifica y aísla outliers de forma estadística sin destruir la evidencia
   */
  public static filterOutliers(
    comparables: ScoredComparable[],
    settings: AppraisalSettingsV1
  ): OutlierFilterResult {
    if (comparables.length < 4) {
      // Con menos de 4 comparables no se descartan por IQR para evitar sobre-filtrado
      return {
        acceptedComparables: comparables,
        excludedOutliers: [],
        metricEvaluated: 'price_per_m2_usd',
        lowerThreshold: 0,
        upperThreshold: Infinity,
        medianM2: comparables.length > 0 ? comparables[0].pricePerM2Usd : 0,
        iqrM2: 0,
      };
    }

    // 1. Extraer y ordenar precios por m²
    const sortedM2 = comparables
      .map((c) => c.pricePerM2Usd)
      .filter((p) => p > 0)
      .sort((a, b) => a - b);

    if (sortedM2.length === 0) {
      return {
        acceptedComparables: comparables,
        excludedOutliers: [],
        metricEvaluated: 'price_per_m2_usd',
        lowerThreshold: 0,
        upperThreshold: Infinity,
        medianM2: 0,
        iqrM2: 0,
      };
    }

    // 2. Cálculo de Percentiles Q1 (25%), Mediana (50%) y Q3 (75%)
    const q1 = this.calculatePercentile(sortedM2, 0.25);
    const median = this.calculatePercentile(sortedM2, 0.50);
    const q3 = this.calculatePercentile(sortedM2, 0.75);
    const iqr = q3 - q1;

    // 3. Umbrales robustos basados en IQR y MAD
    const multiplier = settings.outlierIqrMultiplier || 1.5;
    const lowerThreshold = Math.max(100, q1 - multiplier * iqr);
    const upperThreshold = q3 + multiplier * iqr;

    const acceptedComparables: ScoredComparable[] = [];
    const excludedOutliers: ScoredComparable[] = [];

    for (const comp of comparables) {
      const pM2 = comp.pricePerM2Usd;

      // Criterio 1: Precio por m² fuera del rango [lowerThreshold, upperThreshold]
      // Criterio 2: Valores absurdos (<= 0 o > 30000 USD/m2)
      if (pM2 < lowerThreshold || pM2 > upperThreshold || pM2 <= 0 || pM2 > 30000) {
        const reason =
          pM2 < lowerThreshold
            ? `EXCLUDED_OUTLIER: Precio/m² ($${pM2}) inferior al umbral mínimo IQR ($${Math.round(lowerThreshold)})`
            : `EXCLUDED_OUTLIER: Precio/m² ($${pM2}) superior al umbral máximo IQR ($${Math.round(upperThreshold)})`;

        excludedOutliers.push({
          ...comp,
          isOutlier: true,
          outlierReason: reason,
        });
      } else {
        acceptedComparables.push({
          ...comp,
          isOutlier: false,
          outlierReason: null,
        });
      }
    }

    return {
      acceptedComparables,
      excludedOutliers,
      metricEvaluated: 'price_per_m2_usd',
      lowerThreshold: Math.round(lowerThreshold),
      upperThreshold: Math.round(upperThreshold),
      medianM2: Math.round(median),
      iqrM2: Math.round(iqr),
    };
  }

  private static calculatePercentile(sortedNumbers: number[], percentile: number): number {
    if (sortedNumbers.length === 0) return 0;
    const index = (sortedNumbers.length - 1) * percentile;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;

    if (lower === upper) return sortedNumbers[lower];
    return sortedNumbers[lower] * (1 - weight) + sortedNumbers[upper] * weight;
  }
}
