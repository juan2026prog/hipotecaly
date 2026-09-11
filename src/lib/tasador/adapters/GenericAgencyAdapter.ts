// ==============================================================================
// HIPOTECALY TASADOR IA - ADAPTADOR GENÉRICO PARA INMOBILIARIAS LOCALES
// Utilizado para ACSA, Kosak, Meikle, Caldeyro, Canepa, Terramar, Century 21, etc.
// ==============================================================================

import { BaseSourceAdapter, DiscoverOptions } from './SourceAdapter';
import {
  RawListingPayload,
  HealthCheckResult,
  SourceCapability,
} from '../types/tasadorPipelineTypes';

export interface AgencyAdapterConfig {
  sourceCode: string;
  sourceName: string;
  domain: string;
  baseUrl: string;
  capability?: SourceCapability;
  rateLimitPerMinute?: number;
  healthPath?: string;
  listingPath?: string;
}

export class GenericAgencyAdapter extends BaseSourceAdapter {
  public sourceCode: string;
  public sourceName: string;
  public domain: string;
  public baseUrl: string;
  public capability: SourceCapability;
  public rateLimitPerMinute: number;
  private healthPath: string;
  public listingPath: string;

  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 HipotecalyDataBot/1.0';

  constructor(config: AgencyAdapterConfig) {
    super();
    this.sourceCode = config.sourceCode;
    this.sourceName = config.sourceName;
    this.domain = config.domain;
    this.baseUrl = config.baseUrl;
    this.capability = config.capability || 'PUBLIC_HTML';
    this.rateLimitPerMinute = config.rateLimitPerMinute || 20;
    this.healthPath = config.healthPath || '';
    this.listingPath = config.listingPath || '/propiedades';
  }

  public async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const url = `${this.baseUrl}${this.healthPath}`;
    try {
      await this.throttle();
      const res = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
        signal: AbortSignal.timeout(8000),
      });
      const responseTimeMs = Date.now() - startTime;

      return {
        sourceCode: this.sourceCode,
        healthy: res.ok,
        status: res.status,
        responseTimeMs,
        capability: this.capability,
        message: res.ok
          ? `Sitio web de ${this.sourceName} operativo`
          : `HTTP ${res.status}: Respuesta inesperada`,
        testedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        sourceCode: this.sourceCode,
        healthy: false,
        status: 'ERROR',
        responseTimeMs: Date.now() - startTime,
        capability: this.capability,
        message: `Fallo de conexión con ${this.sourceName}: ${err.message}`,
        testedAt: new Date().toISOString(),
      };
    }
  }

  public async discoverListings(_options?: DiscoverOptions): Promise<RawListingPayload[]> {
    // Implementación base para inmobiliarias individuales usando this.listingPath
    return [];
  }

  public async fetchListing(sourceListingId: string): Promise<RawListingPayload | null> {
    const url = `${this.baseUrl}/propiedad/${sourceListingId}`;
    return {
      sourceCode: this.sourceCode,
      sourceListingId,
      sourceListingKey: `${this.sourceCode}_${sourceListingId}`,
      originalUrl: url,
      titleRaw: `Propiedad ${this.sourceName} ${sourceListingId}`,
      propertyTypeRaw: 'Apartamento',
      operationTypeRaw: 'Venta',
      agencyNameRaw: this.sourceName,
    };
  }
}
