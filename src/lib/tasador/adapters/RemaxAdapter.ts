// ==============================================================================
// HIPOTECALY TASADOR IA - ADAPTADOR RE/MAX URUGUAY
// Capability: PUBLIC_HTML
// ==============================================================================

import { BaseSourceAdapter, DiscoverOptions } from './SourceAdapter';
import {
  RawListingPayload,
  HealthCheckResult,
} from '../types/tasadorPipelineTypes';

export class RemaxAdapter extends BaseSourceAdapter {
  public sourceCode = 'remax_uy';
  public sourceName = 'RE/MAX Uruguay';
  public domain = 'remax.com.uy';
  public baseUrl = 'https://www.remax.com.uy';
  public capability = 'PUBLIC_HTML' as const;
  public rateLimitPerMinute = 40;

  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  public async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      await this.throttle();
      const res = await fetch(this.baseUrl, {
        headers: { 'User-Agent': this.userAgent },
        signal: AbortSignal.timeout(10000),
      });
      const responseTimeMs = Date.now() - startTime;

      return {
        sourceCode: this.sourceCode,
        healthy: res.ok,
        status: res.status,
        responseTimeMs,
        capability: this.capability,
        message: res.ok ? 'RE/MAX Uruguay accesible públicamente' : `HTTP ${res.status}`,
        testedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        sourceCode: this.sourceCode,
        healthy: false,
        status: 'ERROR',
        responseTimeMs: Date.now() - startTime,
        capability: this.capability,
        message: `Error de conexión con RE/MAX: ${err.message}`,
        testedAt: new Date().toISOString(),
      };
    }
  }

  public async discoverListings(_options?: DiscoverOptions): Promise<RawListingPayload[]> {
    const discovered: RawListingPayload[] = [];
    return discovered;
  }

  public async fetchListing(sourceListingId: string): Promise<RawListingPayload | null> {
    const url = `${this.baseUrl}/listings/${sourceListingId}`;
    return {
      sourceCode: this.sourceCode,
      sourceListingId,
      sourceListingKey: `remax_${sourceListingId}`,
      originalUrl: url,
      titleRaw: `Propiedad RE/MAX ${sourceListingId}`,
      propertyTypeRaw: 'Apartamento',
      operationTypeRaw: 'Venta',
    };
  }
}
