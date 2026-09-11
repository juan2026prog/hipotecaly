// ==============================================================================
// HIPOTECALY TASADOR IA - SERVICIO DE DESCUBRIMIENTO INCREMENTAL (SourceDiscoveryService)
// Descubre publicaciones nuevas, modificadas, cambios de precio o sin cambios
// Compara 3 Fingerprints: Identity, Content, Pricing.
// Regla: No descarga ni reprocesa publicaciones idénticas (UNCHANGED).
// ==============================================================================

import crypto from 'crypto';
import { AdapterRegistry } from '../adapters/AdapterRegistry';
import { RawListingPayload } from '../types/tasadorPipelineTypes';
import { supabaseAdmin } from '../../../../server/supabase';

export interface DiscoveryRunResult {
  runId: string;
  sourceCode: string;
  status: 'COMPLETED' | 'FAILED' | 'SKIPPED_KILL_SWITCH';
  pagesInspected: number;
  listingsFound: number;
  listingsNew: number;
  listingsModified: number;
  listingsUnchanged: number;
  jobsQueued: number;
  errorsCount: number;
  durationMs: number;
  startedAt: string;
  finishedAt: string;
  message: string;
}

export interface ListingFingerprints {
  identityFingerprint: string;
  contentFingerprint: string;
  pricingFingerprint: string;
}

