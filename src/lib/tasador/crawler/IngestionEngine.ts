// ==============================================================================
// HIPOTECALY TASADOR IA - MOTOR CENTRAL DE INGESTA Y CRAWLER RUNNER
// Orquestación E2E: Raw Snapshot -> Normalización -> Evidencia -> Medios ->
// Historial Precios -> Deduplicación -> Property Master -> Data Quality -> Lifecycle
// ==============================================================================

import {
  RawListingPayload,
  NormalizedListing,
  IngestionRunResult,
  CrawlerRunType,
  CrawlerRunStatus,
} from '../types/tasadorPipelineTypes';
import { AdapterRegistry } from '../adapters/AdapterRegistry';
import { DiscoverOptions } from '../adapters/SourceAdapter';
import { NormalizationEngine } from '../normalization/NormalizationEngine';
import { DeduplicationService } from '../deduplication/DeduplicationService';
import { PropertyMasterResolver } from '../master/PropertyMasterResolver';
import { PriceHistoryTracker } from '../price_history/PriceHistoryTracker';
import { FieldEvidenceTracker } from '../evidence/FieldEvidenceTracker';
import { ListingLifecycleManager } from '../lifecycle/ListingLifecycleManager';

export interface ListingSnapshotEntity {
  id: string;
  listingId: string;
  sourceCode: string;
  capturedAt: string;
  contentHash: string;
  structuredPayload: Record<string, unknown>;
  parserVersion: string;
}

export interface CanonicalMediaEntity {
  id: string;
  listingId: string;
  masterId?: string | null;
  mediaType: string;
  originalUrl: string;
  position: number;
  sha256Hash: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

export class IngestionEngine {
  private static instance: IngestionEngine;

  public adapterRegistry: AdapterRegistry;
  public dedupService: DeduplicationService;
  public masterResolver: PropertyMasterResolver;
  public priceTracker: PriceHistoryTracker;
  public evidenceTracker: FieldEvidenceTracker;
  public lifecycleManager: ListingLifecycleManager;

  // Repositorios de datos en memoria para el pipeline activo
  public snapshots: Map<string, ListingSnapshotEntity> = new Map();
  public canonicalMedia: Map<string, CanonicalMediaEntity> = new Map();
  public normalizedListings: Map<string, NormalizedListing> = new Map();
  public runHistory: IngestionRunResult[] = [];

  private constructor() {
    this.adapterRegistry = AdapterRegistry.getInstance();
    this.dedupService = new DeduplicationService();
    this.masterResolver = PropertyMasterResolver.getInstance();
    this.priceTracker = new PriceHistoryTracker();
    this.evidenceTracker = new FieldEvidenceTracker();
    this.lifecycleManager = new ListingLifecycleManager();
    this.seedDefaultListings();
  }

  public static getInstance(): IngestionEngine {
    if (!IngestionEngine.instance) {
      IngestionEngine.instance = new IngestionEngine();
    }
    return IngestionEngine.instance;
  }

