// ==============================================================================
// HIPOTECALY TASADOR IA - BUSCADOR DE CANDIDATOS COMPARABLES (FASE 3)
// Búsqueda Progresiva Multinivel, Agrupación de Masters y Aplicación del 12%
// ==============================================================================

import {
  TargetPropertyInput,
  ComparableCandidate,
  GeographicSearchLevel,
  PriceEvidenceHierarchy,
  AppraisalSettingsV1,
} from './valuationTypes';
import { NormalizedListing } from '../types/tasadorPipelineTypes';
import { calculateHaversineDistanceMeters } from '../deduplication/DedupScoringEngine';
import { areNeighborhoodsAdjacent } from '../normalization/UruguayLocationDictionary';

export function normalizeComparablePropertyType(pt?: string): string {
  if (!pt) return 'APARTMENT';
  const u = pt.trim().toUpperCase();
  if (u === 'APARTAMENTO' || u === 'APARTMENT' || u === 'APTO' || u === 'DEPARTAMENTO') return 'APARTMENT';
  if (u === 'CASA' || u === 'HOUSE' || u === 'CHALET') return 'HOUSE';
  if (u === 'TERRENO' || u === 'LAND' || u === 'LOTE' || u === 'SOLAR') return 'LAND';
  if (u === 'LOCAL' || u === 'COMMERCIAL' || u === 'COMERCIAL') return 'COMMERCIAL';
  if (u === 'OFICINA' || u === 'OFFICE') return 'OFFICE';
  if (u === 'PH' || u === 'PROPIEDAD_HORIZONTAL') return 'PH';
  return u;
}

export function isMatchingPropertyType(a?: string, b?: string): boolean {
  if (!a || !b) return true;
  return normalizeComparablePropertyType(a) === normalizeComparablePropertyType(b);
}

export interface CandidateFinderResult {
  candidates: ComparableCandidate[];
  geographicLevel: GeographicSearchLevel;
  searchRadiusMeters: number;
  reason: string;
  totalPoolConsidered: number;
}

