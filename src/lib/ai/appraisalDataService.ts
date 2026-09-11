// ==============================================================================
// HIPOTECALY AI: Servicio de Datos del Tasador IA - Fase0
// Arquitectura Inmobiliaria Global, Deduplicación, Historial y Settings Versionados
// ==============================================================================

import {
  PropertySource,
  PropertyMaster,
  PropertyListing,
  PropertyPriceHistory,
  PropertyPhoto,
  AppraisalSettings,
  DeduplicationCriteria,
  DeduplicationMatchResult,
} from '../../types/aiAppraisalFase0';
import { TOP_20_PORTALS_CONFIG } from '../../config/top20PortalsConfig';

/**
 * Almacenamiento en memoria para entorno sin conexión directa a DB remota o en tests unitarios.
 */
class InMemoryAppraisalStore {
  public sources: Map<string, PropertySource> = new Map();
  public masterProperties: Map<string, PropertyMaster> = new Map();
  public listings: Map<string, PropertyListing> = new Map();
  public priceHistory: PropertyPriceHistory[] = [];
  public photos: Map<string, PropertyPhoto> = new Map();
  public settings: Map<number, AppraisalSettings> = new Map();

  constructor() {
    this.seedDefaultSources();
    this.seedDefaultSettings();
  }

  private seedDefaultSources() {
    const now = new Date().toISOString();
    TOP_20_PORTALS_CONFIG.forEach((portal) => {
      const sourceId = `src_${portal.code}`;
      this.sources.set(sourceId, {
        id: sourceId,
        code: portal.code,
        name: portal.name,
        domain: portal.domain,
        countryCode: portal.countryCode,
        isActive: portal.isActive,
        crawlerConfig: portal.crawlerConfig,
        rateLimitPerMinute: portal.rateLimitPerMinute,
        createdAt: now,
        updatedAt: now,
      });
    });
  }

  private seedDefaultSettings() {
    const now = new Date().toISOString();
    this.settings.set(1, {
      id: 'set_v1',
      version: 1,
      isActive: true,
      safetyMarginPercentage: 12.00, // Parámetro del 12% preservado como especifica el usuario
      maxDedupDistanceMeters: 100,
      similarityThreshold: 85.0,
      minComparablesCount: 3,
      maxComparablesAgeDays: 180,
      outlierStdDevThreshold: 2.0,
      weights: {
        surface: 0.40,
        location: 0.30,
        rooms: 0.15,
        age: 0.15,
      },
      notes: 'Configuración Inicial Versión 1 - Parámetro del 12% configurado sin ejecución prematura.',
      createdAt: now,
    });
  }
}

export class AppraisalDataService {
  private store = new InMemoryAppraisalStore();