  /**
   * Carga publicaciones normalizadas iniciales representativas del mercado uruguayo
   */
  public seedDefaultListings(): void {
    if (this.normalizedListings.size > 0) return;

    const seedItems = [
      {
        id: 'list-pocitos-01',
        masterId: 'seed-master-pocitos-01',
        title: 'Apartamento en Pocitos 2 Dormitorios Impecable',
        dept: 'Montevideo',
        neigh: 'Pocitos',
        type: 'apartamento',
        price: 220000,
        builtArea: 75,
        totalArea: 75,
        rooms: 3,
        bedrooms: 2,
        bathrooms: 2,
        garages: 1,
        source: 'infocasas',
        date: '2025-10-10',
      },
      {
        id: 'list-pocitos-02',
        masterId: 'seed-master-pocitos-02',
        title: 'Apto 3 Dormitorios con Garage en Pocitos',
        dept: 'Montevideo',
        neigh: 'Pocitos',
        type: 'apartamento',
        price: 270000,
        builtArea: 90,
        totalArea: 95,
        rooms: 4,
        bedrooms: 3,
        bathrooms: 2,
        garages: 1,
        source: 'mercadolibre_uy',
        date: '2025-11-20',
      },
      {
        id: 'list-pocitos-03',
        masterId: 'seed-master-pocitos-03',
        title: 'Gran Planta en Pocitos Próximo a la Rambla',
        dept: 'Montevideo',
        neigh: 'Pocitos',
        type: 'apartamento',
        price: 320000,
        builtArea: 105,
        totalArea: 110,
        rooms: 4,
        bedrooms: 3,
        bathrooms: 2,
        garages: 1,
        source: 'gallito_uy',
        date: '2025-12-05',
      },
      {
        id: 'list-punta-carretas-01',
        masterId: 'seed-master-punta-carretas-01',
        title: 'Penthouse en Punta Carretas con Terraza',
        dept: 'Montevideo',
        neigh: 'Punta Carretas',
        type: 'apartamento',
        price: 350000,
        builtArea: 115,
        totalArea: 130,
        rooms: 4,
        bedrooms: 3,
        bathrooms: 2,
        garages: 2,
        source: 'infocasas',
        date: '2025-11-01',
      },
      {
        id: 'list-cordon-01',
        masterId: 'seed-master-cordon-01',
        title: 'Apartamento a Estrenar en Cordón Sur',
        dept: 'Montevideo',
        neigh: 'Cordón',
        type: 'apartamento',
        price: 150000,
        builtArea: 55,
        totalArea: 58,
        rooms: 2,
        bedrooms: 1,
        bathrooms: 1,
        garages: 0,
        source: 'mercadolibre_uy',
        date: '2025-10-15',
      },
      {
        id: 'list-centro-01',
        masterId: 'seed-master-centro-01',
        title: 'Apartamento Céntrico sobre 18 de Julio',
        dept: 'Montevideo',
        neigh: 'Centro',
        type: 'apartamento',
        price: 135000,
        builtArea: 60,
        totalArea: 60,
        rooms: 3,
        bedrooms: 2,
        bathrooms: 1,
        garages: 0,
        source: 'gallito_uy',
        date: '2025-09-20',
      },
      {
        id: 'list-carrasco-01',
        masterId: 'seed-master-carrasco-01',
        title: 'Residencia en Carrasco Sur con Piscina y Parque',
        dept: 'Montevideo',
        neigh: 'Carrasco',
        type: 'casa',
        price: 780000,
        builtArea: 320,
        totalArea: 650,
        rooms: 6,
        bedrooms: 4,
        bathrooms: 4,
        garages: 2,
        source: 'remax_uy',
        date: '2025-11-10',
      },
      {
        id: 'list-buceo-01',
        masterId: 'seed-master-buceo-01',
        title: 'Apartamento Frente al Puerto del Buceo',
        dept: 'Montevideo',
        neigh: 'Buceo',
        type: 'apartamento',
        price: 198000,
        builtArea: 68,
        totalArea: 72,
        rooms: 3,
        bedrooms: 2,
        bathrooms: 1,
        garages: 1,
        source: 'infocasas',
        date: '2025-11-25',
      },
      {
        id: 'list-malvin-01',
        masterId: 'seed-master-malvin-01',
        title: 'Apartamento en Malvín Próximo Rambla',
        dept: 'Montevideo',
        neigh: 'Malvín',
        type: 'apartamento',
        price: 245000,
        builtArea: 82,
        totalArea: 86,
        rooms: 3,
        bedrooms: 2,
        bathrooms: 2,
        garages: 1,
        source: 'mercadolibre_uy',
        date: '2025-12-15',
      },
      {
        id: 'list-pde-01',
        masterId: 'seed-master-pde-01',
        title: 'Apartamento en Torre con Amenities Parada 4 Playa Mansa',
        dept: 'Maldonado',
        neigh: 'Punta del Este',
        type: 'apartamento',
        price: 480000,
        builtArea: 140,
        totalArea: 160,
        rooms: 4,
        bedrooms: 3,
        bathrooms: 3,
        garages: 2,
        source: 'sothebys_uy',
        date: '2025-11-05',
      },
    ];

    for (const item of seedItems) {
      const listing: NormalizedListing = {
        sourceListingId: item.id,
        sourceListingKey: `${item.source}_${item.id}`,
        sourceCode: item.source,
        propertyMasterId: item.masterId,
        originalUrl: `https://www.${item.source}.com.uy/inmuebles/${item.id}`,
        canonicalUrl: `https://www.${item.source}.com.uy/inmuebles/${item.id}`,
        title: item.title,
        titleNormalized: item.title.toLowerCase(),
        operationType: 'SALE',
        propertyType: (item.type === 'casa' ? 'HOUSE' : 'APARTMENT') as any,
        country: 'Uruguay',
        countryCode: 'UY',
        department: item.dept,
        neighborhood: item.neigh,
        city: item.dept,
        normalizedAddress: `${item.title}, ${item.neigh}, ${item.dept}`,
        locationPrecision: 'EXACT',
        currentPrice: item.price,
        currentCurrency: 'USD',
        priceUsd: item.price,
        priceUyu: item.price * 40.5,
        builtAreaM2: item.builtArea,
        totalAreaM2: item.totalArea,
        bedrooms: item.bedrooms,
        bathrooms: item.bathrooms,
        garages: item.garages,
        publicationDate: item.date,
        amenities: {},
        media: [],
        fieldEvidence: {},
        rawPayload: {
          sourceCode: item.source,
          sourceListingId: item.id,
          originalUrl: `https://www.${item.source}.com.uy/inmuebles/${item.id}`,
          titleRaw: item.title,
        },
      };

      this.normalizedListings.set(listing.sourceListingKey!, listing);

      // Registrar Master si no existe
      if (!this.masterResolver.getMaster(item.masterId)) {
        this.masterResolver.masterStore.set(item.masterId, {
          id: item.masterId,
          canonicalAddress: `${item.title}, ${item.neigh}, ${item.dept}`,
          normalizedAddress: `${item.title}, ${item.neigh}, ${item.dept}`,
          department: item.dept,
          city: item.dept,
          neighborhood: item.neigh,
          countryCode: 'UY',
          locationPrecision: 'EXACT',
          propertyType: (item.type === 'casa' ? 'HOUSE' : 'APARTMENT') as any,
          builtAreaM2: item.builtArea,
          totalAreaM2: item.totalArea,
          coveredSurfaceM2: item.builtArea,
          uncoveredSurfaceM2: 0,
          bedrooms: item.bedrooms,
          bathrooms: item.bathrooms,
          garages: item.garages,
          amenities: {},
          dedupHash: `dedup_${item.masterId}`,
          dedupConfidence: 100,
          canonicalStatus: 'ACTIVE',
          listingIds: [listing.sourceListingKey!],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Limpia el estado interno y repositorios en memoria (útil para pruebas y aislamiento)
   */
  public resetState(): void {
    this.snapshots.clear();
    this.canonicalMedia.clear();
    this.normalizedListings.clear();
    this.runHistory = [];
    this.dedupService = new DeduplicationService();
    this.masterResolver = new PropertyMasterResolver();
    this.priceTracker = new PriceHistoryTracker();
    this.evidenceTracker = new FieldEvidenceTracker();
    this.lifecycleManager = new ListingLifecycleManager();
  }

  /**
   * Ejecuta una sesión de ingesta completa para una fuente específica
   */
  public async executeRun(
    sourceCode: string,
    options?: DiscoverOptions & { runType?: CrawlerRunType; customPayloads?: RawListingPayload[] }
  ): Promise<IngestionRunResult> {
    const startTime = Date.now();
    const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const startedAt = new Date().toISOString();
    const runType = options?.runType || 'ON_DEMAND';

    const adapter = this.adapterRegistry.getAdapter(sourceCode);
    if (!adapter) {
      throw new Error(`Fuente no registrada en AdapterRegistry: ${sourceCode}`);
    }

    let status: CrawlerRunStatus = 'RUNNING';
    let listingsDiscovered = 0;
    let listingsNew = 0;
    let listingsUpdated = 0;
    let listingsUnchanged = 0;
    let mediaDiscovered = 0;
    let priceEventsCreated = 0;
    let duplicateCandidatesFound = 0;
    let propertyMastersResolved = 0;
    let errorsCount = 0;
    let errorSummary: string | null = null;
    const httpStatusSummary: Record<string, number> = { '200': 0 };

    try {
      // 1. Descubrimiento de publicaciones (o uso de payloads personalizados provistos)
      let rawListings: RawListingPayload[] = [];
      if (options?.customPayloads && options.customPayloads.length > 0) {
        rawListings = options.customPayloads;
      } else {
        rawListings = await adapter.discoverListings(options);
      }

      listingsDiscovered = rawListings.length;
      httpStatusSummary['200'] = rawListings.length > 0 ? 1 : 0;

      // 2. Procesamiento individual de cada publicación descubierta
      for (const raw of rawListings) {
        try {
          const listingKey = raw.sourceListingKey || `${raw.sourceCode}_${raw.sourceListingId}`;
          const contentHash = raw.contentHash || adapter.computeContentHash(raw);

          // Verificar si ya existía snapshot idéntico (Idempotencia)
          const existingSnapshot = this.snapshots.get(listingKey);
          const isUnchanged = existingSnapshot && existingSnapshot.contentHash === contentHash;

          if (isUnchanged) {
            listingsUnchanged++;
            this.lifecycleManager.markSeen(listingKey, raw.sourceCode);
            continue;
          }

          // A. Capturar Snapshot Inmutable
          const snapshotId = `snp_${listingKey}_${Date.now()}`;
          const snapshotRecord: ListingSnapshotEntity = {
            id: snapshotId,
            listingId: listingKey,
            sourceCode: raw.sourceCode,
            capturedAt: new Date().toISOString(),
            contentHash,
            structuredPayload: (raw as unknown as Record<string, unknown>),
            parserVersion: 'v2.0-deterministic',
          };
          this.snapshots.set(listingKey, snapshotRecord);

          if (existingSnapshot) {
            listingsUpdated++;
          } else {
            listingsNew++;
          }

          // B. Normalización Determinística Uruguay
          const normalized = NormalizationEngine.normalize(raw);
          this.normalizedListings.set(listingKey, normalized);

          // C. Resolución de Property Master Canónico (1 Master <-> N Listings)
          const masterResult = this.masterResolver.resolveMaster(normalized);
          const masterId = masterResult.master.id;
          propertyMastersResolved++;

          // D. Captura de Medios Canónicos (property_listing_media)
          for (const m of normalized.media) {
            const mediaKey = `${listingKey}_${m.position}_${m.sha256Hash || 'img'}`;
            if (!this.canonicalMedia.has(mediaKey)) {
              this.canonicalMedia.set(mediaKey, {
                id: `med_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                listingId: listingKey,
                masterId,
                mediaType: m.mediaType,
                originalUrl: m.sourceUrl,
                position: m.position,
                sha256Hash: m.sha256Hash || adapter.computeContentHash(m.sourceUrl),
                firstSeenAt: new Date().toISOString(),
                lastSeenAt: new Date().toISOString(),
              });
              mediaDiscovered++;
            }
          }

          // E. Trazabilidad de Evidencia por Campo (property_field_evidence)
          this.evidenceTracker.captureEvidence(normalized, masterId, snapshotId);

          // F. Historial Inmutable de Precios (property_price_history)
          const priceEvent = this.priceTracker.trackPrice(normalized, masterId, snapshotId);
          if (priceEvent) {
            priceEventsCreated++;
          }

          // G. Deduplicación Multi-Fuente (Comparar con otros listings existentes)
          for (const [otherKey, otherListing] of this.normalizedListings.entries()) {
            if (otherKey !== listingKey && otherListing.sourceCode !== normalized.sourceCode) {
              const candidate = this.dedupService.evaluatePair(normalized, otherListing, {
                listingAId: listingKey,
                listingBId: otherKey,
                propertyAId: masterId,
              });
              if (candidate) {
                duplicateCandidatesFound++;
              }
            }
          }

          // H. Actualización de Ciclo de Vida Temporal
          this.lifecycleManager.markSeen(listingKey, raw.sourceCode);
        } catch (err: any) {
          errorsCount++;
          console.warn(`[IngestionEngine] Error procesando listing ${raw.sourceListingId}:`, err.message);
        }
      }

      status = errorsCount > 0 && listingsDiscovered === 0 ? 'FAILED' : 'COMPLETED';
    } catch (runErr: any) {
      status = 'FAILED';
      errorsCount++;
      errorSummary = runErr.message;
    }

    const finishedAt = new Date().toISOString();
    const durationMs = Date.now() - startTime;

    const result: IngestionRunResult = {
      runId,
      sourceCode,
      runType,
      status,
      startedAt,
      finishedAt,
      durationMs,
      pagesRequested: 1,
      listingsDiscovered,
      listingsNew,
      listingsUpdated,
      listingsUnchanged,
      listingsRemovedOrUnknown: 0,
      mediaDiscovered,
      priceEventsCreated,
      duplicateCandidatesFound,
      propertyMastersResolved,
      errorsCount,
      rateLimitEvents: 0,
      httpStatusSummary,
      parserVersion: 'v2.0-deterministic',
      errorSummary,
      metadata: {
        totalMastersInStore: this.masterResolver.getAllMasters().length,
        totalSnapshotsInStore: this.snapshots.size,
        totalPriceHistoryRecords: this.priceTracker.getAllHistory().length,
      },
    };

    this.runHistory.push(result);
    return result;
  }

  public getPipelineSummary() {
    return {
      totalListings: this.normalizedListings.size,
      totalMasters: this.masterResolver.getAllMasters().length,
      totalSnapshots: this.snapshots.size,
      totalMedia: this.canonicalMedia.size,
      totalPriceEvents: this.priceTracker.getAllHistory().length,
      totalFieldEvidences: this.evidenceTracker.getAllEvidence().length,
      totalDuplicateCandidates: this.dedupService.getCandidates().length,
      totalRuns: this.runHistory.length,
    };
  }
}
