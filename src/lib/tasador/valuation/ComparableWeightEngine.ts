// ==============================================================================
// HIPOTECALY TASADOR IA - MOTOR DE PONDERACIÓN DE COMPARABLES (FASE 3)
// Asignación de Pesos Relativos Normalizados según Similitud, Recencia y Jerarquía
// ==============================================================================

import { ScoredComparable, PriceEvidenceHierarchy } from './valuationTypes';

export class ComparableWeightEngine {
  /**
   * Asigna pesos relativos normalizados a cada comparable aceptado
   */
  public static computeWeights(comparables: ScoredComparable[]): ScoredComparable[] {
    if (comparables.length === 0) return [];

    // Multiplicador de jerarquía de evidencia de precio
    const HIERARCHY_MULTIPLIER: Record<PriceEvidenceHierarchy, number> = {
      CONFIRMED_TRANSACTION: 1.40,  // Máxima relevancia estadística
      PROFESSIONAL_APPRAISAL: 1.25, // Tasación pericial previa
      ADJUSTED_ASKING_PRICE: 1.00,  // Asking price normalizado con 12%
      RAW_ASKING_PRICE: 0.80,       // Sin ajuste
    };

    // 1. Calcular pesos brutos
    const rawWeights = comparables.map((c) => {
      const similarityFactor = Math.pow(Math.max(10, c.similarity.finalSimilarityScore) / 100, 2); // Efecto cuadrático para premiar alta similitud
      const hierarchyFactor = HIERARCHY_MULTIPLIER[c.priceEvidenceHierarchy] || 1.0;
      const recencyFactor = Math.max(0.2, c.similarity.recencyScore / 100);
      const qualityFactor = Math.max(0.5, c.similarity.dataQualityScore / 100);

      return similarityFactor * hierarchyFactor * recencyFactor * qualityFactor;
    });

    const sumRawWeights = rawWeights.reduce((acc, w) => acc + w, 0);

    // 2. Normalizar pesos para que sumen exactamente 1.0
    return comparables.map((c, index) => {
      const normalizedWeight = sumRawWeights > 0 ? Number((rawWeights[index] / sumRawWeights).toFixed(6)) : 1 / comparables.length;
      return {
        ...c,
        weight: normalizedWeight,
      };
    });
  }
}
