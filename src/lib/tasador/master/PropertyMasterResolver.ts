// ==============================================================================
// HIPOTECALY TASADOR IA - RESOLUTOR DE PROPERTY MASTER
// 1 Inmueble Real Físico (Property Master) <-> N Publicaciones (Listings)
// ==============================================================================

import {
  NormalizedListing,
  LocationPrecision,
  PropertyTypeNormalized,
} from '../types/tasadorPipelineTypes';
import { cleanText } from '../normalization/UruguayLocationDictionary';
import { DedupScoringEngine } from '../deduplication/DedupScoringEngine';

export interface PropertyMasterEntity {
  id: string;
  canonicalAddress: string;
  normalizedAddress: string;
  department: string;
  city: string;
  neighborhood?: string | null;
  subNeighborhood?: string | null;
  streetName?: string | null;
  streetNumber?: string | null;
  unit?: string | null;
  floor?: string | null;
  postalCode?: string | null;
  countryCode: string;
  locationPrecision: LocationPrecision;
  cadastralNumber?: string | null;
  horizontalPropertyUnit?: string | null;
  propertyType: PropertyTypeNormalized;
  totalAreaM2?: number | null;
  builtAreaM2?: number | null;
  landAreaM2?: number | null;
  internalAreaM2?: number | null;
  coveredSurfaceM2?: number | null;
  semiCoveredAreaM2?: number | null;
  uncoveredSurfaceM2?: number | null;
  terraceAreaM2?: number | null;
  balconyAreaM2?: number | null;
  gardenAreaM2?: number | null;
  garageAreaM2?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  toilets?: number | null;
  garages?: number | null;
  parkingSpaces?: number | null;
  propertyFloor?: number | null;
  constructionYear?: number | null;
  approximateAge?: number | null;
  condition?: string | null;
  orientation?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  amenities: Record<string, boolean | null>;
  dedupHash: string;
  dedupConfidence: number;
  canonicalStatus: string;
  dataQualityScore?: number | null;
  listingIds: string[];
  createdAt: string;
  updatedAt: string;
}

export class PropertyMasterResolver {
  private static instance: PropertyMasterResolver;
  public masterStore: Map<string, PropertyMasterEntity> = new Map();

  public static getInstance(): PropertyMasterResolver {
    if (!PropertyMasterResolver.instance) {
      PropertyMasterResolver.instance = new PropertyMasterResolver();
    }
    return PropertyMasterResolver.instance;
  }

  public get masters(): Map<string, PropertyMasterEntity> {
    return this.masterStore;
  }

  public calculateDedupHash(
    normalizedAddress: string,
    department: string,
    cadastralNumber?: string | null,
    options?: {
      streetName?: string | null;
      streetNumber?: string | null;
      unit?: string | null;
      propertyType?: string | null;
      uniqueKey?: string | null;
    }
  ): string {
    const cleanAddr = cleanText(normalizedAddress);
    const cleanDept = cleanText(department);
    const cleanPadron = cleanText(cadastralNumber);

    // Determinar si la dirección tiene especificidad suficiente para deducir identidad física:
    // 1. Padrón catastral no vacío
    const hasPadron = cleanPadron.length >= 3;
    // 2. Calle + número de puerta
    const hasStreetNumber = Boolean(
      options?.streetName &&
      options?.streetNumber &&
      cleanText(options.streetName).length >= 3 &&
      cleanText(options.streetNumber).length >= 1
    );
    // 3. Si es apartamento, requiere además número de unidad (a menos que tenga padrón específico)
    const isApartment = options?.propertyType === 'APARTMENT' || options?.propertyType === 'apartamento';
    const isSpecificUnit = !isApartment || Boolean(options?.unit && cleanText(options.unit).length >= 1);

    const isSpecific = hasPadron || (hasStreetNumber && isSpecificUnit);

    // Si la dirección es genérica (ej. sólo 'Montevideo', o calle sin número, o edificio sin apto),
    // NUNCA debe compartir hash con otras publicaciones.
    const rawKey = isSpecific
      ? `${cleanAddr}|${cleanDept}|${cleanPadron}|${options?.unit ? cleanText(options.unit) : ''}`
      : `unique_${cleanDept}_${cleanText(options?.uniqueKey || Math.random().toString(36).substring(2, 10))}`;

    let hash = 5381;
    for (let i = 0; i < rawKey.length; i++) {
      hash = (hash * 33) ^ rawKey.charCodeAt(i);
    }
    return `hash_m_${(hash >>> 0).toString(16).padStart(8, '0')}`;
  }

