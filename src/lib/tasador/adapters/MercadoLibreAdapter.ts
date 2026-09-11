// ==============================================================================
// HIPOTECALY TASADOR IA - ADAPTADOR MERCADO LIBRE INMUEBLES URUGUAY
// Capability: PUBLIC_HTML / REQUIRES_AUTHORIZATION (API Oficial requiere OAuth)
// ==============================================================================

import { BaseSourceAdapter, DiscoverOptions } from './SourceAdapter';
import {
  RawListingPayload,
  HealthCheckResult,
} from '../types/tasadorPipelineTypes';

export class MercadoLibreAdapter extends BaseSourceAdapter {
  public sourceCode = 'mercadolibre_uy';
  public sourceName = 'Mercado Libre Inmuebles';
  public domain = 'inmuebles.mercadolibre.com.uy';
  public baseUrl = 'https://inmuebles.mercadolibre.com.uy';
  public capability = 'PUBLIC_HTML' as const;
  public rateLimitPerMinute = 60;

  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  public async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      await this.throttle();
      const res = await fetch(`${this.baseUrl}/apartamentos/`, {
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
        message: res.ok
          ? 'Mercado Libre Inmuebles HTML accesible'
          : `HTTP ${res.status}: Requiere autorización o client_id para API estructurada`,
        testedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        sourceCode: this.sourceCode,
        healthy: false,
        status: 'ERROR',
        responseTimeMs: Date.now() - startTime,
        capability: this.capability,
        message: `Error de conexión: ${err.message}`,
        testedAt: new Date().toISOString(),
      };
    }
  }

  public async discoverListings(options?: DiscoverOptions): Promise<RawListingPayload[]> {
    const limit = options?.limit || 20;
    const discovered: RawListingPayload[] = [];

    // Mercado Libre público HTML / cards
    try {
      await this.throttle();
      const url = `${this.baseUrl}/apartamentos/venta/montevideo/`;
      const res = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) return discovered;
      const html = await res.text();

      // Extraer items mediante regex de bloques HTML estructurados
      const itemRegex = /<li\s+class="ui-search-layout__item[^>]*>([\s\S]*?)<\/li>/gi;
      let match;
      while ((match = itemRegex.exec(html)) !== null && discovered.length < limit) {
        const itemHtml = match[1];
        const titleMatch = itemHtml.match(/class="poly-component__title"[^>]*>([^<]+)<\/a>/i) || itemHtml.match(/aria-label="([^"]+)"/i);
        const linkMatch = itemHtml.match(/href="([^"]+)"/i);
        const priceMatch = itemHtml.match(/class="andes-money-amount__fraction"[^>]*>([^<]+)<\/span>/i);
        const currencyMatch = itemHtml.match(/class="andes-money-amount__currency-symbol"[^>]*>([^<]+)<\/span>/i);

        if (titleMatch && linkMatch) {
          const title = titleMatch[1].trim();
          const rawUrl = linkMatch[1].split('?')[0];
          const idMatch = rawUrl.match(/MLU[-_]?(\d+)/i);
          const rawId = idMatch ? `MLU${idMatch[1]}` : `meli_${Date.now()}_${discovered.length}`;

          const priceStr = priceMatch ? priceMatch[1].replace(/\./g, '') : null;
          const price = priceStr ? parseFloat(priceStr) : null;
          const currSymbol = currencyMatch ? currencyMatch[1].trim() : 'U$S';

          const payload: RawListingPayload = {
            sourceCode: this.sourceCode,
            sourceListingId: rawId,
            sourceListingKey: `meli_${rawId}`,
            originalUrl: rawUrl,
            canonicalUrl: rawUrl,
            titleRaw: title,
            currentPriceRaw: price,
            currencyRaw: currSymbol.includes('$') && !currSymbol.includes('U') ? 'UYU' : 'USD',
            departmentRaw: 'Montevideo',
            propertyTypeRaw: 'Apartamento',
            operationTypeRaw: 'Venta',
            mediaRaw: [],
          };
          payload.contentHash = this.computeContentHash(payload);
          discovered.push(payload);
        }
      }
    } catch (err) {
      console.warn('[MercadoLibreAdapter] Warning al descubrir listados:', err);
    }

    return discovered;
  }

  public async fetchListing(sourceListingId: string): Promise<RawListingPayload | null> {
    const url = `https://articulo.mercadolibre.com.uy/${sourceListingId}`;
    try {
      await this.throttle();
      const res = await fetch(url, {
        headers: { 'User-Agent': this.userAgent },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return null;
      const html = await res.text();
      const titleMatch = html.match(/<h1[^>]*class="ui-pdp-title"[^>]*>([^<]+)<\/h1>/i);
      const title = titleMatch ? titleMatch[1].trim() : `Publicación ${sourceListingId}`;

      const payload: RawListingPayload = {
        sourceCode: this.sourceCode,
        sourceListingId,
        sourceListingKey: `meli_${sourceListingId}`,
        originalUrl: url,
        titleRaw: title,
        propertyTypeRaw: 'Apartamento',
        operationTypeRaw: 'Venta',
      };
      payload.contentHash = this.computeContentHash(payload);
      return payload;
    } catch {
      return null;
    }
  }
}
