// ==============================================================================
// HIPOTECALY TASADOR IA - MOTOR DE CALIDAD DE DATOS (DATA QUALITY SCORE V1)
// Score de 0 a 100 y Generador de Advertencias para Trazabilidad
// ==============================================================================

import { NormalizedListing, DataQualityReport } from '../types/tasadorPipelineTypes';
import { OutlierDetector } from './OutlierDetector';

export class DataQualityEngine {
  public static evaluate(listing: NormalizedListing): DataQualityReport {
    const outlierResult = OutlierDetector.check(listing);

    // 1. Completitud de Ubicación (25 pts)
    let locScore = 0;
    if (listing.department) locScore += 5;
    if (listing.neighborhood || listing.locality) locScore += 8;
    if (listing.streetName) locScore += 6;
    if (listing.streetNumber) locScore += 3;
    if (listing.latitude && listing.longitude) locScore += 3;
    const locationCompleteness = Math.min(100, Math.round((locScore / 25) * 100));

    // 2. Completitud de Superficies (20 pts)
    let surfScore = 0;
    if (listing.builtAreaM2 && listing.builtAreaM2 > 0) surfScore += 12;
    if (listing.totalAreaM2 && listing.totalAreaM2 > 0) surfScore += 8;
    const surfaceCompleteness = Math.min(100, Math.round((surfScore / 20) * 100));

    // 3. Validez de Precio (20 pts)
    let priceScore = 0;
    if (listing.priceUsd > 0) priceScore += 15;
    if (listing.currentCurrency) priceScore += 5;
    const priceCompleteness = Math.min(100, Math.round((priceScore / 20) * 100));

    // 4. Especificaciones del Inmueble (15 pts)
    let specsScore = 0;
    if (listing.propertyType && listing.propertyType !== 'UNKNOWN') specsScore += 5;
    if (listing.bedrooms !== null) specsScore += 4;
    if (listing.bathrooms !== null) specsScore += 3;
    if (listing.constructionYear !== null || listing.condition !== null) specsScore += 3;
    const specsCompleteness = Math.min(100, Math.round((specsScore / 15) * 100));

    // 5. Medios e Imágenes (10 pts)
    let mediaScore = 0;
    const photoCount = listing.media.filter((m) => m.mediaType === 'IMAGE').length;
    if (photoCount >= 5) mediaScore = 10;
    else if (photoCount >= 1) mediaScore = 6;
    const mediaCompleteness = Math.min(100, Math.round((mediaScore / 10) * 100));

    // 6. Consistencia y Penalización por Warnings (10 pts)
    let consistencyScore = 10;
    if (outlierResult.warnings.includes('AREA_INCONSISTENCY')) consistencyScore -= 5;
    if (outlierResult.warnings.includes('NEGATIVE_ROOMS_OR_BATHS')) consistencyScore -= 5;
    if (outlierResult.warnings.includes('COORDINATES_OUT_OF_BOUNDS')) consistencyScore -= 5;
    if (outlierResult.warnings.includes('OUTLIER_VALUE')) consistencyScore -= 5;
    consistencyScore = Math.max(0, consistencyScore);

    // Suma Total (0 - 100)
    let rawQuality =
      locScore + surfScore + priceScore + specsScore + mediaScore + consistencyScore;

    if (outlierResult.isOutlier) {
      rawQuality = Math.min(rawQuality, 50); // Penalización si es outlier
    }

    const qualityScore = Math.min(100, Math.max(0, rawQuality));

    return {
      qualityScore,
      warnings: outlierResult.warnings,
      completeness: {
        location: locationCompleteness,
        surfaces: surfaceCompleteness,
        price: priceCompleteness,
        specs: specsCompleteness,
        media: mediaCompleteness,
      },
      isOutlier: outlierResult.isOutlier,
      outlierReasons: outlierResult.reasons,
    };
  }
}
