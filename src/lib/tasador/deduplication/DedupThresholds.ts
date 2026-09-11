// ==============================================================================
// HIPOTECALY TASADOR IA - UMBRALES Y CONFIGURACIÓN DE DEDUPLICACIÓN V1
// Umbrales Configurables y Separación de Señales Exactas vs. Probabilísticas
// ==============================================================================

import { CandidateConfidenceLevel } from '../types/tasadorPipelineTypes';

export interface DedupThresholdConfig {
  veryHighConfidenceThreshold: number; // >= 95 (Auto-link seguro / Match inequívoco)
  highConfidenceThreshold: number; // 85 - 94 (Alta probabilidad)
  reviewThreshold: number; // 70 - 84 (Candidato para revisión)
  lowConfidenceThreshold: number; // < 70 (Propiedades distintas)
  maxGeoDistanceMeters: number; // 100m
  maxAreaTolerancePercentage: number; // 5%
  maxPriceTolerancePercentage: number; // 10%
}

export const DEFAULT_DEDUP_CONFIG: DedupThresholdConfig = {
  veryHighConfidenceThreshold: 95.0,
  highConfidenceThreshold: 85.0,
  reviewThreshold: 70.0,
  lowConfidenceThreshold: 70.0,
  maxGeoDistanceMeters: 100,
  maxAreaTolerancePercentage: 5.0,
  maxPriceTolerancePercentage: 10.0,
};

export function classifyConfidenceLevel(
  score: number,
  config: DedupThresholdConfig = DEFAULT_DEDUP_CONFIG
): CandidateConfidenceLevel {
  if (score >= config.veryHighConfidenceThreshold) return 'VERY_HIGH_CONFIDENCE';
  if (score >= config.highConfidenceThreshold) return 'HIGH_CONFIDENCE';
  if (score >= config.reviewThreshold) return 'REVIEW';
  return 'LOW_CONFIDENCE';
}
