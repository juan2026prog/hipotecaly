// ==============================================================================
// HIPOTECALY AI: Servicio Ampliado de Datos del Tasador IA - Fase0
// Arquitectura Inmobiliaria Global, Candidatos de Deduplicación, Evidencia por Campo,
// Snapshots, Medios con Hashes, Valuaciones/Comparables Preparadas y Ajuste Asking Price (12%)
// ==============================================================================

import {
  PropertySource,
  PropertyMaster,
  PropertyListing,
  PropertyPriceHistory,
  PropertyDuplicateCandidate,
  PropertyMedia,
  PropertyListingAttribute,
  PropertyFieldEvidence,
  PropertyListingSnapshot,
  PropertyCadastralData,
  PropertyValuation,
  PropertyValuationVersion,
  PropertyValuationComparable,
  PropertyAIFeature,
  PropertyTransaction,
  AppraisalSettings,
  DeduplicationCriteria,
  DeduplicationMatchResult,
} from '../../types/aiAppraisalFase0';
import { TOP_20_PORTALS_CONFIG } from '../../config/top20PortalsConfig';

class ExpandedInMemoryAppraisalStore {
  public sources: Map<string, PropertySource> = new Map();
  public masterProperties: Map<string, PropertyMaster> = new Map();
  public listings: Map<string, PropertyListing> = new Map();
  public priceHistory: PropertyPriceHistory[] = [];
  public duplicateCandidates: PropertyDuplicateCandidate[] = [];
  public media: Map<string, PropertyMedia> = new Map();
  public attributes: PropertyListingAttribute[] = [];
  public fieldEvidences: PropertyFieldEvidence[] = [];
  public snapshots: PropertyListingSnapshot[] = [];
  public cadastralData: Map<string, PropertyCadastralData> = new Map();
  public valuations: Map<string, PropertyValuation> = new Map();
  public valuationVersions: PropertyValuationVersion[] = [];
  public valuationComparables: PropertyValuationComparable[] = [];
  public aiFeatures: PropertyAIFeature[] = [];
  public transactions: PropertyTransaction[] = [];
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
        sourceType: portal.sourceType,
        baseUrl: portal.baseUrl,
        isActive: portal.isActive,
        enabled: portal.enabled,
        ingestionEnabled: false, // Ingesta desactivada en Fase 0
        priority: portal.priority,
        trustLevel: portal.trustLevel,
        rateLimitPerMinute: portal.rateLimitPerMinute,
        notes: portal.notes,
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
      askingPriceAdjustment: 0.1200, // Factor 12.00% entre asking price y precio real de mercado
      safetyMarginPercentage: 12.00,
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
      status: 'ACTIVE',
      effectiveFrom: now,
      notes: 'V1 - asking_price_adjustment = 12.00% (Factor inicial configurable de diferencia entre asking price y precio real de venta/mercado, sujeto a calibración futura).',
      createdAt: now,
    });
  }
}

export class AppraisalDataService {
  private store = new ExpandedInMemoryAppraisalStore();

