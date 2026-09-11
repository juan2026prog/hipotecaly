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
    cadastralNumber?: string | null
  ): string {
    const cleanAddr = cleanText(normalizedAddress);
    const cleanDept = cleanText(department);
    const cleanPadron = cleanText(cadastralNumber);
    const rawKey = `${cleanAddr}|${cleanDept}|${cleanPadron}`;

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
    const dedupHash = this.calculateDedupHash(
      listing.normalizedAddress,
      listing.department,
      listing.cadastralNumber
    );

    // 1. Buscar coincidencia exacta por hash deduplicador
    for (const master of this.masterStore.values()) {
      if (master.dedupHash === dedupHash && master.propertyType === listing.propertyType) {
        if (!master.listingIds.includes(listing.sourceListingKey || listing.sourceListingId)) {
          master.listingIds.push(listing.sourceListingKey || listing.sourceListingId);
          master.updatedAt = new Date().toISOString();
        }
        return { master, isNew: false, confidence: 98 };
      }
    }

    // 2. Buscar si hay coincidencia de muy alta confianza (>= 95) con un master existente
    for (const master of this.masterStore.values()) {
      // Comparar listing con atributos del master
      const mockListingFromMaster: NormalizedListing = {
        ...listing,
        normalizedAddress: master.normalizedAddress,
        department: master.department,
        neighborhood: master.neighborhood,
        streetName: master.streetName,
        streetNumber: master.streetNumber,
        unit: master.unit,
        latitude: master.latitude,
        longitude: master.longitude,
        builtAreaM2: master.builtAreaM2,
        totalAreaM2: master.totalAreaM2,
        bedrooms: master.bedrooms,
        cadastralNumber: master.cadastralNumber,
      };

      const breakdown = DedupScoringEngine.compareListings(listing, mockListingFromMaster);
      if (breakdown.totalScore >= 95.0) {
        if (!master.listingIds.includes(listing.sourceListingKey || listing.sourceListingId)) {
          master.listingIds.push(listing.sourceListingKey || listing.sourceListingId);
          master.updatedAt = new Date().toISOString();
        }
        return { master, isNew: false, confidence: breakdown.totalScore };
      }
    }

    // 3. Crear nuevo Property Master canónico
    const now = new Date().toISOString();
    const masterId = `pm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

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
