// ==============================================================================
// HIPOTECALY TASADOR IA - MOTOR DE CONFIANZA ESTADÍSTICA (FASE 3)
// Confidence Score 0-100 Multiseñal y Categorización de Incertidumbre
// ==============================================================================

import {
  ScoredComparable,
  GeographicSearchLevel,
  ValuationConfidenceResult,
  ValuationConfidenceLevel,
  AppraisalSettingsV1,
} from './valuationTypes';

export class ValuationConfidenceEngine {
  /**
   * Calcula el score de confianza determinístico y advertencias metodológicas
   */
  public static evaluate(
    comparables: ScoredComparable[],
    geographicLevel: GeographicSearchLevel,
    dispersionCoefficient: number,
    settings: AppraisalSettingsV1
  ): ValuationConfidenceResult {
    const warnings: string[] = [];

    // 1. Cantidad de Comparables (0 - 25 pts)
    const count = comparables.length;
    let countScore = 0;
    if (count >= settings.targetComparables) {
      countScore = 25;
    } else if (count >= settings.minComparables) {
      // Interpolación entre min (12 pts) y target (25 pts)
      const ratio = (count - settings.minComparables) / (settings.targetComparables - settings.minComparables);
      countScore = Math.round(12 + ratio * 13);
    } else if (count > 0) {
      countScore = Math.round((count / settings.minComparables) * 10);
      warnings.push('LOW_COMPARABLE_COUNT: Cantidad de comparables inferior al mínimo ideal');
    } else {
      countScore = 0;
      warnings.push('NO_COMPARABLES_FOUND: No se encontraron comparables compatibles');
    }

    // 2. Similitud Promedio Ponderada (0 - 25 pts)
    let avgSimilarity = 0;
    if (count > 0) {
      avgSimilarity = comparables.reduce(
        (acc, c) => acc + c.similarity.finalSimilarityScore * c.weight,
        0
      );
    }
    const similarityScore = Math.round((avgSimilarity / 100) * 25);
    if (avgSimilarity < 65) {
      warnings.push('MODERATE_SIMILARITY: Nivel de similitud promedio de comparables moderado');
    }

    // 3. Precisión Geográfica (0 - 15 pts)
    const GEO_SCORES: Record<GeographicSearchLevel, number> = {
      IMMEDIATE: 15,
      NEIGHBORHOOD: 12,
      ADJACENT_NEIGHBORHOODS: 9,
      LOCALITY: 6,
      DEPARTMENT: 3,
    };
    const geographicScore = GEO_SCORES[geographicLevel] || 5;
    if (geographicLevel === 'LOCALITY' || geographicLevel === 'DEPARTMENT') {
      warnings.push(
        `GEOGRAPHIC_EXPANSION: Búsqueda ampliada a nivel ${geographicLevel} por baja densidad local`
      );
    }

    // 4. Recencia Promedio (0 - 15 pts)
    let avgRecency = 0;
    if (count > 0) {
      avgRecency = comparables.reduce(
        (acc, c) => acc + c.similarity.recencyScore * c.weight,
        0
      );
    }
    const recencyScore = Math.round((avgRecency / 100) * 15);
    if (avgRecency < 60) {
      warnings.push('AGED_MARKET_EVIDENCE: Parte de la muestra presenta antigüedad superior a 180 días');
    }

    // 5. Dispersión Estadística (0 - 10 pts)
    let dispersionScore = 10;
    if (dispersionCoefficient <= 0.05) dispersionScore = 10;
    else if (dispersionCoefficient <= 0.10) dispersionScore = 8;
    else if (dispersionCoefficient <= 0.15) dispersionScore = 6;
    else if (dispersionCoefficient <= 0.22) {
      dispersionScore = 4;
      warnings.push('HIGH_MARKET_DISPERSION: Dispersión moderada/alta en precios unitarios de la zona');
    } else {
      dispersionScore = 2;
      warnings.push('VERY_HIGH_MARKET_DISPERSION: Alta dispersión de mercado detectada');
    }

    // 6. Calidad de Datos (0 - 10 pts)
    let avgQuality = 0;
    if (count > 0) {
      avgQuality = comparables.reduce(
        (acc, c) => acc + c.similarity.dataQualityScore * c.weight,
        0
      );
    }
    const dataQualityScore = Math.round((avgQuality / 100) * 10);

    // Score Total de Confianza (0 - 100)
    const confidenceScore = Math.min(
      100,
      Math.max(0, countScore + similarityScore + geographicScore + recencyScore + dispersionScore + dataQualityScore)
    );

    // Nivel de Confianza
    const ct = settings.confidenceThresholds;
    let confidenceLevel: ValuationConfidenceLevel = 'VERY_LOW';
    if (confidenceScore >= ct.veryHigh) confidenceLevel = 'VERY_HIGH';
    else if (confidenceScore >= ct.high) confidenceLevel = 'HIGH';
    else if (confidenceScore >= ct.medium) confidenceLevel = 'MEDIUM';
    else if (confidenceScore >= ct.low) confidenceLevel = 'LOW';
    else confidenceLevel = 'VERY_LOW';

    return {
      confidenceScore,
      confidenceLevel,
      breakdown: {
        comparableCountScore: countScore,
        similarityAverageScore: similarityScore,
        geographicPrecisionScore: geographicScore,
        recencyScore,
        dispersionScore,
        dataQualityScore,
      },
      warnings,
    };
  }
}
