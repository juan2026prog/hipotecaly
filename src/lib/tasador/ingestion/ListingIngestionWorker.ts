// ==============================================================================
// HIPOTECALY TASADOR IA - WORKER DE INGESTA DETERMINÍSTICA (ListingIngestionWorker)
// Consume jobs de PostgreSQL, toma snapshot inmutable, normaliza, deduplica,
// actualiza historial de precios, calcula calidad de datos y elegibilidad de comparables.
// Idempotente, tolerante a fallos y sin dependencia de OpenAI.
// ==============================================================================

import { NormalizationEngine } from '../normalization/NormalizationEngine';
import { PropertyMasterResolver } from '../master/PropertyMasterResolver';
import { DataQualityEngine } from '../quality/DataQualityEngine';
import { PriceHistoryTracker } from '../price_history/PriceHistoryTracker';
import { FieldEvidenceTracker } from '../evidence/FieldEvidenceTracker';
import { RawListingPayload, NormalizedListing } from '../types/tasadorPipelineTypes';
import { computeListingFingerprints } from './SourceDiscoveryService';
import { supabaseAdmin } from '../../../../server/supabase.js';

export interface WorkerBatchResult {
  jobsClaimed: number;
  jobsSucceeded: number;
  jobsFailed: number;
  jobsSkipped: number;
  listingsCreated: number;
  listingsUpdated: number;
  mastersResolved: number;
  priceEventsCreated: number;
  mediaItemsCreated: number;
  durationMs: number;
}

export type ComparableEligibilityType = 'ELIGIBLE' | 'PARTIAL' | 'NOT_ELIGIBLE' | 'REVIEW_REQUIRED';

export function evaluateComparableEligibility(
  normalized: NormalizedListing,
  qualityScore: number
): { eligibility: ComparableEligibilityType; reasons: string[] } {
  const reasons: string[] = [];

  if (normalized.operationType !== 'SALE') {
    reasons.push('OPERACION_NO_ES_VENTA');
    return { eligibility: 'NOT_ELIGIBLE', reasons };
  }

  if (!normalized.priceUsd || normalized.priceUsd <= 0) {
    reasons.push('PRECIO_INVALIDO_O_CERO');
    return { eligibility: 'NOT_ELIGIBLE', reasons };
  }

  if (!normalized.department) {
    reasons.push('DEPARTAMENTO_FALTANTE');
    return { eligibility: 'NOT_ELIGIBLE', reasons };
  }

  const hasArea = (normalized.builtAreaM2 && normalized.builtAreaM2 > 0) || (normalized.totalAreaM2 && normalized.totalAreaM2 > 0);
  if (!hasArea) {
    reasons.push('SUPERFICIE_TOTAL_Y_CONSTRUIDA_NULAS');
  }

  if (!normalized.neighborhood && !normalized.locality) {
    reasons.push('UBICACION_MICRO_INCOMPLETA');
  }

  if (qualityScore < 40) {
    reasons.push('SCORE_CALIDAD_INSUFICIENTE');
    return { eligibility: 'NOT_ELIGIBLE', reasons };
  }

  if (hasArea && normalized.department && (normalized.neighborhood || normalized.locality) && qualityScore >= 60) {
    reasons.push('CUMPLE_CRITERIOS_ESTRICTOS_DE_COMPARABLE');
    return { eligibility: 'ELIGIBLE', reasons };
  }

  if (qualityScore >= 40 && hasArea) {
    reasons.push('APTO_COMO_COMPARABLE_PARCIAL');
    return { eligibility: 'PARTIAL', reasons };
  }

  reasons.push('REQUIERE_REVISION_MANUAL');
  return { eligibility: 'REVIEW_REQUIRED', reasons };
}

export class ListingIngestionWorker {
  private static instance: ListingIngestionWorker;

  public masterResolver: PropertyMasterResolver;
  public priceTracker: PriceHistoryTracker;
  public evidenceTracker: FieldEvidenceTracker;

  // Repositorio en memoria para tests aislados
  public memoryListings: Map<string, any> = new Map();
  public memorySnapshots: Map<string, any> = new Map();
  public memoryPriceHistory: Array<any> = [];

  private constructor() {
    this.masterResolver = PropertyMasterResolver.getInstance();
    this.priceTracker = new PriceHistoryTracker();
    this.evidenceTracker = new FieldEvidenceTracker();
  }

