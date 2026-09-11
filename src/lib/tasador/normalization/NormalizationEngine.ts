// ==============================================================================
// HIPOTECALY TASADOR IA - MOTOR CENTRAL DE NORMALIZACIÓN URUGUAY
// Desacoplado de crawlers, 100% determinístico y con trazabilidad de evidencia
// ==============================================================================

import {
  RawListingPayload,
  NormalizedListing,
  NormalizedField,
} from '../types/tasadorPipelineTypes';
import {
  normalizeDepartment,
  normalizeNeighborhood,
  normalizeStreetName,
  determineLocationPrecision,
} from './UruguayLocationDictionary';
import {
  normalizeOperationType,
  normalizePropertyType,
} from './PropertyTypeNormalizer';
import { normalizePrice } from './CurrencyNormalizer';
import { normalizeSurfaces } from './SurfaceNormalizer';
import { normalizeAmenities } from './AmenityNormalizer';

export class NormalizationEngine {
  public static normalize(raw: RawListingPayload): NormalizedListing {
    const evidence: Record<string, NormalizedField<unknown>> = {};

    // 1. Operación y Tipo de Propiedad
    const opNorm = normalizeOperationType(raw.operationTypeRaw);
    evidence['operationType'] = {
      rawValue: raw.operationTypeRaw,
      normalizedValue: opNorm.normalized,
      method: 'DICTIONARY_MATCH',
      confidence: opNorm.confidence,
      source: raw.sourceCode,
    };

    const typeNorm = normalizePropertyType(raw.propertyTypeRaw, raw.titleRaw);
    evidence['propertyType'] = {
      rawValue: raw.propertyTypeRaw,
      normalizedValue: typeNorm.normalized,
      method: 'DICTIONARY_MATCH',
      confidence: typeNorm.confidence,
      source: raw.sourceCode,
    };

    // 2. Ubicación
    const deptNorm = normalizeDepartment(raw.departmentRaw);
    evidence['department'] = {
      rawValue: raw.departmentRaw,
      normalizedValue: deptNorm.normalized,
      method: 'URUGUAY_DEPARTMENT_MAP',
      confidence: deptNorm.confidence,
      source: raw.sourceCode,
    };

    const neighNorm = normalizeNeighborhood(raw.neighborhoodRaw, deptNorm.normalized);
    evidence['neighborhood'] = {
      rawValue: raw.neighborhoodRaw,
      normalizedValue: neighNorm.normalized,
      method: 'MONTEVIDEO_MALDONADO_NEIGHBORHOOD_MAP',
      confidence: neighNorm.confidence,
      source: raw.sourceCode,
    };

    const streetNorm = normalizeStreetName(raw.streetNameRaw || raw.addressRaw);
    evidence['streetName'] = {
      rawValue: raw.streetNameRaw || raw.addressRaw,
      normalizedValue: streetNorm.normalized,
      method: 'STREET_PREFIX_CLEANER',
      confidence: streetNorm.confidence,
      source: raw.sourceCode,
    };

    const streetNumber = raw.streetNumberRaw ? raw.streetNumberRaw.trim() : null;
    const unit = raw.unitRaw ? raw.unitRaw.trim() : null;
    const floor = raw.floorRaw ? raw.floorRaw.trim() : null;
    const postalCode = raw.postalCodeRaw ? raw.postalCodeRaw.trim() : null;

    // Construcción de dirección normalizada canónica
    let normalizedAddress = streetNorm.normalized || raw.addressRaw || neighNorm.normalized || deptNorm.normalized;
    if (streetNorm.normalized && streetNumber) {
      normalizedAddress = `${streetNorm.normalized} ${streetNumber}`;
      if (unit) normalizedAddress += ` Apto ${unit}`;
      else if (floor) normalizedAddress += ` Piso ${floor}`;
    }

    const precision = determineLocationPrecision({
      streetName: streetNorm.normalized,
      streetNumber,
      latitude: raw.latitudeRaw,
      longitude: raw.longitudeRaw,
      neighborhood: neighNorm.normalized,
      city: raw.cityRaw,
      department: deptNorm.normalized,
    });

    evidence['locationPrecision'] = {
      rawValue: null,
      normalizedValue: precision,
      method: 'HEURISTIC_PRECISION_ANALYSIS',
      confidence: 90,
      source: raw.sourceCode,
    };

    // 3. Superficies
    const surfaces = normalizeSurfaces({
      totalAreaM2Raw: raw.totalAreaM2Raw,
      builtAreaM2Raw: raw.builtAreaM2Raw,
      landAreaM2Raw: raw.landAreaM2Raw,
      titleRaw: raw.titleRaw,
      descriptionRaw: raw.descriptionRaw,
    });

    evidence['totalAreaM2'] = {
      rawValue: raw.totalAreaM2Raw,
      normalizedValue: surfaces.totalAreaM2,
      method: 'SURFACE_PARSER',
      confidence: surfaces.confidence,
      source: raw.sourceCode,
    };

    evidence['builtAreaM2'] = {
      rawValue: raw.builtAreaM2Raw,
      normalizedValue: surfaces.builtAreaM2,
      method: 'SURFACE_PARSER',
      confidence: surfaces.confidence,
      source: raw.sourceCode,
    };

    // 4. Precios y Monedas
    const priceNorm = normalizePrice({
      priceRaw: raw.currentPriceRaw,
      currencyRaw: raw.currencyRaw,
      priceTextRaw: raw.priceTextRaw,
      totalAreaM2: surfaces.totalAreaM2,
      builtAreaM2: surfaces.builtAreaM2,
    });

    evidence['priceUsd'] = {
      rawValue: raw.currentPriceRaw || raw.priceTextRaw,
      normalizedValue: priceNorm.priceUsd,
      method: 'CURRENCY_NORMALIZER',
      confidence: priceNorm.confidence,
      source: raw.sourceCode,
    };

    // 5. Características (Dormitorios, Baños, etc.)
    const bedrooms = raw.bedroomsRaw !== undefined && raw.bedroomsRaw !== null ? Number(raw.bedroomsRaw) : null;
    const bathrooms = raw.bathroomsRaw !== undefined && raw.bathroomsRaw !== null ? Number(raw.bathroomsRaw) : null;
    const toilets = raw.toiletsRaw !== undefined && raw.toiletsRaw !== null ? Number(raw.toiletsRaw) : null;
    const garages = raw.garagesRaw !== undefined && raw.garagesRaw !== null ? Number(raw.garagesRaw) : null;
    const parkingSpaces = raw.parkingSpacesRaw !== undefined && raw.parkingSpacesRaw !== null ? Number(raw.parkingSpacesRaw) : garages;
    const constructionYear = raw.constructionYearRaw && raw.constructionYearRaw > 1800 ? Number(raw.constructionYearRaw) : null;
    const approximateAge = constructionYear ? new Date().getFullYear() - constructionYear : null;

    // 6. Amenities
    const amenities = normalizeAmenities({
      rawAmenities: raw.amenitiesRaw,
      titleRaw: raw.titleRaw,
      descriptionRaw: raw.descriptionRaw,
    });

    // 7. Texto Normalizado
    const titleNormalized = (raw.titleRaw || '').trim().replace(/\s+/g, ' ');
    const descriptionNormalized = (raw.descriptionRaw || '').trim().replace(/\s+/g, ' ');

    return {
      sourceCode: raw.sourceCode,
      sourceListingId: raw.sourceListingId,
      sourceListingKey: raw.sourceListingKey || `${raw.sourceCode}_${raw.sourceListingId}`,
      originalUrl: raw.originalUrl,
      canonicalUrl: raw.canonicalUrl || raw.originalUrl,
      titleNormalized,
      descriptionNormalized: descriptionNormalized.length > 0 ? descriptionNormalized : null,
      operationType: opNorm.normalized,
      propertyType: typeNorm.normalized,
      country: 'Uruguay',
      countryCode: 'UY',
      department: deptNorm.normalized,
      city: raw.cityRaw ? raw.cityRaw.trim() : deptNorm.normalized,
      locality: raw.localityRaw ? raw.localityRaw.trim() : null,
      neighborhood: neighNorm.normalized,
      subNeighborhood: neighNorm.subNeighborhood || raw.subNeighborhoodRaw || null,
      normalizedAddress,
      streetName: streetNorm.normalized,
      streetNumber,
      unit,
      floor,
      postalCode,
      latitude: raw.latitudeRaw || null,
      longitude: raw.longitudeRaw || null,
      locationPrecision: precision,
      cadastralNumber: raw.cadastralNumberRaw ? raw.cadastralNumberRaw.trim() : null,
      horizontalPropertyUnit: null,
      currentPrice: priceNorm.currentPrice,
      currentCurrency: priceNorm.currentCurrency,
      priceUsd: priceNorm.priceUsd,
      priceUyu: priceNorm.priceUyu,
      pricePerM2Usd: priceNorm.pricePerM2Usd,
      expensesAmount: raw.expensesRaw || null,
      expensesCurrency: raw.expensesCurrencyRaw || (raw.expensesRaw ? 'UYU' : null),
      taxesAmount: raw.taxesRaw || null,
      totalAreaM2: surfaces.totalAreaM2,
      builtAreaM2: surfaces.builtAreaM2,
      landAreaM2: surfaces.landAreaM2,
      internalAreaM2: surfaces.internalAreaM2,
      coveredAreaM2: surfaces.coveredAreaM2,
      semiCoveredAreaM2: surfaces.semiCoveredAreaM2,
      uncoveredAreaM2: surfaces.uncoveredAreaM2,
      terraceAreaM2: surfaces.terraceAreaM2,
      balconyAreaM2: surfaces.balconyAreaM2,
      gardenAreaM2: surfaces.gardenAreaM2,
      garageAreaM2: surfaces.garageAreaM2,
      bedrooms,
      bathrooms,
      toilets,
      garages,
      parkingSpaces,
      propertyFloor: floor ? parseInt(floor, 10) || null : null,
      totalFloors: null,
      constructionYear,
      approximateAge,
      condition: raw.conditionRaw || null,
      orientation: raw.orientationRaw || null,
      disposition: null,
      occupancyStatus: null,
      agencyName: raw.agencyNameRaw || null,
      agentName: raw.agentNameRaw || null,
      agentId: raw.agentIdRaw || null,
      agentPhone: raw.agentPhoneRaw || null,
      amenities,
      media: raw.mediaRaw || [],
      fieldEvidence: evidence,
      sourcePublishedAt: raw.sourcePublishedAt || null,
      sourceUpdatedAt: raw.sourceUpdatedAt || null,
      rawPayload: raw,
    };
  }
}
