// ==============================================================================
// HIPOTECALY TASADOR IA - INTERFAZ Y CLASE BASE DE ADAPTADORES DE FUENTES
// Control de Rate Limiting, Retries, Idempotencia, HealthCheck y Capabilities
// ==============================================================================

import {
  SourceCapability,
  RawListingPayload,
  NormalizedListing,
  RawMediaItem,
  HealthCheckResult,
} from '../types/tasadorPipelineTypes';
import { NormalizationEngine } from '../normalization/NormalizationEngine';

export interface DiscoverOptions {
  limit?: number;
  department?: string;
  propertyType?: string;
  operationType?: string;
  maxPages?: number;
}

export interface SourceAdapter {
  sourceCode: string;
  sourceName: string;
  domain: string;
  baseUrl: string;
  capability: SourceCapability;
  rateLimitPerMinute: number;
  enabled: boolean;
  ingestionEnabled: boolean;
  dryRun: boolean;
  scheduleEnabled: boolean;

  discoverListings(options?: DiscoverOptions): Promise<RawListingPayload[]>;
  fetchListing(sourceListingId: string): Promise<RawListingPayload | null>;
  normalizeListing(raw: RawListingPayload): Promise<NormalizedListing>;
  fetchMedia(raw: RawListingPayload): Promise<RawMediaItem[]>;
  computeContentHash(payload: unknown): string;
  healthCheck(): Promise<HealthCheckResult>;
  getCapabilities(): {
    capability: SourceCapability;
    rateLimitPerMinute: number;
    enabled: boolean;
    ingestionEnabled: boolean;
    dryRun: boolean;
    scheduleEnabled: boolean;
  };
}

export function computeSha256Hash(payload: unknown): string {
  const json = typeof payload === 'string' ? payload : JSON.stringify(payload);
  let hash = 0;
  for (let i = 0; i < json.length; i++) {
    const char = json.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `sha256_${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

export abstract class BaseSourceAdapter implements SourceAdapter {
  public abstract sourceCode: string;
  public abstract sourceName: string;
  public abstract domain: string;
  public abstract baseUrl: string;
  public abstract capability: SourceCapability;
  public rateLimitPerMinute: number = 60;
  public enabled: boolean = true;
  public ingestionEnabled: boolean = false;
  public dryRun: boolean = true;
  public scheduleEnabled: boolean = false;

  private lastRequestTime: number = 0;

  protected async throttle(): Promise<void> {
    const minIntervalMs = (60 / Math.max(1, this.rateLimitPerMinute)) * 1000;
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < minIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, minIntervalMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  public computeContentHash(payload: unknown): string {
    return computeSha256Hash(payload);
  }

  public async normalizeListing(raw: RawListingPayload): Promise<NormalizedListing> {
    return NormalizationEngine.normalize(raw);
  }

  public async fetchMedia(raw: RawListingPayload): Promise<RawMediaItem[]> {
    return raw.mediaRaw || [];
  }

  public getCapabilities() {
    return {
      capability: this.capability,
      rateLimitPerMinute: this.rateLimitPerMinute,
      enabled: this.enabled,
      ingestionEnabled: this.ingestionEnabled,
      dryRun: this.dryRun,
      scheduleEnabled: this.scheduleEnabled,
    };
  }

  public abstract discoverListings(options?: DiscoverOptions): Promise<RawListingPayload[]>;
  public abstract fetchListing(sourceListingId: string): Promise<RawListingPayload | null>;
  public abstract healthCheck(): Promise<HealthCheckResult>;
}