  public resolveMaster(listing: NormalizedListing): {
    master: PropertyMasterEntity;
    isNew: boolean;
    confidence: number;
  } {
    const uniqueKey = listing.sourceListingKey || listing.sourceListingId;
    const dedupHash = this.calculateDedupHash(
      listing.normalizedAddress,
      listing.department,
      listing.cadastralNumber,
      {
        streetName: listing.streetName,
        streetNumber: listing.streetNumber,
        unit: listing.unit,
        propertyType: listing.propertyType,
        uniqueKey,
      }
    );

    // 1. Buscar coincidencia exacta por hash deduplicador (solo para direcciones específicas)
    for (const master of this.masterStore.values()) {
      if (master.dedupHash === dedupHash && master.propertyType === listing.propertyType) {
        if (!master.listingIds.includes(uniqueKey)) {
          master.listingIds.push(uniqueKey);
          master.updatedAt = new Date().toISOString();
        }
        return { master, isNew: false, confidence: 98 };
      }
    }

    // 2. Buscar si hay coincidencia de muy alta confianza (>= 95) con un master existente
    // NOTA: mockListingFromMaster contiene EXCLUSIVAMENTE datos propios del master, sin heredar fotos ni textos del listing candidato.
    for (const master of this.masterStore.values()) {
      const mockListingFromMaster: NormalizedListing = {
        sourceCode: 'master',
        sourceListingId: master.id,
        sourceListingKey: `master_${master.id}`,
        canonicalUrl: '',
        originalUrl: '',
        title: '',
        titleNormalized: '',
        descriptionNormalized: '',
        operationType: 'SALE',
        propertyType: master.propertyType,
        country: 'Uruguay',
        countryCode: 'UY',
        department: master.department,
        city: master.city,
        neighborhood: master.neighborhood,
        subNeighborhood: master.subNeighborhood,
        normalizedAddress: master.normalizedAddress,
        streetName: master.streetName,
        streetNumber: master.streetNumber,
        unit: master.unit,
        floor: master.floor,
        postalCode: master.postalCode,
        latitude: master.latitude,
        longitude: master.longitude,
        locationPrecision: master.locationPrecision,
        cadastralNumber: master.cadastralNumber,
        horizontalPropertyUnit: master.horizontalPropertyUnit,
        totalAreaM2: master.totalAreaM2,
        builtAreaM2: master.builtAreaM2,
        currentPrice: 0,
        currentCurrency: 'USD',
        priceUsd: 0,
        priceUyu: 0,
        pricePerM2Usd: 0,
        bedrooms: master.bedrooms,
        bathrooms: master.bathrooms,
        toilets: master.toilets,
        garages: master.garages,
        parkingSpaces: master.parkingSpaces,
        propertyFloor: master.propertyFloor,
        constructionYear: master.constructionYear,
        approximateAge: master.approximateAge,
        condition: master.condition,
        orientation: master.orientation,
        media: [], // No heredar fotos del candidato para evitar 100% photo match artificial
        amenities: master.amenities || {},
        fieldEvidence: {},
        rawPayload: {} as any,
      };

      const breakdown = DedupScoringEngine.compareListings(listing, mockListingFromMaster);
      if (breakdown.totalScore >= 95.0) {
        if (!master.listingIds.includes(uniqueKey)) {
          master.listingIds.push(uniqueKey);
          master.updatedAt = new Date().toISOString();
        }
        return { master, isNew: false, confidence: breakdown.totalScore };
      }
    }

    // 3. Crear nuevo Property Master canónico
    const now = new Date().toISOString();
    const masterId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `00000000-0000-4000-8000-${Math.random().toString(16).substring(2, 14).padEnd(12, '0')}`;

    const newMaster: PropertyMasterEntity = {
      id: masterId,
      canonicalAddress: listing.normalizedAddress,
      normalizedAddress: listing.normalizedAddress,
      department: listing.department,
      city: listing.city || listing.department,
      neighborhood: listing.neighborhood,
      subNeighborhood: listing.subNeighborhood,
      streetName: listing.streetName,
      streetNumber: listing.streetNumber,
      unit: listing.unit,
      floor: listing.floor,
      postalCode: listing.postalCode,
      countryCode: 'UY',
      locationPrecision: listing.locationPrecision,
      cadastralNumber: listing.cadastralNumber,
      horizontalPropertyUnit: listing.horizontalPropertyUnit,
      propertyType: listing.propertyType,
      totalAreaM2: listing.totalAreaM2,
      builtAreaM2: listing.builtAreaM2,
      landAreaM2: listing.landAreaM2,
      internalAreaM2: listing.internalAreaM2,
      coveredSurfaceM2: listing.coveredAreaM2,
      semiCoveredAreaM2: listing.semiCoveredAreaM2,
      uncoveredSurfaceM2: listing.uncoveredAreaM2,
      terraceAreaM2: listing.terraceAreaM2,
      balconyAreaM2: listing.balconyAreaM2,
      gardenAreaM2: listing.gardenAreaM2,
      garageAreaM2: listing.garageAreaM2,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      toilets: listing.toilets,
      garages: listing.garages,
      parkingSpaces: listing.parkingSpaces,
      propertyFloor: listing.propertyFloor,
      constructionYear: listing.constructionYear,
      approximateAge: listing.approximateAge,
      condition: listing.condition,
      orientation: listing.orientation,
      latitude: listing.latitude,
      longitude: listing.longitude,
      amenities: listing.amenities,
      dedupHash,
      dedupConfidence: 100,
      canonicalStatus: 'ACTIVE',
      listingIds: [listing.sourceListingKey || listing.sourceListingId],
      createdAt: now,
      updatedAt: now,
    };

    this.masterStore.set(masterId, newMaster);
    return { master: newMaster, isNew: true, confidence: 100 };
  }

  public getMaster(id: string): PropertyMasterEntity | undefined {
    return this.masterStore.get(id);
  }

  public getAllMasters(): PropertyMasterEntity[] {
    return Array.from(this.masterStore.values());
  }
}

export { PropertyMasterResolver as MasterPropertyResolver };