  /**
   * Genera el hash de deduplicación determinista (hash auxiliar, NO verdad absoluta).
   */
  public calculateDedupHash(address: string, department: string, cadastralNumber?: string | null): string {
    const cleanAddress = (address || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanDept = (department || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanPadron = (cadastralNumber || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const rawKey = `${cleanAddress}|${cleanDept}|${cleanPadron}`;

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

  public async getPortalSourceByCode(code: string): Promise<PropertySource | null> {
    for (const source of this.store.sources.values()) {
      if (source.code === code) return source;
    }
    return null;
  }

  /**
   * Evalúa y busca candidatos de deduplicación sin fusiones destructivas automáticas.
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
   * Registra un candidato de duplicación para inspección posterior.
   */
  public async registerDuplicateCandidate(data: {
    propertyAId?: string;
    propertyBId?: string;
    listingAId?: string;
    listingBId?: string;
    matchScore: number;
  }): Promise<PropertyDuplicateCandidate> {
    const now = new Date().toISOString();
    const candidate: PropertyDuplicateCandidate = {
      id: `cand_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      propertyAId: data.propertyAId || null,
      propertyBId: data.propertyBId || null,
      listingAId: data.listingAId || null,
      listingBId: data.listingBId || null,
      matchScore: data.matchScore,
      decision: 'PENDING',
      decisionSource: 'AUTOMATED_DEDUP_SCORER',
      createdAt: now,
      updatedAt: now,
    };

    this.store.duplicateCandidates.push(candidate);
    return candidate;
  }

  /**
   * Crea o resuelve la propiedad maestra canónica en la base global.
   */
  public async createOrResolveMasterProperty(data: {
    canonicalAddress: string;
    department: string;
    city?: string;
    neighborhood?: string;
    subNeighborhood?: string;
    propertyType: PropertyMaster['propertyType'];
    coveredSurfaceM2?: number;
    uncoveredSurfaceM2?: number;
    bedrooms?: number;
    bathrooms?: number;
    garages?: number;
    constructionYear?: number;
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
      countryCode: 'UY',
      department: data.department,
      city: data.city || data.department,
      neighborhood: data.neighborhood || null,
      subNeighborhood: data.subNeighborhood || null,
      locationPrecision: 'EXACT_ADDRESS',
      propertyType: data.propertyType,
      coveredSurfaceM2: data.coveredSurfaceM2 || null,
      uncoveredSurfaceM2: data.uncoveredSurfaceM2 || null,
      totalAreaM2: (data.coveredSurfaceM2 || 0) + (data.uncoveredSurfaceM2 || 0) || null,
      builtAreaM2: data.coveredSurfaceM2 || null,
      rooms: data.bedrooms || null,
      bedrooms: data.bedrooms || null,
      bathrooms: data.bathrooms || null,
      garages: data.garages || null,
      constructionYear: data.constructionYear || null,
      cadastralNumber: data.cadastralNumber || null,
      dedupHash: evalResult.dedupHash,
      dedupConfidence: 100,
      canonicalStatus: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    this.store.masterProperties.set(id, master);
    return master;
  }

  /**
   * Registra un listing y audita el historial inmutable de precios.
   */
  public async registerListing(data: {
    sourceCode: string;
    externalId: string;
    url: string;
    title: string;
    description?: string;
    priceAmount: number;
    currency?: string;
    coveredSurfaceM2?: number;
    masterId?: string;
  }): Promise<{ listing: PropertyListing; priceHistoryEntry: PropertyPriceHistory }> {
    const source = await this.getPortalSourceByCode(data.sourceCode);
    if (!source) {
      throw new Error(`Fuente no encontrada para código: ${data.sourceCode}`);
    }

    const now = new Date().toISOString();
    const currency = data.currency || 'USD';
    const priceUsdNormalized = currency === 'USD' ? data.priceAmount : Math.round(data.priceAmount / 40);
    const pricePerM2Usd = data.coveredSurfaceM2 && data.coveredSurfaceM2 > 0 ? Math.round(priceUsdNormalized / data.coveredSurfaceM2) : null;

    const listingId = `list_${data.sourceCode}_${data.externalId}`;
    const existingListing = this.store.listings.get(listingId);

    let listing: PropertyListing;
    let historyEntry: PropertyPriceHistory;

    if (existingListing) {
      const prevPriceUsd = existingListing.priceUsd;
      const changePct = prevPriceUsd && prevPriceUsd > 0 ? Math.round(((priceUsdNormalized - prevPriceUsd) / prevPriceUsd) * 10000) / 100 : 0;

      listing = {
        ...existingListing,
        currentPrice: data.priceAmount,
        currentCurrency: currency,
        priceUsd: priceUsdNormalized,
        pricePerM2: pricePerM2Usd,
        lastSeenAt: now,
        updatedAt: now,
      };

      historyEntry = {
        id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        listingId: listing.id,
        masterId: listing.masterId,
        observedAt: now,
        price: data.priceAmount,
        currency,
        priceUsd: priceUsdNormalized,
        pricePerM2: pricePerM2Usd,
        previousPriceUsd: prevPriceUsd,
        priceChangePercentage: changePct,
        eventType: 'PRICE_CHANGED',
        createdAt: now,
      };
    } else {
      listing = {
        id: listingId,
        masterId: data.masterId || null,
        sourceId: source.id,
        sourceListingId: data.externalId,
        originalUrl: data.url,
        titleRaw: data.title,
        titleNormalized: data.title.trim().toLowerCase(),
        descriptionRaw: data.description || null,
        descriptionNormalized: data.description ? data.description.trim().toLowerCase() : null,
        operationType: 'SALE',
        locationPrecision: 'UNKNOWN',
        currentPrice: data.priceAmount,
        currentCurrency: currency,
        priceUsd: priceUsdNormalized,
        pricePerM2: pricePerM2Usd,
        status: 'ACTIVE',
        firstSeenAt: now,
        lastSeenAt: now,
        createdAt: now,
        updatedAt: now,
      };

      historyEntry = {
        id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        listingId: listing.id,
        masterId: listing.masterId,
        observedAt: now,
        price: data.priceAmount,
        currency,
        priceUsd: priceUsdNormalized,
        pricePerM2: pricePerM2Usd,
        previousPriceUsd: null,
        priceChangePercentage: 0,
        eventType: 'FIRST_SEEN',
        createdAt: now,
      };
    }

    this.store.listings.set(listing.id, listing);
    this.store.priceHistory.push(historyEntry);

    return { listing, priceHistoryEntry: historyEntry };
  }

  /**
   * Registra evidencia trazable para un campo específico.
   */
  public async registerFieldEvidence(data: {
    propertyMasterId?: string;
    listingId?: string;
    fieldName: string;
    rawValue: string;
    normalizedValue?: string;
    sourceCode?: string;
  }): Promise<PropertyFieldEvidence> {
    const now = new Date().toISOString();
    const source = data.sourceCode ? await this.getPortalSourceByCode(data.sourceCode) : null;
    const evidence: PropertyFieldEvidence = {
      id: `evid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      propertyMasterId: data.propertyMasterId || null,
      listingId: data.listingId || null,
      fieldName: data.fieldName,
      rawValue: data.rawValue,
      normalizedValue: data.normalizedValue || data.rawValue.trim().toLowerCase(),
      sourceId: source ? source.id : null,
      evidenceType: 'listing_field',
      confidence: 100,
      observedAt: now,
      createdAt: now,
    };

    this.store.fieldEvidences.push(evidence);
    return evidence;
  }

  /**
   * Registra un medio/fotografía con hashes.
   */
  public async registerMedia(data: {
    listingId?: string;
    masterId?: string;
    originalUrl: string;
    mediaType?: PropertyMedia['mediaType'];
    sha256Hash?: string;
    perceptualHash?: string;
  }): Promise<PropertyMedia> {
    const now = new Date().toISOString();
    const id = `med_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const mediaItem: PropertyMedia = {
      id,
      listingId: data.listingId || null,
      masterId: data.masterId || null,
      mediaType: data.mediaType || 'IMAGE',
      originalUrl: data.originalUrl,
      position: 0,
      sha256Hash: data.sha256Hash || null,
      perceptualHash: data.perceptualHash || null,
      firstSeenAt: now,
      lastSeenAt: now,
      createdAt: now,
    };

    this.store.media.set(id, mediaItem);
    return mediaItem;
  }

  /**
   * Obtiene la historia de precios para un listing o propiedad maestra.
   */
  public async getPriceHistory(filter: { listingId?: string; masterId?: string }): Promise<PropertyPriceHistory[]> {
    return this.store.priceHistory.filter((h) => {
      if (filter.listingId && h.listingId === filter.listingId) return true;
      if (filter.masterId && h.masterId === filter.masterId) return true;
      return false;
    });
  }

  /**
   * Obtiene los parámetros activos vigentes del Tasador IA (`asking_price_adjustment = 0.1200`).
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
   * Registra una nueva versión de parámetros de tasación conservando historial.
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
