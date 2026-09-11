// ==============================================================================
// HIPOTECALY TASADOR IA - ADAPTADOR PARA FUENTES BLOQUEADAS O NO SOPORTADAS
// Principio Estricto: NO intentar bypass de CAPTCHA / Cloudflare ni paywalls
// ==============================================================================

import { BaseSourceAdapter, DiscoverOptions } from './SourceAdapter';
import {
  RawListingPayload,
  HealthCheckResult,
  SourceCapability,
} from '../types/tasadorPipelineTypes';

export interface BlockedSourceConfig {
  sourceCode: string;
  sourceName: string;
  domain: string;
  baseUrl: string;
  capability: 'BLOCKED' | 'REQUIRES_AUTHORIZATION' | 'NOT_SUPPORTED';
  blockReason: string;
}

export class BlockedSourceAdapter extends BaseSourceAdapter {
  public sourceCode: string;
  public sourceName: string;
  public domain: string;
  public baseUrl: string;
  public capability: SourceCapability;
  public rateLimitPerMinute = 0;
  private blockReason: string;

  constructor(config: BlockedSourceConfig) {
    super();
    this.sourceCode = config.sourceCode;
    this.sourceName = config.sourceName;
    this.domain = config.domain;
    this.baseUrl = config.baseUrl;
    this.capability = config.capability;
    this.blockReason = config.blockReason;
    this.enabled = true;
    this.ingestionEnabled = false; // Jamás activado automáticamente
  }

  public async healthCheck(): Promise<HealthCheckResult> {
    return {
      sourceCode: this.sourceCode,
      healthy: false,
      status: this.capability,
      responseTimeMs: 0,
      capability: this.capability,
      message: `Fuente en estado ${this.capability}: ${this.blockReason}. No se realiza bypass por principios de seguridad y legalidad.`,
      testedAt: new Date().toISOString(),
    };
  }

  public async discoverListings(_options?: DiscoverOptions): Promise<RawListingPayload[]> {
    console.info(`[BlockedSourceAdapter] ${this.sourceCode} está en estado ${this.capability}. No se ejecuta descubrimiento.`);
    return [];
  }

  public async fetchListing(_sourceListingId: string): Promise<RawListingPayload | null> {
    return null;
  }
}
