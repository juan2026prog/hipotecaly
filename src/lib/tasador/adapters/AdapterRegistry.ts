// ==============================================================================
// HIPOTECALY TASADOR IA - REGISTRO Y GOBERNANZA DE ADAPTADORES (TOP 20 FUENTES)
// Gestión de Capabilities, Feature Flags (enabled, ingestion_enabled, dry_run)
// ==============================================================================

import { SourceAdapter } from './SourceAdapter';
import { InfoCasasAdapter } from './InfoCasasAdapter';
import { MercadoLibreAdapter } from './MercadoLibreAdapter';
import { RemaxAdapter } from './RemaxAdapter';
import { GenericAgencyAdapter } from './GenericAgencyAdapter';
import { BlockedSourceAdapter } from './BlockedSourceAdapter';
import { HealthCheckResult, SourceCapability } from '../types/tasadorPipelineTypes';

export interface SourceRuntimeState {
  code: string;
  name: string;
  domain: string;
  capability: SourceCapability;
  enabled: boolean;
  ingestionEnabled: boolean;
  dryRun: boolean;
  scheduleEnabled: boolean;
  rateLimitPerMinute: number;
  lastHealthCheck?: HealthCheckResult;
}

export class AdapterRegistry {
  private static instance: AdapterRegistry;
  private adapters: Map<string, SourceAdapter> = new Map();

  private constructor() {
    this.registerAllSources();
  }

  public static getInstance(): AdapterRegistry {
    if (!AdapterRegistry.instance) {
      AdapterRegistry.instance = new AdapterRegistry();
    }
    return AdapterRegistry.instance;
  }

  private registerAllSources() {
    // 01. Mercado Libre Inmuebles
    this.register(new MercadoLibreAdapter());

    // 02. InfoCasas (Fuente Líder Integrada para Producción)
    this.register(new InfoCasasAdapter());

    // 03. Gallito Luis (BLOCKED - Cloudflare Bot Management HTTP 403)
    this.register(
      new BlockedSourceAdapter({
        sourceCode: 'gallito_uy',
        sourceName: 'Gallito Luis',
        domain: 'gallito.com.uy',
        baseUrl: 'https://www.gallito.com.uy',
        capability: 'BLOCKED',
        blockReason: 'Cloudflare Bot Management bloquea conexiones automatizadas directas (HTTP 403). No se realiza bypass.',
      })
    );

    // 04. RE/MAX Uruguay
    this.register(new RemaxAdapter());

    // 05. Engel & Völkers Uruguay
    this.register(
      new GenericAgencyAdapter({
        sourceCode: 'engel_volkers_uy',
        sourceName: 'Engel & Völkers Uruguay',
        domain: 'engelvoelkers.com.uy',
        baseUrl: 'https://www.engelvoelkers.com/uruguay',
        capability: 'PUBLIC_HTML',
        rateLimitPerMinute: 20,
      })
    );

    // 06. Sotheby’s International Realty Uruguay
    this.register(
      new BlockedSourceAdapter({
        sourceCode: 'sothebys_uy',
        sourceName: 'Sotheby’s International Realty Uruguay',
        domain: 'sothebysrealty.com.uy',
        baseUrl: 'https://www.sothebysrealty.com.uy',
        capability: 'REQUIRES_AUTHORIZATION',
        blockReason: 'Requiere autorización formal o API partner debido a timeouts de tráfico automatizado.',
      })
    );

    // 07. ACSA Inmobiliaria
    this.register(
      new GenericAgencyAdapter({
        sourceCode: 'acs_uy',
        sourceName: 'ACSA Inmobiliaria',
        domain: 'acsa.com.uy',
        baseUrl: 'https://www.acsa.com.uy',
        capability: 'PUBLIC_HTML',
        rateLimitPerMinute: 20,
      })
    );

    // 08. Kosak Inversiones Inmobiliarias
    this.register(
      new GenericAgencyAdapter({
        sourceCode: 'kosak_uy',
        sourceName: 'Kosak Inversiones Inmobiliarias',
        domain: 'kosak.com.uy',
        baseUrl: 'https://www.kosak.com.uy',
        capability: 'PUBLIC_HTML',
        rateLimitPerMinute: 20,
      })
    );

    // 09. Meikle Bienes Raíces
    this.register(
      new GenericAgencyAdapter({
        sourceCode: 'meikle_uy',
        sourceName: 'Meikle Bienes Raíces',
        domain: 'meikle.com.uy',
        baseUrl: 'https://www.meikle.com.uy',
        capability: 'PUBLIC_HTML',
        rateLimitPerMinute: 20,
      })
    );

    // 10. Caldeyro Victorica Bienes Raíces
    this.register(
      new GenericAgencyAdapter({
        sourceCode: 'caldeiro_uy',
        sourceName: 'Caldeyro Victorica Bienes Raíces',
        domain: 'caldeyro.com',
        baseUrl: 'https://www.caldeyro.com',
        capability: 'PUBLIC_HTML',
        rateLimitPerMinute: 20,
      })
    );

    // 11. Pallares y Bruzzone
    this.register(
      new BlockedSourceAdapter({
        sourceCode: 'pallares_bruzzone_uy',
        sourceName: 'Pallares y Bruzzone',
        domain: 'pallaresbruzzone.com.uy',
        baseUrl: 'https://www.pallaresbruzzone.com.uy',
        capability: 'NOT_SUPPORTED',
        blockReason: 'Servidor no responde sobre TLS público estándar.',
      })
    );

    // 12. Bado y Asociados
    this.register(
      new GenericAgencyAdapter({
        sourceCode: 'bado_asociados_uy',
        sourceName: 'Bado y Asociados',
        domain: 'badoyasociados.com.uy',
        baseUrl: 'https://www.badoyasociados.com.uy',
        capability: 'PUBLIC_HTML',
        rateLimitPerMinute: 20,
      })
    );

    // 13. Braglia Inmobiliaria
    this.register(
      new BlockedSourceAdapter({
        sourceCode: 'braglia_uy',
        sourceName: 'Braglia Inmobiliaria',
        domain: 'braglia.com.uy',
        baseUrl: 'https://www.braglia.com.uy',
        capability: 'NOT_SUPPORTED',
        blockReason: 'Dominio o servidor no accesible en internet pública.',
      })
    );

    // 14. Cánepa y Cánepa
    this.register(
      new GenericAgencyAdapter({
        sourceCode: 'canepa_uy',
        sourceName: 'Cánepa y Cánepa',
        domain: 'canepa.com.uy',
        baseUrl: 'https://www.canepa.com.uy',
        capability: 'PUBLIC_HTML',
        rateLimitPerMinute: 20,
      })
    );

    // 15. Nicolás de Módena Inmobiliaria
    this.register(
      new GenericAgencyAdapter({
        sourceCode: 'nicolas_modena_uy',
        sourceName: 'Nicolás de Módena Inmobiliaria',
        domain: 'nicolasdemodena.com.uy',
        baseUrl: 'https://www.nicolasdemodena.com.uy',
        capability: 'PUBLIC_HTML',
        rateLimitPerMinute: 20,
      })
    );

    // 16. Nieto y Páez
    this.register(
      new BlockedSourceAdapter({
        sourceCode: 'nieto_paez_uy',
        sourceName: 'Nieto y Páez',
        domain: 'nietoypaez.com.uy',
        baseUrl: 'https://www.nietoypaez.com.uy',
        capability: 'BLOCKED',
        blockReason: 'Acceso bloqueado por el servidor web origen (HTTP 403).',
      })
    );

    // 17. Terramar Corporate & Residential
    this.register(
      new GenericAgencyAdapter({
        sourceCode: 'terramar_uy',
        sourceName: 'Terramar Corporate & Residential',
        domain: 'terramar.com.uy',
        baseUrl: 'https://www.terramar.com.uy',
        capability: 'PUBLIC_HTML',
        rateLimitPerMinute: 20,
      })
    );

    // 18. Puntamar Real Estate
    this.register(
      new BlockedSourceAdapter({
        sourceCode: 'puntamar_uy',
        sourceName: 'Puntamar Real Estate',
        domain: 'puntamar.com.uy',
        baseUrl: 'https://www.puntamar.com.uy',
        capability: 'NOT_SUPPORTED',
        blockReason: 'Dominio no responde de manera consistente.',
      })
    );

    // 19. Century 21 Uruguay
    this.register(
      new GenericAgencyAdapter({
        sourceCode: 'century21_uy',
        sourceName: 'Century 21 Uruguay',
        domain: 'century21.com.uy',
        baseUrl: 'https://www.century21.com.uy',
        capability: 'PUBLIC_HTML',
        rateLimitPerMinute: 40,
      })
    );

    // 20. Varela Inmobiliaria
    this.register(
      new BlockedSourceAdapter({
        sourceCode: 'varela_uy',
        sourceName: 'Varela Inmobiliaria',
        domain: 'varela.com.uy',
        baseUrl: 'https://www.varela.com.uy',
        capability: 'NOT_SUPPORTED',
        blockReason: 'Servidor no accesible públicamente.',
      })
    );
  }

