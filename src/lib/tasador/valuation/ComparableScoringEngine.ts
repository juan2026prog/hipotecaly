// ==============================================================================
// HIPOTECALY TASADOR IA - MOTOR DE SCORING DE SIMILITUD DE COMPARABLES (FASE 3)
// Puntuación Multidimensional 0-100 y Ajustes Directos Determinísticos
// ==============================================================================

import {
  TargetPropertyInput,
  ComparableCandidate,
  DimensionalSimilarityScore,
  ScoredComparable,
  AppraisalSettingsV1,
} from './valuationTypes';
import { areNeighborhoodsAdjacent } from '../normalization/UruguayLocationDictionary';
import { normalizeComparablePropertyType } from './ComparableCandidateFinder';

export class ComparableScoringEngine {
  /**
   * Evalúa la similitud multidimensional entre el inmueble objetivo y un candidato comparable
   */
  public static scoreCandidate(
    target: TargetPropertyInput,
    candidate: ComparableCandidate,
    settings: AppraisalSettingsV1
  ): ScoredComparable {
    // 1. Location Score (0 - 100)
    let locationScore = 40; // Default departamento
    if (candidate.distanceMeters !== null && candidate.distanceMeters !== undefined) {
      if (candidate.distanceMeters <= 100) locationScore = 100;
      else if (candidate.distanceMeters <= 300) locationScore = 95;
      else if (candidate.distanceMeters <= 600) locationScore = 90;
      else if (candidate.distanceMeters <= 1200) locationScore = 80;
      else if (candidate.distanceMeters <= 2500) locationScore = 70;
      else if (candidate.distanceMeters <= 5000) locationScore = 55;
      else locationScore = 40;
    } else if (
      target.neighborhood &&
      candidate.neighborhood &&
      target.neighborhood.toLowerCase() === candidate.neighborhood.toLowerCase()
    ) {
      locationScore = 85;
    } else if (
      areNeighborhoodsAdjacent(target.neighborhood, candidate.neighborhood, target.department)
    ) {
      locationScore = 70;
    } else if (
      target.city &&
      candidate.city &&
      target.city.toLowerCase() === candidate.city.toLowerCase()
    ) {
      locationScore = 60;
    }

    // 2. Property Type Score (0 - 100)
    const normTargetType = normalizeComparablePropertyType(target.propertyType);
    const normCandType = normalizeComparablePropertyType(candidate.propertyType);
    let propertyTypeScore = 0;
    if (normTargetType === normCandType) {
      propertyTypeScore = 100;
    } else if (
      (normTargetType === 'APARTMENT' && normCandType === 'PH') ||
      (normTargetType === 'PH' && normCandType === 'APARTMENT')
    ) {
      propertyTypeScore = 75;
    } else if (
      (normTargetType === 'HOUSE' && normCandType === 'PH') ||
      (normTargetType === 'PH' && normCandType === 'HOUSE')
    ) {
      propertyTypeScore = 70;
    } else {
      propertyTypeScore = 10;
    }

    // 3. Surface Score (0 - 100)
    const targetArea = target.builtAreaM2 > 0 ? target.builtAreaM2 : target.totalAreaM2 || 1;
    const candArea = candidate.builtAreaM2 > 0 ? candidate.builtAreaM2 : candidate.totalAreaM2 || 1;
    const areaDiffPct = Math.abs(targetArea - candArea) / targetArea;
    const surfaceScore = Math.max(0, Math.round(100 - areaDiffPct * 120));

    // 4. Bedrooms Score (0 - 100)
    let bedroomsScore = 80; // Default si no se declara
    if (target.bedrooms !== null && target.bedrooms !== undefined && candidate.bedrooms !== null && candidate.bedrooms !== undefined) {
      const diff = Math.abs(target.bedrooms - candidate.bedrooms);
      if (diff === 0) bedroomsScore = 100;
      else if (diff === 1) bedroomsScore = 75;
      else if (diff === 2) bedroomsScore = 40;
      else bedroomsScore = 10;
    }

    // 5. Bathrooms Score (0 - 100)
    let bathroomsScore = 80;
    if (target.bathrooms !== null && target.bathrooms !== undefined && candidate.bathrooms !== null && candidate.bathrooms !== undefined) {
      const diff = Math.abs(target.bathrooms - candidate.bathrooms);
      if (diff === 0) bathroomsScore = 100;
      else if (diff === 1) bathroomsScore = 80;
      else bathroomsScore = 30;
    }

    // 6. Garage Score (0 - 100)
    let garageScore = 80;
    if (target.garages !== null && target.garages !== undefined && candidate.garages !== null && candidate.garages !== undefined) {
      const diff = Math.abs(target.garages - candidate.garages);
      if (diff === 0) garageScore = 100;
      else if (diff === 1) garageScore = 70;
      else garageScore = 40;
    }

    // 7. Age / Year Score (0 - 100)
    let ageScore = 75;
    if (target.constructionYear && candidate.constructionYear) {
      const yearDiff = Math.abs(target.constructionYear - candidate.constructionYear);
      if (yearDiff <= 3) ageScore = 100;
      else if (yearDiff <= 10) ageScore = 85;
      else if (yearDiff <= 25) ageScore = 65;
      else ageScore = 40;
    }

    // 8. Recency Score (0 - 100)
    let recencyFactor = 1.0;
    for (const bucket of settings.recencyBuckets) {
      if (
        candidate.daysSincePublication >= bucket.minDays &&
        candidate.daysSincePublication <= bucket.maxDays
      ) {
        recencyFactor = bucket.decayFactor;
        break;
      }
    }
    const recencyScore = Math.round(recencyFactor * 100);

    // 9. Data Quality Score (0 - 100)
    const dataQualityScore = Math.min(100, Math.max(0, candidate.dataQualityScore || 70));

    // 10. Final Weighted Similarity Score
    const w = settings.weights;
    const finalSimilarityScore = Math.round(
      locationScore * w.location +
      propertyTypeScore * w.propertyType +
      surfaceScore * (w.builtArea + w.totalArea) +
      bedroomsScore * w.bedrooms +
      bathroomsScore * w.bathrooms +
      garageScore * w.garage +
      ageScore * (w.age + w.condition) +
      recencyScore * w.recency +
      dataQualityScore * w.dataQuality
    );

    const similarity: DimensionalSimilarityScore = {
      locationScore,
      propertyTypeScore,
      surfaceScore,
      bedroomsScore,
      bathroomsScore,
      garageScore,
      ageScore,
      recencyScore,
      dataQualityScore,
      finalSimilarityScore,
    };

    // 11. Ajuste Directo Determinístico (Direct Comparable Adjustment)
    // Coeficientes prudentes versionados:
    // Ajuste por superficie: proportional al m2
    // Ajuste por dormitorio: +/- 3%
    // Ajuste por baño: +/- 2%
    // Ajuste por garaje: +/- 4%
    let adjustmentFactor = 1.0;

    if (target.bedrooms !== null && target.bedrooms !== undefined && candidate.bedrooms !== null && candidate.bedrooms !== undefined) {
      const diffBed = target.bedrooms - candidate.bedrooms;
      adjustmentFactor += diffBed * 0.03; // Si target tiene más dormitorios, sube el valor equivalente del comparable
    }

    if (target.bathrooms !== null && target.bathrooms !== undefined && candidate.bathrooms !== null && candidate.bathrooms !== undefined) {
      const diffBath = target.bathrooms - candidate.bathrooms;
      adjustmentFactor += diffBath * 0.02;
    }

    if (target.garages !== null && target.garages !== undefined && candidate.garages !== null && candidate.garages !== undefined) {
      const diffGar = target.garages - candidate.garages;
      adjustmentFactor += diffGar * 0.04;
    }

    // Ajuste por área
    if (candArea > 0 && targetArea > 0) {
      const areaRatio = targetArea / candArea;
      // Suavizamos el efecto de escala (elasticidad 0.7)
      const scaledAreaAdjustment = 1 + (areaRatio - 1) * 0.70;
      adjustmentFactor = adjustmentFactor * scaledAreaAdjustment;
    }

    // Limitar el factor de ajuste directo a un rango prudente [0.5, 2.0]
    adjustmentFactor = Math.max(0.5, Math.min(2.0, adjustmentFactor));
    const directlyAdjustedPriceUsd = Math.round(candidate.effectivePriceUsd * adjustmentFactor);

    return {
      ...candidate,
      similarity,
      weight: 0, // Se computa en ComparableWeightEngine
      isOutlier: false,
      outlierReason: null,
      directAdjustmentFactor: Number(adjustmentFactor.toFixed(4)),
      directlyAdjustedPriceUsd,
    };
  }
}