  /**
   * Genera el hash canónico de deduplicación a partir de dirección, departamento y padrón.
   */
  public calculateDedupHash(address: string, department: string, cadastralNumber?: string | null): string {
    const cleanAddress = (address || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanDept = (department || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanPadron = (cadastralNumber || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const rawKey = `${cleanAddress}|${cleanDept}|${cleanPadron}`;
    
    // Algoritmo de hashing djb2 determinista para entorno TS
    let hash = 5381;
    for (let i = 0; i < rawKey.length; i++) {
      hash = (hash * 33) ^ rawKey.charCodeAt(i);
    }
    return `hash_v1_${(hash >>> 0).toString(16).padStart(8, '0')}`;
  }

  /**
   * Obtiene los Top 20 portales configurados en el sistema.
   */
  public async getPortalSources(): Promise<PropertySource[]> {
    return Array.from(this.store.sources.values());
  }

  /**
   * Obtiene un portal por su código único.
   */
  public async getPortalSourceByCode(code: string): Promise<PropertySource | null> {
    for (const source of this.store.sources.values()) {
      if (source.code === code) return source;
    }
    return null;
  }

  /**
   * Evalúa y resuelve deduplicación de propiedad maestra (Global Master Property).
   */
  public evaluateDeduplication(criteria: DeduplicationCriteria): DeduplicationMatchResult {
    const dedupHash = this.calculateDedupHash(criteria.address, criteria.department, criteria.cadastralNumber);

    for (const master of this.store.masterProperties.values()) {
      if (master.dedupHash === dedupHash) {
        return {
          isMatch: true,
          matchConfidence: 100,
          matchedMasterId: master.id,
          dedupHash,
          reason: 'Coincidencia exacta por Hash Deduplicador de Dirección y Padrón',
        };
      }
      
      // Deduplicación heurística por Padrón registrado
      if (criteria.cadastralNumber && master.cadastralNumber && criteria.cadastralNumber === master.cadastralNumber) {
        return {
          isMatch: true,
          matchConfidence: 95,
          matchedMasterId: master.id,
          dedupHash,
          reason: 'Coincidencia por Padrón Catastral registral',
        };
      }
    }

    return {
      isMatch: false,
      matchConfidence: 0,
      matchedMasterId: null,
      dedupHash,
      reason: 'No se encontraron registros previos coincidentes',
    };
  }

  /**
   * Crea o resuelve la propiedad maestra canónica en la base global.
   */
  public async createOrResolveMasterProperty(data: {
    canonicalAddress: string;
    department: string;
    city?: string;
    neighborhood?: string;
    propertyType: PropertyMaster['propertyType'];
    coveredSurfaceM2?: number;
    uncoveredSurfaceM2?: number;
    rooms?: number;
    bathrooms?: number;
    garages?: number;
    yearBuilt?: number;
    cadastralNumber?: string;
  }): Promise<PropertyMaster> {
    const evalResult = this.evaluateDeduplication({
      address: data.canonicalAddress,
      department: data.department,
      cadastralNumber: data.cadastralNumber,
    });

    if (evalResult.isMatch && evalResult.matchedMasterId) {
      const existing = this.store.masterProperties.get(evalResult.matchedMasterId);
      if (existing) return existing;
    }

    const now = new Date().toISOString();
    const id = `master_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const master: PropertyMaster = {
      id,
      canonicalAddress: data.canonicalAddress,
      normalizedAddress: data.canonicalAddress.trim().toLowerCase(),
      department: data.department,
      city: data.city || data.department,
      neighborhood: data.neighborhood || null,
      propertyType: data.propertyType,
      coveredSurfaceM2: data.coveredSurfaceM2 || null,
      uncoveredSurfaceM2: data.uncoveredSurfaceM2 || 0,
      totalSurfaceM2: (data.coveredSurfaceM2 || 0) + (data.uncoveredSurfaceM2 || 0) || null,
      rooms: data.rooms || null,
      bathrooms: data.bathrooms || null,
      garages: data.garages || 0,
      yearBuilt: data.yearBuilt || null,
      cadastralNumber: data.cadastralNumber || null,
      dedupHash: evalResult.dedupHash,
      dedupConfidence: 100,
      createdAt: now,
      updatedAt: now,
    };

    this.store.masterProperties.set(id, master);
    return master;
  }

  /**
   * Registra un anuncio / listing importado de un portal y lo vincula al registro maestro.
   */
  public async registerListing(data: {
    sourceCode: string;
    externalId: string;
    url: string;
    title: string;
    description?: string;
    priceAmount: number;
    currency?: 'USD' | 'UYU';
    coveredSurfaceM2?: number;
    masterId?: string;
  }): Promise<{ listing: PropertyListing; priceHistoryEntry: PropertyPriceHistory }> {
    const source = await this.getPortalSourceByCode(data.sourceCode);
    if (!source) {
      throw new Error(`Fuente no encontrada para código: ${data.sourceCode}`);
    }

    const now = new Date().toISOString();
    const currency = data.currency || 'USD';
    const priceUsdNormalized = currency === 'USD' ? data.priceAmount : Math.round(data.priceAmount / 40); // 40 UYU/USD referencial
    const pricePerM2Usd = data.coveredSurfaceM2 && data.coveredSurfaceM2 > 0 ? Math.round(priceUsdNormalized / data.coveredSurfaceM2) : null;

    const listingId = `list_${data.sourceCode}_${data.externalId}`;
    const existingListing = this.store.listings.get(listingId);

    let listing: PropertyListing;
    let historyEntry: PropertyPriceHistory;

    if (existingListing) {
      const prevPriceUsd = existingListing.priceUsdNormalized;
      const changePct = prevPriceUsd > 0 ? Math.round(((priceUsdNormalized - prevPriceUsd) / prevPriceUsd) * 10000) / 100 : 0;

      listing = {
        ...existingListing,
        priceAmount: data.priceAmount,
        currency,
        priceUsdNormalized,
        pricePerM2Usd,
        lastSeenAt: now,
        updatedAt: now,
      };

      historyEntry = {
        id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        listingId: listing.id,
        masterId: listing.masterId,
        priceAmount: data.priceAmount,
        currency,
        priceUsdNormalized,
        pricePerM2Usd,
        previousPriceUsd: prevPriceUsd,
        priceChangePercentage: changePct,
        detectedAt: now,
        createdAt: now,
      };
    } else {
      listing = {
        id: listingId,
        masterId: data.masterId || null,
        sourceId: source.id,
        externalId: data.externalId,
        url: data.url,
        title: data.title,
        description: data.description || null,
        priceAmount: data.priceAmount,
        currency,
        priceUsdNormalized,
        pricePerM2Usd,
        status: 'active',
        firstSeenAt: now,
        lastSeenAt: now,
        createdAt: now,
        updatedAt: now,
      };

      historyEntry = {
        id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        listingId: listing.id,
        masterId: listing.masterId,
        priceAmount: data.priceAmount,
        currency,
        priceUsdNormalized,
        pricePerM2Usd,
        previousPriceUsd: null,
        priceChangePercentage: 0,
        detectedAt: now,
        createdAt: now,
      };
    }

    this.store.listings.set(listing.id, listing);
    this.store.priceHistory.push(historyEntry);

    return { listing, priceHistoryEntry: historyEntry };
  }

  /**
   * Registra una fotografía asociada a un listing/maestro con su hash visual.
   */
  public async registerPhoto(data: {
    listingId?: string;
    masterId?: string;
    url: string;
    phash?: string;
    imageHash?: string;
    isPrimary?: boolean;
  }): Promise<PropertyPhoto> {
    const now = new Date().toISOString();
    const id = `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const photo: PropertyPhoto = {
      id,
      listingId: data.listingId || null,
      masterId: data.masterId || null,
      url: data.url,
      phash: data.phash || null,
      imageHash: data.imageHash || null,
      isPrimary: data.isPrimary || false,
      displayOrder: 0,
      createdAt: now,
    };

    this.store.photos.set(id, photo);
    return photo;
  }

  /**
   * Obtiene la historia completa de cambios de precio para un listing o propiedad maestra.
   */
  public async getPriceHistory(filter: { listingId?: string; masterId?: string }): Promise<PropertyPriceHistory[]> {
    return this.store.priceHistory.filter((h) => {
      if (filter.listingId && h.listingId === filter.listingId) return true;
      if (filter.masterId && h.masterId === filter.masterId) return true;
      return false;
    });
  }

  /**
   * Obtiene la lista de fotos con hashes registradas para una propiedad maestra.
   */
  public async getPhotosForMaster(masterId: string): Promise<PropertyPhoto[]> {
    const result: PropertyPhoto[] = [];
    for (const photo of this.store.photos.values()) {
      if (photo.masterId === masterId) {
        result.push(photo);
      }
    }
    return result;
  }

  /**
   * Obtiene los parámetros activos vigentes del Tasador IA (respetando el parámetro del 12%).
   */
  public async getActiveSettings(): Promise<AppraisalSettings> {
    const activeVersion = Array.from(this.store.settings.values())
      .filter((s) => s.isActive)
      .sort((a, b) => b.version - a.version)[0];

    if (!activeVersion) {
      throw new Error('No hay configuración de tasación activa registrada.');
    }
    return activeVersion;
  }

  /**
   * Registra una nueva versión de parámetros del Tasador IA manteniendo auditoría.
   */
  public async createSettingsVersion(newSettings: Omit<AppraisalSettings, 'id' | 'createdAt'>): Promise<AppraisalSettings> {
    const now = new Date().toISOString();
    const id = `set_v${newSettings.version}`;
    const settings: AppraisalSettings = {
      ...newSettings,
      id,
      createdAt: now,
    };

    if (newSettings.isActive) {
      for (const s of this.store.settings.values()) {
        s.isActive = false;
      }
    }

    this.store.settings.set(settings.version, settings);
    return settings;
  }
}

export const appraisalDataService = new AppraisalDataService();
