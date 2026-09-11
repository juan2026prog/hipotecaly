// ==============================================================================
// HIPOTECALY TASADOR IA - MOTOR MULTI-SEÑAL DE DEDUPLICACIÓN V1
// Distinción de Señales Exactas y Probabilísticas (0 - 100)
// ==============================================================================

import {
  NormalizedListing,
  DedupScoreBreakdown,
} from '../types/tasadorPipelineTypes';
import {
  DEFAULT_DEDUP_CONFIG,
  DedupThresholdConfig,
  classifyConfidenceLevel,
} from './DedupThresholds';
import { cleanText } from '../normalization/UruguayLocationDictionary';

export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Radio de la Tierra en metros
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export class DedupScoringEngine {
  /**
   * Fórmula de Haversine para calcular distancia exacta en metros entre dos coordenadas GPS
   */
  public static calculateHaversineDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    return calculateHaversineDistanceMeters(lat1, lon1, lat2, lon2);
  }

  public static calculateJaccardSimilarity(str1: string, str2: string): number {
    const s1 = new Set(cleanText(str1).split(/\s+/).filter((w) => w.length > 2));
    const s2 = new Set(cleanText(str2).split(/\s+/).filter((w) => w.length > 2));

    if (s1.size === 0 || s2.size === 0) return 0;

    let intersection = 0;
    for (const word of s1) {
      if (s2.has(word)) intersection++;
    }

    const union = s1.size + s2.size - intersection;
    return union === 0 ? 0 : intersection / union;
  }

  public static compareListings(
    a: NormalizedListing,
    b: NormalizedListing,
    config: DedupThresholdConfig = DEFAULT_DEDUP_CONFIG
  ): DedupScoreBreakdown {
    let cadastralScore = 0;
    let addressScore = 0;
    let geoScore = 0;
    let photoScore = 0;
    let priceScore = 0;
    let areaScore = 0;
    let bedroomsScore = 0;
    let textScore = 0;

    const matchReasons: string[] = [];
    const evidenceDetails: Record<string, unknown> = {};

    // 1. Señal Exacta: Padrón Catastral (Si está presente en ambos)
    if (a.cadastralNumber && b.cadastralNumber && a.department === b.department) {
      if (a.cadastralNumber === b.cadastralNumber) {
        cadastralScore = 100;
        matchReasons.push(`Mismo padrón catastral (${a.cadastralNumber}) en ${a.department}`);
      }
    }

    // 2. Señal Exacta / Fuerte: Dirección Normalizada
    if (a.streetName && b.streetName && cleanText(a.streetName) === cleanText(b.streetName)) {
      if (a.streetNumber && b.streetNumber && a.streetNumber === b.streetNumber) {
        if (a.unit && b.unit && a.unit === b.unit) {
          addressScore = 100;
          matchReasons.push(`Misma dirección exacta y unidad (${a.normalizedAddress})`);
        } else if (!a.unit && !b.unit) {
          // Si es apartamento sin unidad especificada, es mismo edificio pero unidad incierta
          if (a.propertyType === 'APARTMENT' || b.propertyType === 'APARTMENT') {
            addressScore = 70;
            matchReasons.push(`Mismo edificio pero unidades no especificadas`);
          } else {
            addressScore = 95;
            matchReasons.push(`Misma dirección y número (${a.normalizedAddress})`);
          }
        } else {
          addressScore = 60; // Mismo edificio, diferente unidad
        }
      } else {
        addressScore = 40; // Misma calle
      }
    } else if (a.neighborhood && b.neighborhood && cleanText(a.neighborhood).length > 2 && cleanText(a.neighborhood) === cleanText(b.neighborhood)) {
      addressScore = 20; // Mismo barrio
    }

    // 3. Señal Geoespacial: Distancia GPS
    if (a.latitude && a.longitude && b.latitude && b.longitude) {
      const distanceMeters = this.calculateHaversineDistanceMeters(
        a.latitude,
        a.longitude,
        b.latitude,
        b.longitude
      );
      evidenceDetails['distanceMeters'] = distanceMeters;

      if (distanceMeters <= 20) {
        geoScore = 100;
        matchReasons.push(`Coordenadas coincidentes (<20m de distancia)`);
      } else if (distanceMeters <= 50) {
        geoScore = 80;
        matchReasons.push(`Coordenadas muy cercanas (${distanceMeters}m)`);
      } else if (distanceMeters <= config.maxGeoDistanceMeters) {
        geoScore = 50;
      }
    }

    // 4. Señal Visual: Hash de Fotos
    const aHashes = new Set(a.media.map((m) => m.sha256Hash).filter(Boolean));
    const bHashes = new Set(b.media.map((m) => m.sha256Hash).filter(Boolean));
    if (aHashes.size > 0 && bHashes.size > 0) {
      let sharedPhotos = 0;
      for (const h of aHashes) {
        if (bHashes.has(h)) sharedPhotos++;
      }
      if (sharedPhotos > 0) {
        const ratio = sharedPhotos / Math.min(aHashes.size, bHashes.size);
        photoScore = Math.round(ratio * 100);
        matchReasons.push(`${sharedPhotos} fotos idénticas compartidas entre publicaciones`);
      }
    }

    // 5. Superficies
    const aArea = a.builtAreaM2 || a.totalAreaM2;
    const bArea = b.builtAreaM2 || b.totalAreaM2;
    if (aArea && bArea && aArea > 0 && bArea > 0) {
      const diffPct = (Math.abs(aArea - bArea) / Math.max(aArea, bArea)) * 100;
      evidenceDetails['areaDiffPercentage'] = Math.round(diffPct * 10) / 10;
      if (diffPct <= 2.0) {
        areaScore = 100;
        matchReasons.push(`Superficie prácticamente idéntica (${aArea}m² vs ${bArea}m²)`);
      } else if (diffPct <= config.maxAreaTolerancePercentage) {
        areaScore = 80;
      } else if (diffPct <= 10.0) {
        areaScore = 40;
      }
    }

    // 6. Dormitorios y Baños
    if (a.bedrooms != null && b.bedrooms != null) {
      if (a.bedrooms === b.bedrooms) {
        bedroomsScore = 100;
      } else if (Math.abs(a.bedrooms - b.bedrooms) === 1) {
        bedroomsScore = 30;
      }
    }

    // 7. Precio (Tolerancia de mercado)
    if (a.priceUsd > 0 && b.priceUsd > 0) {
      const priceDiffPct = (Math.abs(a.priceUsd - b.priceUsd) / Math.max(a.priceUsd, b.priceUsd)) * 100;
      evidenceDetails['priceDiffPercentage'] = Math.round(priceDiffPct * 10) / 10;
      if (priceDiffPct <= 1.0) {
        priceScore = 100;
      } else if (priceDiffPct <= config.maxPriceTolerancePercentage) {
        priceScore = 80;
      } else if (priceDiffPct <= 20.0) {
        priceScore = 40;
      }
    }

    // 8. Similitud de Texto (Título)
    const textSim = this.calculateJaccardSimilarity(a.titleNormalized, b.titleNormalized);
    textScore = Math.round(textSim * 100);

    // CÁLCULO PONDERADO DE SCORE FINAL (0 - 100)
    let totalScore = 0;

    // Caso A: Si hay padrón exacto validado
    if (cadastralScore === 100 && a.propertyType === b.propertyType) {
      totalScore = 98.0;
    }
    // Caso B: Si hay fotos idénticas + mismo barrio real + superficie similar
    else if (
      photoScore >= 80 &&
      a.neighborhood &&
      b.neighborhood &&
      cleanText(a.neighborhood) === cleanText(b.neighborhood) &&
      areaScore >= 80
    ) {
      totalScore = 95.0;
    }
    // Caso C: Si hay dirección exacta + superficie similar + dormitorios
    else if (addressScore >= 95 && areaScore >= 80 && bedroomsScore === 100) {
      totalScore = 96.0;
    }
    // Caso D: Scoring probabilístico estándar
    else {
      totalScore =
        addressScore * 0.30 +
        geoScore * 0.20 +
        photoScore * 0.20 +
        areaScore * 0.15 +
        bedroomsScore * 0.05 +
        priceScore * 0.05 +
        textScore * 0.05;
    }

    totalScore = Math.min(100, Math.max(0, Math.round(totalScore * 10) / 10));
    const confidenceLevel = classifyConfidenceLevel(totalScore, config);

    return {
      totalScore,
      cadastralScore,
      addressScore,
      geoScore,
      photoScore,
      priceScore,
      areaScore,
      bedroomsScore,
      textScore,
      confidenceLevel,
      matchReasons,
      evidenceDetails,
    };
  }
}
