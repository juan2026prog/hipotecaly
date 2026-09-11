// ==============================================================================
// HIPOTECALY TASADOR IA - DETECTOR DETERMINÍSTICO DE ANOMALÍAS Y OUTLIERS
// Detección sin eliminación automática (Marcado y Advertencias)
// ==============================================================================

import { NormalizedListing, QualityWarningCode } from '../types/tasadorPipelineTypes';

export interface OutlierCheckResult {
  isOutlier: boolean;
  warnings: QualityWarningCode[];
  reasons: string[];
}

// Bounding box geográfico oficial de la República Oriental del Uruguay
export const URUGUAY_GEO_BOUNDS = {
  minLat: -35.5,
  maxLat: -30.0,
  minLng: -58.5,
  maxLng: -53.0,
};

export class OutlierDetector {
  public static check(listing: NormalizedListing): OutlierCheckResult {
    const warnings: QualityWarningCode[] = [];
    const reasons: string[] = [];

    // 1. Validación de Precio
    if (!listing.priceUsd || listing.priceUsd <= 0) {
      warnings.push('AMBIGUOUS_PRICE');
      reasons.push('Precio menor o igual a cero o no especificado');
    } else if (listing.priceUsd < 5000 && listing.operationType === 'SALE') {
      warnings.push('OUTLIER_VALUE');
      reasons.push(`Precio de venta excesivamente bajo (USD ${listing.priceUsd})`);
    } else if (listing.priceUsd > 25000000) {
      warnings.push('OUTLIER_VALUE');
      reasons.push(`Precio de venta atípico o extremo (USD ${listing.priceUsd})`);
    }

    // 2. Validación de Superficies
    const area = listing.builtAreaM2 || listing.totalAreaM2;
    if (!area || area <= 0) {
      warnings.push('MISSING_AREA');
      reasons.push('Superficie ausente o menor o igual a cero');
    } else {
      if (area < 10) {
        warnings.push('OUTLIER_VALUE');
        reasons.push(`Superficie inverosímil (${area} m²)`);
      } else if (area > 50000 && listing.propertyType !== 'RURAL' && listing.propertyType !== 'LAND') {
        warnings.push('OUTLIER_VALUE');
        reasons.push(`Superficie urbana excesiva (${area} m²) para tipo ${listing.propertyType}`);
      }

      // Inconsistencia de superficie construida vs total
      if (
        listing.builtAreaM2 &&
        listing.totalAreaM2 &&
        listing.builtAreaM2 > listing.totalAreaM2 * 1.05 &&
        listing.propertyType !== 'LAND'
      ) {
        warnings.push('AREA_INCONSISTENCY');
        reasons.push(
          `Superficie edificada (${listing.builtAreaM2} m²) mayor a superficie total (${listing.totalAreaM2} m²)`
        );
      }
    }

    // 3. Validación de Precio por Metro Cuadrado
    if (listing.pricePerM2Usd && listing.operationType === 'SALE') {
      if (listing.pricePerM2Usd < 150 && listing.propertyType !== 'RURAL' && listing.propertyType !== 'LAND') {
        warnings.push('OUTLIER_VALUE');
        reasons.push(`Precio por m² inverosímilmente bajo (USD ${listing.pricePerM2Usd}/m²)`);
      } else if (listing.pricePerM2Usd > 18000) {
        warnings.push('OUTLIER_VALUE');
        reasons.push(`Precio por m² fuera de rango habitual (USD ${listing.pricePerM2Usd}/m²)`);
      }
    }

    // 4. Validación de Habitaciones / Baños
    if (
      (listing.bedrooms != null && listing.bedrooms < 0) ||
      (listing.bathrooms != null && listing.bathrooms < 0) ||
      (listing.toilets != null && listing.toilets < 0) ||
      (listing.garages != null && listing.garages < 0)
    ) {
      warnings.push('NEGATIVE_ROOMS_OR_BATHS');
      reasons.push('Valores negativos en recuentos de dormitorios, baños o garajes');
    }

    // 5. Validación Geográfica dentro del territorio Uruguayo
    if (listing.latitude && listing.longitude) {
      const latValid =
        listing.latitude >= URUGUAY_GEO_BOUNDS.minLat &&
        listing.latitude <= URUGUAY_GEO_BOUNDS.maxLat;
      const lngValid =
        listing.longitude >= URUGUAY_GEO_BOUNDS.minLng &&
        listing.longitude <= URUGUAY_GEO_BOUNDS.maxLng;

      if (!latValid || !lngValid) {
        warnings.push('COORDINATES_OUT_OF_BOUNDS');
        reasons.push(
          `Coordenadas (${listing.latitude}, ${listing.longitude}) situadas fuera del territorio de Uruguay`
        );
      }
    }

    // 6. Precisión de Ubicación
    if (listing.locationPrecision === 'UNKNOWN' || listing.locationPrecision === 'APPROXIMATE') {
      warnings.push('LOCATION_APPROXIMATE');
    }

    return {
      isOutlier: warnings.includes('OUTLIER_VALUE') || warnings.includes('COORDINATES_OUT_OF_BOUNDS'),
      warnings,
      reasons,
    };
  }
}