export function computeSha256(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export function computeListingFingerprints(raw: RawListingPayload): ListingFingerprints {
  const sourceCode = (raw.sourceCode || '').toLowerCase().trim();
  const sourceId = (raw.sourceListingId || '').trim();
  const canonUrl = (raw.canonicalUrl || raw.originalUrl || '').trim();

  // 1. Identity Fingerprint: Inmutable para el mismo aviso en el portal
  const identityStr = `${sourceCode}|${sourceId}|${canonUrl}`;
  const identityFingerprint = computeSha256(identityStr);

  // 2. Content Fingerprint: Características físicas, ubicación y texto
  const contentStr = [
    (raw.titleRaw || '').toLowerCase().trim(),
    (raw.descriptionRaw || '').toLowerCase().trim(),
    raw.totalAreaM2Raw || 0,
    raw.builtAreaM2Raw || 0,
    raw.bedroomsRaw || 0,
    raw.bathroomsRaw || 0,
    (raw.propertyTypeRaw || '').toLowerCase().trim(),
    (raw.departmentRaw || '').toLowerCase().trim(),
    (raw.neighborhoodRaw || '').toLowerCase().trim(),
    (raw.streetNameRaw || '').toLowerCase().trim(),
    (raw.streetNumberRaw || '').toLowerCase().trim(),
  ].join('|');
  const contentFingerprint = computeSha256(contentStr);

  // 3. Pricing Fingerprint: Precio publicado, moneda y gastos comunes
  const pricingStr = [
    raw.currentPriceRaw || 0,
    (raw.currencyRaw || 'USD').toUpperCase().trim(),
    raw.expensesRaw || 0,
  ].join('|');
  const pricingFingerprint = computeSha256(pricingStr);

  return { identityFingerprint, contentFingerprint, pricingFingerprint };
}

export class SourceDiscoveryService {
  private static instance: SourceDiscoveryService;
  private adapterRegistry: AdapterRegistry;

  // Cache en memoria para pruebas aisladas o fallbacks locales
  public localListingsMap: Map<string, {
    identityFingerprint: string;
    contentFingerprint: string;
    pricingFingerprint: string;
    lastSeenAt: string;
  }> = new Map();

  private constructor() {
    this.adapterRegistry = AdapterRegistry.getInstance();
  }

  public static getInstance(): SourceDiscoveryService {
    if (!SourceDiscoveryService.instance) {
      SourceDiscoveryService.instance = new SourceDiscoveryService();
    }
    return SourceDiscoveryService.instance;
  }

  /**
   * Ejecuta el ciclo de descubrimiento incremental sobre una fuente
   */
  public async runDiscovery(
    sourceCode: string,
    options?: { limit?: number; department?: string; customPayloads?: RawListingPayload[]; dryRun?: boolean }
  ): Promise<DiscoveryRunResult> {
    const startTime = Date.now();
    const runId = `disc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const startedAt = new Date().toISOString();

    const adapter = this.adapterRegistry.getAdapter(sourceCode);
    if (!adapter) {
      throw new Error(`Fuente ${sourceCode} no registrada en AdapterRegistry.`);
    }

    // 1. Verificación de Kill Switch persistente
    try {
      const { data: switches } = await supabaseAdmin
        .from('property_system_switches')
        .select('kill_switch_active, global_discovery_enabled, source_overrides')
        .maybeSingle();

      if (switches?.kill_switch_active) {
        return {
          runId,
          sourceCode,
          status: 'SKIPPED_KILL_SWITCH',
          pagesInspected: 0,
          listingsFound: 0,
          listingsNew: 0,
          listingsModified: 0,
          listingsUnchanged: 0,
          jobsQueued: 0,
          errorsCount: 0,
          durationMs: Date.now() - startTime,
          startedAt,
          finishedAt: new Date().toISOString(),
          message: 'Discovery detenido: Kill Switch global activo.',
        };
      }

      if (switches && !switches.global_discovery_enabled) {
        return {
          runId,
          sourceCode,
          status: 'SKIPPED_KILL_SWITCH',
          pagesInspected: 0,
          listingsFound: 0,
          listingsNew: 0,
          listingsModified: 0,
          listingsUnchanged: 0,
          jobsQueued: 0,
          errorsCount: 0,
          durationMs: Date.now() - startTime,
          startedAt,
          finishedAt: new Date().toISOString(),
          message: 'Discovery detenido: Descubrimiento global desactivado en switches.',
        };
      }
    } catch {
      // Si la base no está disponible en testing unitario, continuar con ejecución local
    }

    // 2. Obtener publicaciones del origen o usar payloads provistos
    let rawItems: RawListingPayload[] = [];
    let pagesInspected = 1;
    let errorsCount = 0;

    if (options?.customPayloads && options.customPayloads.length > 0) {
      rawItems = options.customPayloads;
    } else {
      try {
        rawItems = await adapter.discoverListings({
          limit: options?.limit || 50,
          department: options?.department || 'montevideo',
        });
        pagesInspected = Math.max(1, Math.ceil(rawItems.length / 25));
      } catch (err: any) {
        errorsCount++;
        console.error(`[SourceDiscoveryService] Error al descubrir ${sourceCode}:`, err);
      }
    }

    let listingsNew = 0;
    let listingsModified = 0;
    let listingsUnchanged = 0;
    let jobsQueued = 0;

    // 3. Consultar listings existentes para comparación de fingerprints
    const existingMap = new Map<string, {
      id: string;
      identityFingerprint: string;
      contentFingerprint: string;
      pricingFingerprint: string;
      currentPrice: number;
    }>();

    try {
      const { data: dbListings } = await supabaseAdmin.rpc('fn_pipeline_get_existing_fingerprints', {
        p_source_code: sourceCode,
      });

      if (dbListings && Array.isArray(dbListings)) {
        for (const dl of dbListings) {
          existingMap.set(dl.source_listing_id, {
            id: dl.id,
            identityFingerprint: dl.identity_fingerprint || '',
            contentFingerprint: dl.content_fingerprint || '',
            pricingFingerprint: dl.pricing_fingerprint || '',
            currentPrice: Number(dl.current_price) || 0,
          });
        }
      }
    } catch {
      // Usar mapa local
    }

    const jobsToInsert: Array<{
      source_code: string;
      source_listing_id: string;
      url: string;
      job_type: string;
      priority: number;
      payload: any;
    }> = [];

    const unchangedListingIds: string[] = [];
    const nowIso = new Date().toISOString();

    // 4. Comparación diferencial e incremental por cada aviso
    for (const raw of rawItems) {
      const listingId = raw.sourceListingId;
      const { identityFingerprint, contentFingerprint, pricingFingerprint } = computeListingFingerprints(raw);

      const existingDb = existingMap.get(listingId);
      const existingLocal = this.localListingsMap.get(`${sourceCode}_${listingId}`);

      if (existingDb || existingLocal) {
        const storedContentFp = existingDb?.contentFingerprint || existingLocal?.contentFingerprint;
        const storedPricingFp = existingDb?.pricingFingerprint || existingLocal?.pricingFingerprint;

        const isContentSame = storedContentFp === contentFingerprint;
        const isPricingSame = storedPricingFp === pricingFingerprint;

        if (isContentSame && isPricingSame) {
          // A. UNCHANGED: La publicación no cambió. Solo actualizar last_seen_at
          listingsUnchanged++;
          unchangedListingIds.push(listingId);
          this.localListingsMap.set(`${sourceCode}_${listingId}`, {
            identityFingerprint,
            contentFingerprint,
            pricingFingerprint,
            lastSeenAt: nowIso,
          });
        } else {
          // B. MODIFIED o PRICE_CHANGED
          listingsModified++;
          const jobType = !isPricingSame ? 'INGESTION_PRICE' : 'INGESTION_MODIFIED';

          this.localListingsMap.set(`${sourceCode}_${listingId}`, {
            identityFingerprint,
            contentFingerprint,
            pricingFingerprint,
            lastSeenAt: nowIso,
          });

          jobsToInsert.push({
            source_code: sourceCode,
            source_listing_id: listingId,
            url: raw.canonicalUrl || raw.originalUrl || '',
            job_type: jobType,
            priority: jobType === 'INGESTION_PRICE' ? 150 : 120,
            payload: {
              raw,
              fingerprints: { identityFingerprint, contentFingerprint, pricingFingerprint },
              previousPrice: existingDb?.currentPrice || null,
            },
          });
          jobsQueued++;
        }
      } else {
        // C. NEW: Publicación nunca antes vista
        listingsNew++;
        this.localListingsMap.set(`${sourceCode}_${listingId}`, {
          identityFingerprint,
          contentFingerprint,
          pricingFingerprint,
          lastSeenAt: nowIso,
        });

        jobsToInsert.push({
          source_code: sourceCode,
          source_listing_id: listingId,
          url: raw.canonicalUrl || raw.originalUrl || '',
          job_type: 'INGESTION_NEW',
          priority: 100,
          payload: {
            raw,
            fingerprints: { identityFingerprint, contentFingerprint, pricingFingerprint },
          },
        });
        jobsQueued++;
      }
    }

    // Actualizar publicaciones UNCHANGED en PostgreSQL
    if (unchangedListingIds.length > 0) {
      try {
        await supabaseAdmin.rpc('fn_pipeline_touch_unchanged_listings', {
          p_source_code: sourceCode,
          p_listing_ids: unchangedListingIds,
        });
      } catch (err: any) {
        console.warn(`[SourceDiscoveryService] Warning al actualizar unchanged en BD:`, err.message);
      }
    }

    // 5. Encolar jobs en la base de datos `property_ingestion_jobs` vía RPC en lotes seguros
    if (jobsToInsert.length > 0) {
      const chunkSize = 50;
      for (let i = 0; i < jobsToInsert.length; i += chunkSize) {
        const batch = jobsToInsert.slice(i, i + chunkSize);
        try {
          const { error } = await supabaseAdmin.rpc('fn_pipeline_enqueue_jobs', {
            p_jobs: batch,
          });
          if (error) {
            console.warn(`[SourceDiscoveryService] Warning al encolar lote de jobs ${i}-${i + chunkSize}:`, error.message);
          }
        } catch (err: any) {
          console.warn(`[SourceDiscoveryService] Warning al encolar jobs en BD:`, err.message);
        }
      }
    }

    const finishedAt = new Date().toISOString();
    const durationMs = Date.now() - startTime;

    // 6. Registrar métricas de la corrida en `property_discovery_runs` vía RPC
    try {
      await supabaseAdmin.rpc('fn_pipeline_record_discovery_run', {
        p_run: {
          source_code: sourceCode,
          run_type: options?.dryRun ? 'MANUAL' : 'ON_DEMAND',
          status: errorsCount > 0 && rawItems.length === 0 ? 'FAILED' : 'COMPLETED',
          pages_inspected: pagesInspected,
          listings_found: rawItems.length,
          listings_new: listingsNew,
          listings_modified: listingsModified,
          listings_unchanged: listingsUnchanged,
          jobs_queued: jobsQueued,
          errors_count: errorsCount,
          started_at: startedAt,
          finished_at: finishedAt,
          duration_ms: durationMs,
        },
      });
    } catch {
      // Seguir adelante si la conexión remota es opcional en tests
    }

    return {
      runId,
      sourceCode,
      status: errorsCount > 0 && rawItems.length === 0 ? 'FAILED' : 'COMPLETED',
      pagesInspected,
      listingsFound: rawItems.length,
      listingsNew,
      listingsModified,
      listingsUnchanged,
      jobsQueued,
      errorsCount,
      durationMs,
      startedAt,
      finishedAt,
      message: `Discovery finalizado: ${rawItems.length} detectadas (${listingsNew} nuevas, ${listingsModified} modificadas, ${listingsUnchanged} sin cambios, ${jobsQueued} encoladas).`,
    };
  }
}

export const sourceDiscoveryService = SourceDiscoveryService.getInstance();