  public static getInstance(): ListingIngestionWorker {
    if (!ListingIngestionWorker.instance) {
      ListingIngestionWorker.instance = new ListingIngestionWorker();
    }
    return ListingIngestionWorker.instance;
  }

  /**
   * Consume y procesa un lote de trabajos de la cola persistente `property_ingestion_jobs`
   */
  public async processBatch(batchSize: number = 25): Promise<WorkerBatchResult> {
    const startTime = Date.now();
    const workerId = `worker_${process.pid || 1}_${Math.random().toString(36).substring(2, 6)}`;

    let jobsClaimed = 0;
    let jobsSucceeded = 0;
    let jobsFailed = 0;
    let jobsSkipped = 0;
    let listingsCreated = 0;
    let listingsUpdated = 0;
    let mastersResolved = 0;
    let priceEventsCreated = 0;
    let mediaItemsCreated = 0;

    // 1. Reclamar trabajos pendientes con leasing optimista vía RPC
    let jobs: any[] = [];
    try {
      const { data: claimed, error: claimErr } = await supabaseAdmin.rpc('fn_pipeline_claim_jobs', {
        p_batch_size: batchSize,
        p_worker_id: workerId,
      });

      if (claimErr) {
        console.warn('[ListingIngestionWorker] Error RPC fn_pipeline_claim_jobs:', claimErr.message);
      } else if (claimed && Array.isArray(claimed)) {
        jobs = claimed;
        jobsClaimed = jobs.length;
      }
    } catch (claimErr) {
      console.warn('[ListingIngestionWorker] Error reclamando jobs de la base:', claimErr);
    }

    // 2. Procesar cada trabajo reclamado
    for (const job of jobs) {
      try {
        const rawPayload: RawListingPayload = job.payload?.raw;
        if (!rawPayload) {
          throw new Error('Payload nulo o inválido en el job.');
        }

        const res = await this.processSingleListing(rawPayload, {
          jobId: job.id,
          sourceUuid: job.source_id,
        });

        if (res.isNew) listingsCreated++;
        else listingsUpdated++;
        if (res.masterCreated) mastersResolved++;
        if (res.priceEventCreated) priceEventsCreated++;
        mediaItemsCreated += res.mediaCount;

        // Marcar éxito en la cola vía RPC
        await supabaseAdmin.rpc('fn_pipeline_complete_job', {
          p_job_id: job.id,
          p_status: 'SUCCESS',
        });

        jobsSucceeded++;
      } catch (procErr: any) {
        jobsFailed++;
        const nextAttempts = (job.attempts || 0) + 1;
        const isDeadLetter = nextAttempts >= (job.max_attempts || 3);
        const retryDelaySec = Math.pow(2, nextAttempts) * 10;

        try {
          await supabaseAdmin.rpc('fn_pipeline_complete_job', {
            p_job_id: job.id,
            p_status: isDeadLetter ? 'DEAD_LETTER' : 'RETRY',
            p_error_code: 'WORKER_PROCESSING_ERROR',
            p_error_message: procErr.message,
            p_retry_delay_seconds: retryDelaySec,
          });
        } catch {
          // Silenciar
        }
      }
    }

    return {
      jobsClaimed,
      jobsSucceeded,
      jobsFailed,
      jobsSkipped,
      listingsCreated,
      listingsUpdated,
      mastersResolved,
      priceEventsCreated,
      mediaItemsCreated,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Procesa de extremo a extremo una publicación individual (utilizado por el worker y por tests unitarios)
   */
  public async processSingleListing(
    raw: RawListingPayload,
    options?: { jobId?: string; sourceUuid?: string; previousPriceUsd?: number }
  ): Promise<{
    listingId: string;
    masterId: string;
    isNew: boolean;
    masterCreated: boolean;
    priceEventCreated: boolean;
    mediaCount: number;
    qualityScore: number;
    comparableEligibility: ComparableEligibilityType;
  }> {
    const sourceCode = raw.sourceCode;
    const sourceListingId = raw.sourceListingId;
    const listingKey = `${sourceCode}_${sourceListingId}`;

    // 1. Normalización Determinística Uruguay
    const normalized: NormalizedListing = NormalizationEngine.normalize(raw);

    // 2. Cálculo de Fingerprints
    const fingerprints = computeListingFingerprints(raw);

    // 3. Evaluación de Calidad de Datos (0-100)
    const qualityReport = DataQualityEngine.evaluate(normalized);
    const qualityScore = qualityReport.qualityScore;

    // 4. Evaluación de Comparable Eligibility
    const { eligibility: comparableEligibility, reasons: eligibilityReasons } =
      evaluateComparableEligibility(normalized, qualityScore);

    // 5. Deduplicación y Resolución de Property Master
    const masterResult = this.masterResolver.resolveMaster(normalized);
    const masterId = masterResult.master.id;
    const masterCreated = masterResult.isNew;

    // 6. Verificar existencia previa en memoria (test isolation / local fallback)
    const mem = this.memoryListings.get(listingKey);
    let targetListingId = mem?.id || `list_${sourceCode}_${sourceListingId}`;
    let isNew = !mem;
    const previousPriceUsd = options?.previousPriceUsd ?? (mem?.price_usd_normalized || mem?.price_usd || null);
    let priceEventCreated = false;
    let mediaCount = Array.isArray(raw.mediaRaw) ? raw.mediaRaw.length : 0;

    let changePct: number | null = null;
    if (previousPriceUsd !== null && previousPriceUsd > 0 && normalized.priceUsd > 0 && previousPriceUsd !== normalized.priceUsd) {
      changePct = Math.round(((normalized.priceUsd - previousPriceUsd) / previousPriceUsd) * 10000) / 100;
    }

    try {
      const ingestPayload = {
        master: {
          id: masterId,
          canonical_address: masterResult.master.canonicalAddress,
          department: normalized.department || 'Montevideo',
          city: normalized.city || 'Montevideo',
          neighborhood: normalized.neighborhood || null,
          property_type: normalized.propertyType || 'apartamento',
          total_surface_m2: normalized.totalAreaM2 || null,
          covered_surface_m2: normalized.builtAreaM2 || null,
          bedrooms: normalized.bedrooms || null,
          bathrooms: normalized.bathrooms || null,
          garages: normalized.garages || 0,
          latitude: normalized.latitude || null,
          longitude: normalized.longitude || null,
          dedup_hash: masterResult.master.dedupHash,
          canonical_status: 'ACTIVE',
          data_quality_score: qualityScore,
        },
        listing: {
          source_code: sourceCode,
          source_listing_id: sourceListingId,
          original_url: raw.originalUrl || '',
          canonical_url: raw.canonicalUrl || raw.originalUrl || '',
          source_agency_name: raw.agencyNameRaw || null,
          source_agent_id: raw.agentPhoneRaw || null,
          title_raw: raw.titleRaw,
          title_normalized: normalized.titleNormalized || raw.titleRaw,
          description_raw: raw.descriptionRaw,
          description_normalized: normalized.descriptionNormalized || raw.descriptionRaw,
          operation_type: normalized.operationType || 'VENTA',
          status: 'ACTIVE',
          department_raw: raw.departmentRaw,
          department_normalized: normalized.department,
          city_raw: raw.cityRaw || raw.departmentRaw,
          city_normalized: normalized.city,
          locality_raw: raw.localityRaw,
          locality_normalized: normalized.locality,
          neighborhood_raw: raw.neighborhoodRaw,
          neighborhood_normalized: normalized.neighborhood,
          address_raw: raw.addressRaw,
          address_normalized: normalized.streetName,
          price_amount: raw.currentPriceRaw || 0,
          currency: normalized.currentCurrency || 'USD',
          price_usd: normalized.priceUsd,
          price_uyu: normalized.priceUyu || null,
          price_usd_normalized: normalized.priceUsd,
          price_per_m2: normalized.pricePerM2Usd || null,
          price_per_m2_usd: normalized.pricePerM2Usd || null,
          total_area_m2: normalized.totalAreaM2 || null,
          built_area_m2: normalized.builtAreaM2 || null,
          bedrooms: normalized.bedrooms || null,
          bathrooms: normalized.bathrooms || null,
          garages: normalized.garages || 0,
          latitude: normalized.latitude || null,
          longitude: normalized.longitude || null,
          identity_fingerprint: fingerprints.identityFingerprint,
          content_fingerprint: fingerprints.contentFingerprint,
          pricing_fingerprint: fingerprints.pricingFingerprint,
          data_quality_score: qualityScore,
          comparable_eligibility: comparableEligibility,
          eligibility_reasons: eligibilityReasons,
        },
        snapshot: {
          content_hash: fingerprints.contentFingerprint,
          structured_payload: raw,
          parser_version: 'v2.0-deterministic',
        },
        price_history: normalized.priceUsd > 0 ? {
          price_usd: normalized.priceUsd,
          price_amount: raw.currentPriceRaw || normalized.priceUsd,
          currency: normalized.currentCurrency || 'USD',
          price_uyu: normalized.priceUyu || null,
          price_per_m2_usd: normalized.pricePerM2Usd || null,
          previous_price_usd: previousPriceUsd,
          price_change_percentage: changePct,
          event_type: previousPriceUsd ? 'PRICE_CHANGED' : 'FIRST_SEEN',
        } : null,
        media: Array.isArray(raw.mediaRaw) ? raw.mediaRaw.map((m, idx) => ({
          media_type: m.mediaType || 'IMAGE',
          original_url: m.sourceUrl,
          position: m.position !== undefined ? m.position : idx,
        })) : [],
      };

      const { data: dbResult, error: dbErr } = await supabaseAdmin.rpc('fn_pipeline_ingest_listing', {
        p_payload: ingestPayload,
      });

      if (dbResult) {
        targetListingId = dbResult.listing_id || targetListingId;
        isNew = dbResult.is_new ?? isNew;
        priceEventCreated = dbResult.price_event_created ?? priceEventCreated;
        mediaCount = dbResult.media_count ?? mediaCount;
      } else if (dbErr) {
        console.warn(`[ListingIngestionWorker] Warning RPC fn_pipeline_ingest_listing:`, dbErr.message);
      }
    } catch (err: any) {
      console.warn(`[ListingIngestionWorker] Error ingesta BD:`, err.message);
    }

    // Persistencia en memoria para tests aislados
    this.memoryListings.set(listingKey, {
      id: targetListingId,
      source_id: options?.sourceUuid || 'mem_source',
      source_listing_id: sourceListingId,
      title: raw.titleRaw,
      title_normalized: normalized.titleNormalized,
      price_usd: normalized.priceUsd,
      price_usd_normalized: normalized.priceUsd,
      price_amount: raw.currentPriceRaw,
      currency: normalized.currentCurrency || 'USD',
      built_area_m2: normalized.builtAreaM2,
      total_area_m2: normalized.totalAreaM2,
      bedrooms: normalized.bedrooms,
      bathrooms: normalized.bathrooms,
      department_normalized: normalized.department,
      neighborhood_normalized: normalized.neighborhood,
      identity_fingerprint: fingerprints.identityFingerprint,
      content_fingerprint: fingerprints.contentFingerprint,
      pricing_fingerprint: fingerprints.pricingFingerprint,
      data_quality_score: qualityScore,
      comparable_eligibility: comparableEligibility,
      eligibility_reasons: eligibilityReasons,
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
    });

    this.memorySnapshots.set(`${targetListingId}_${fingerprints.contentFingerprint}`, {
      listingId: targetListingId,
      contentHash: fingerprints.contentFingerprint,
      structuredPayload: raw,
      parserVersion: 'v2.0-deterministic',
      capturedAt: new Date().toISOString(),
    });

    if (normalized.priceUsd > 0 && (isNew || (previousPriceUsd !== null && previousPriceUsd !== normalized.priceUsd))) {
      this.memoryPriceHistory.push({
        propertyId: masterId,
        listingId: targetListingId,
        priceUsd: normalized.priceUsd,
        previousPriceUsd,
        priceChangePercentage: changePct,
        eventType: previousPriceUsd ? 'PRICE_CHANGED' : 'FIRST_SEEN',
        observedAt: new Date().toISOString(),
      });
      priceEventCreated = true;
    }

    return {
      listingId: targetListingId,
      masterId,
      isNew,
      masterCreated,
      priceEventCreated,
      mediaCount,
      qualityScore,
      comparableEligibility,
    };
  }
}

export const listingIngestionWorker = ListingIngestionWorker.getInstance();