export class ComparableCandidateFinder {
  /**
   * Busca comparables candidatos mediante expansión geográfica progresiva
   * Garantiza:
   * 1. 1 Inmueble Físico = 1 Comparable (agrupación por masterId)
   * 2. asking_price_adjustment = 0.1200 aplicado exactamente 1 vez a asking prices
   * 3. 0% de ajuste a transacciones reales confirmadas
   */
  public static findCandidates(
    target: TargetPropertyInput,
    allListings: NormalizedListing[],
    settings: AppraisalSettingsV1
  ): CandidateFinderResult {
    // 1. Filtrar publicaciones de venta válidas
    const saleListings = allListings.filter(
      (l) => l.operationType === 'SALE' && l.priceUsd && l.priceUsd > 0 && l.department
    );

    // 2. Agrupar publicaciones por Property Master para evitar contar duplicados como comparables independientes
    const masterGroups = new Map<string, NormalizedListing[]>();
    for (const listing of saleListings) {
      const masterKey = listing.propertyMasterId || listing.sourceListingKey || listing.sourceListingId;
      const existing = masterGroups.get(masterKey) || [];
      existing.push(listing);
      masterGroups.set(masterKey, existing);
    }

    // Convertir cada Master Group en un ComparableCandidate representativo
    const allCandidates: ComparableCandidate[] = [];
    for (const [masterId, group] of masterGroups.entries()) {
      // No incluir la misma propiedad objetivo como comparable de sí misma
      if (target.propertyMasterId && masterId === target.propertyMasterId) {
        continue;
      }

      // Tomar el listing más completo o más reciente del grupo
      const primary = group.sort((a, b) => (b.dataQualityScore || 0) - (a.dataQualityScore || 0))[0];

      // Determinar jerarquía de precio y aplicar el 12% con estricta regla de 1 sola vez
      let hierarchy: PriceEvidenceHierarchy = 'ADJUSTED_ASKING_PRICE';
      let isAdjusted = false;
      let adjustmentPct = 0;
      let effectivePrice = primary.priceUsd;

      // Si la fuente o metadata confirma transacción real o tasación verificada
      const isConfirmed = primary.sourceCode === 'catastro_transaccion' || (primary as any).isConfirmedTransaction;

      if (isConfirmed) {
        hierarchy = 'CONFIRMED_TRANSACTION';
        isAdjusted = false;
        adjustmentPct = 0;
        effectivePrice = primary.priceUsd; // Sin descuento
      } else {
        // Asking price de portal: aplicar asking_price_adjustment (0.1200 = 12%) EXACTAMENTE UNA VEZ
        hierarchy = 'ADJUSTED_ASKING_PRICE';
        isAdjusted = true;
        adjustmentPct = settings.askingPriceAdjustment * 100; // 12.00%
        effectivePrice = Math.round(primary.priceUsd * (1 - settings.askingPriceAdjustment)); // price * 0.88
      }

      const builtArea = primary.builtAreaM2 || primary.totalAreaM2 || 0;
      const pricePerM2 = builtArea > 0 ? Math.round(effectivePrice / builtArea) : 0;

      // Distancia GPS si hay coordenadas disponibles
      let distanceMeters: number | null = null;
      if (
        target.latitude &&
        target.longitude &&
        primary.latitude &&
        primary.longitude
      ) {
        distanceMeters = calculateHaversineDistanceMeters(
          target.latitude,
          target.longitude,
          primary.latitude,
          primary.longitude
        );
      }

      // Cálculo de días de recencia
      const pubDate = primary.publicationDate ? new Date(primary.publicationDate) : new Date();
      const daysSince = Math.max(0, Math.floor((Date.now() - pubDate.getTime()) / (1000 * 60 * 60 * 24)));

      allCandidates.push({
        id: `cand_${primary.sourceCode}_${primary.sourceListingId}`,
        propertyMasterId: masterId,
        sourceListingId: primary.sourceListingId,
        sourceCode: primary.sourceCode,
        originalUrl: primary.originalUrl,
        title: primary.title,
        propertyType: primary.propertyType,
        department: primary.department,
        city: primary.city,
        neighborhood: primary.neighborhood,
        streetName: primary.streetName,
        latitude: primary.latitude,
        longitude: primary.longitude,
        builtAreaM2: builtArea,
        totalAreaM2: primary.totalAreaM2,
        landAreaM2: primary.landAreaM2,
        bedrooms: primary.bedrooms,
        bathrooms: primary.bathrooms,
        garages: primary.garages,
        constructionYear: primary.constructionYear,
        rawAskingPriceUsd: primary.priceUsd,
        currency: 'USD',
        priceEvidenceHierarchy: hierarchy,
        isPriceAdjusted: isAdjusted,
        priceAdjustmentPercentage: adjustmentPct,
        effectivePriceUsd: effectivePrice,
        pricePerM2Usd: pricePerM2,
        publicationDate: primary.publicationDate,
        daysSincePublication: daysSince,
        dataQualityScore: primary.dataQualityScore || 70,
        distanceMeters,
        isConfirmedTransaction: isConfirmed,
      });
    }

    // 3. Estrategia Progresiva Geográfica
    // Nivel A: Immediate (< 800m)
    let searchLevel: GeographicSearchLevel = 'IMMEDIATE';
    let searchRadius = 800;
    let reason = 'Búsqueda en zona inmediata por proximidad geográfica (< 800m)';

    let filtered = allCandidates.filter((c) => {
      if (!isMatchingPropertyType(c.propertyType, target.propertyType)) return false;
      if (c.department.toLowerCase() !== target.department.toLowerCase()) return false;
      return (
        c.distanceMeters !== null &&
        c.distanceMeters !== undefined &&
        c.distanceMeters <= 800
      );
    });

    // Nivel B: Mismo Barrio si no alcanza minComparables
    if (filtered.length < settings.minComparables && target.neighborhood) {
      searchLevel = 'NEIGHBORHOOD';
      searchRadius = 2500;
      reason = `Ampliación a todo el barrio ${target.neighborhood} por insuficiencia de comparables inmediatos`;
      filtered = allCandidates.filter((c) => {
        if (!isMatchingPropertyType(c.propertyType, target.propertyType)) return false;
        if (c.department.toLowerCase() !== target.department.toLowerCase()) return false;
        return (
          c.neighborhood &&
          c.neighborhood.toLowerCase() === (target.neighborhood || '').toLowerCase()
        );
      });
    }

    // Nivel C: Barrios Limítrofes / Comparables
    if (filtered.length < settings.minComparables && target.neighborhood) {
      searchLevel = 'ADJACENT_NEIGHBORHOODS';
      searchRadius = 5000;
      reason = `Ampliación a barrios limítrofes/comparables de ${target.neighborhood}`;
      filtered = allCandidates.filter((c) => {
        if (!isMatchingPropertyType(c.propertyType, target.propertyType)) return false;
        if (c.department.toLowerCase() !== target.department.toLowerCase()) return false;
        return (
          (c.neighborhood &&
            c.neighborhood.toLowerCase() === (target.neighborhood || '').toLowerCase()) ||
          areNeighborhoodsAdjacent(c.neighborhood, target.neighborhood, target.department)
        );
      });
    }

    // Nivel D: Localidad / Ciudad
    if (filtered.length < settings.minComparables && target.city) {
      searchLevel = 'LOCALITY';
      searchRadius = 15000;
      reason = `Ampliación a toda la localidad ${target.city}`;
      filtered = allCandidates.filter((c) => {
        if (!isMatchingPropertyType(c.propertyType, target.propertyType)) return false;
        if (c.department.toLowerCase() !== target.department.toLowerCase()) return false;
        return c.city && c.city.toLowerCase() === (target.city || '').toLowerCase();
      });
    }

    // Nivel E: Departamento Completo (Mercado amplio)
    if (filtered.length < settings.minComparables) {
      searchLevel = 'DEPARTMENT';
      searchRadius = 50000;
      reason = `Ampliación a todo el departamento de ${target.department} por baja densidad de comparables`;
      filtered = allCandidates.filter((c) => {
        if (!isMatchingPropertyType(c.propertyType, target.propertyType)) return false;
        return c.department.toLowerCase() === target.department.toLowerCase();
      });
    }

    return {
      candidates: filtered,
      geographicLevel: searchLevel,
      searchRadiusMeters: searchRadius,
      reason,
      totalPoolConsidered: allCandidates.length,
    };
  }
}
