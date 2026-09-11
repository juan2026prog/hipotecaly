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
    this.masterResolver = new PropertyMasterResolver();
    this.priceTracker = new PriceHistoryTracker();
    this.evidenceTracker = new FieldEvidenceTracker();
    this.lifecycleManager = new ListingLifecycleManager();
  }

  public static getInstance(): IngestionEngine {
    if (!IngestionEngine.instance) {
      IngestionEngine.instance = new IngestionEngine();
    }
    return IngestionEngine.instance;
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