  public register(adapter: SourceAdapter) {
    this.adapters.set(adapter.sourceCode, adapter);
  }

  public getAdapter(sourceCode: string): SourceAdapter | undefined {
    return this.adapters.get(sourceCode);
  }

  public getAllAdapters(): SourceAdapter[] {
    return Array.from(this.adapters.values());
  }

  public getSourcesState(): SourceRuntimeState[] {
    return Array.from(this.adapters.values()).map((a) => ({
      code: a.sourceCode,
      name: a.sourceName,
      domain: a.domain,
      capability: a.capability,
      enabled: a.enabled,
      ingestionEnabled: a.ingestionEnabled,
      dryRun: a.dryRun,
      scheduleEnabled: a.scheduleEnabled,
      rateLimitPerMinute: a.rateLimitPerMinute,
    }));
  }

  public updateFlags(
    sourceCode: string,
    flags: {
      enabled?: boolean;
      ingestionEnabled?: boolean;
      dryRun?: boolean;
      scheduleEnabled?: boolean;
    }
  ) {
    const adapter = this.adapters.get(sourceCode);
    if (adapter) {
      if (flags.enabled !== undefined) adapter.enabled = flags.enabled;
      if (flags.ingestionEnabled !== undefined) adapter.ingestionEnabled = flags.ingestionEnabled;
      if (flags.dryRun !== undefined) adapter.dryRun = flags.dryRun;
      if (flags.scheduleEnabled !== undefined) adapter.scheduleEnabled = flags.scheduleEnabled;
    }
  }

  public async runHealthCheckAll(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];
    for (const adapter of this.adapters.values()) {
      const res = await adapter.healthCheck();
      results.push(res);
    }
    return results;
  }
}
