// ==============================================================================
// HIPOTECALY TASADOR IA - ADAPTADOR INFOCASAS URUGUAY
// Extracción de Datos Estructurados (Next.js Hydration & Endpoints Públicos)
// Capability: PUBLIC_STRUCTURED_ENDPOINT / PUBLIC_HTML
// ==============================================================================

import { BaseSourceAdapter, DiscoverOptions } from './SourceAdapter';
import {
  RawListingPayload,
  RawMediaItem,
  HealthCheckResult,
} from '../types/tasadorPipelineTypes';

export class InfoCasasAdapter extends BaseSourceAdapter {
  public sourceCode = 'infocasas';
  public sourceName = 'InfoCasas';
  public domain = 'infocasas.com.uy';
  public baseUrl = 'https://www.infocasas.com.uy';
  public capability = 'PUBLIC_STRUCTURED_ENDPOINT' as const;
  public rateLimitPerMinute = 60;

  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 HipotecalyDataBot/1.0';

  public async healthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      await this.throttle();
      const res = await fetch(`${this.baseUrl}/venta/inmuebles/montevideo`, {
        headers: { 'User-Agent': this.userAgent },
        signal: AbortSignal.timeout(10000),
      });
      const responseTimeMs = Date.now() - startTime;
      const html = await res.text();
      const hasNextData = html.includes('__NEXT_DATA__');

      return {
        sourceCode: this.sourceCode,
        healthy: res.ok && hasNextData,
        status: res.status,
        responseTimeMs,
        capability: this.capability,
        message: hasNextData ? 'InfoCasas structured endpoint operativo' : 'HTML recibido sin bloque __NEXT_DATA__',
        testedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        sourceCode: this.sourceCode,
        healthy: false,
        status: 'ERROR',
        responseTimeMs: Date.now() - startTime,
        capability: this.capability,
        message: `Fallo de conexión con InfoCasas: ${err.message}`,
        testedAt: new Date().toISOString(),
      };
    }
  }

  public async discoverListings(options?: DiscoverOptions): Promise<RawListingPayload[]> {
    const limit = options?.limit || 50;
    const targetDept = (options?.department || 'montevideo').toLowerCase();
    const urlsToFetch = [
      `${this.baseUrl}/venta/inmuebles/${targetDept}`,
      `${this.baseUrl}/venta/inmuebles/${targetDept}/pagina2`,
      `${this.baseUrl}/venta/inmuebles/${targetDept}/pagina3`,
      `${this.baseUrl}/venta/apartamentos/${targetDept}`,
      `${this.baseUrl}/venta/apartamentos/${targetDept}/pagina2`,
      `${this.baseUrl}/venta/casas/${targetDept}`,
      `${this.baseUrl}/venta/inmuebles/maldonado`,
      `${this.baseUrl}/venta/inmuebles/maldonado/pagina2`,
      `${this.baseUrl}/venta/inmuebles/canelones`,
      `${this.baseUrl}/venta/inmuebles/canelones/pagina2`,
    ];

    const discovered: RawListingPayload[] = [];
    const seenIds = new Set<string>();

    for (const url of urlsToFetch) {
      if (discovered.length >= limit) break;

      try {
        await this.throttle();
        const res = await fetch(url, {
          headers: {
            'User-Agent': this.userAgent,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          signal: AbortSignal.timeout(12000),
        });

        if (!res.ok) continue;

        const html = await res.text();
        const nextMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
        if (!nextMatch) continue;

        const nextData = JSON.parse(nextMatch[1]);
        const pageProps = nextData.props?.pageProps;
        const searchFast = pageProps?.fetchResult?.searchFast;
        const rawList = searchFast?.data || searchFast?.properties || searchFast?.results || [];

        for (const item of rawList) {
          if (discovered.length >= limit) break;

          const rawId = String(item.id || item.legacy_propID || item.code || '');
          if (!rawId || seenIds.has(rawId)) continue;
          seenIds.add(rawId);

          const payload = this.mapInfoCasasItem(item);
          discovered.push(payload);

          // Si el item tiene unidades comerciales hijas (proyectos de desarrollo)
          if (Array.isArray(item.commercial_units)) {
            for (const subUnit of item.commercial_units) {
              if (discovered.length >= limit) break;
              const subId = String(subUnit.id || subUnit.code || '');
              if (!subId || seenIds.has(subId)) continue;
              seenIds.add(subId);

              const subPayload = this.mapInfoCasasSubUnit(subUnit, item);
              discovered.push(subPayload);
            }
          }
        }
      } catch (err) {
        // Registrar error sin tumbar todo el descubrimiento
        console.warn(`[InfoCasasAdapter] Warning en URL ${url}:`, err);
      }
    }

    return discovered;
  }

  public async fetchListing(sourceListingId: string): Promise<RawListingPayload | null> {
    const directUrl = `${this.baseUrl}/propiedad/${sourceListingId}`;
    try {
      await this.throttle();
      const res = await fetch(directUrl, {
        headers: { 'User-Agent': this.userAgent },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) return null;
      const html = await res.text();
      const nextMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (!nextMatch) return null;

      const nextData = JSON.parse(nextMatch[1]);
      const prop = nextData.props?.pageProps?.fetchResult?.property || nextData.props?.pageProps?.property;
      if (!prop) return null;

      return this.mapInfoCasasItem(prop);
    } catch {
      return null;
    }
  }

  private mapInfoCasasItem(item: any): RawListingPayload {
    const rawId = String(item.id || item.legacy_propID || item.code);
    const title = item.title || item.name || 'Propiedad en Venta';
    const description = item.notes || item.description || '';
    const originalUrl = item.link
      ? (item.link.startsWith('http') ? item.link : `${this.baseUrl}/${item.link.replace(/^\//, '')}`)
      : `${this.baseUrl}/propiedad/${rawId}`;

    // Precios
    const priceAmount = item.price?.amount || item.price_var?.amount || item.price_val || item.price || null;
    const currency = item.currency || item.price?.currency || 'USD';
    const expenses = item.commonExpenses?.amount || null;

    // Superficies
    const totalArea = item.m2 || item.surface || item.total_m2 || null;
    const builtArea = item.m2Living || item.m2Building || item.m2Covered || totalArea;
    const landArea = item.m2Terrain || null;

    // Ubicación
    const department = item.estate?.name || item.estate_name || 'Montevideo';
    const neighborhood = item.neighborhood?.name || item.neighborhood_name || null;
    const street = item.street || item.address || null;
    const streetNumber = item.street_number || null;
    const lat = item.lat ? parseFloat(item.lat) : null;
    const lng = item.lng ? parseFloat(item.lng) : null;

    // Medios
    const mediaRaw: RawMediaItem[] = [];
    if (Array.isArray(item.images)) {
      item.images.forEach((img: any, idx: number) => {
        const url = img.image || img.url || (typeof img === 'string' ? img : null);
        if (url) {
          mediaRaw.push({
            sourceUrl: url,
            mediaType: 'IMAGE',
            position: idx,
            sha256Hash: this.computeContentHash(url),
          });
        }
      });
    }

    // Amenities
    const amenitiesRaw: Record<string, boolean> = {};
    if (item.pool || item.piscina) amenitiesRaw['pool'] = true;
    if (item.barbecue || item.parrillero || item.bbq) amenitiesRaw['barbecue'] = true;
    if (item.garage || item.hasGarage) amenitiesRaw['garage'] = true;
    if (item.seaview) amenitiesRaw['seaView'] = true;
    if (item.penthouse) amenitiesRaw['terrace'] = true;

    if (Array.isArray(item.facilities)) {
      item.facilities.forEach((f: any) => {
        const name = typeof f === 'string' ? f : (f.name || f.title);
        if (name) amenitiesRaw[name] = true;
      });
    }

    // Inmobiliaria / Agente
    const agencyName = item.inmobiliaria?.name || item.company?.name || item.agency || null;
    const agentPhone = item.phone || item.inmobiliaria?.phone || null;

    const payload: RawListingPayload = {
      sourceCode: this.sourceCode,
      sourceListingId: rawId,
      sourceListingKey: `infocasas_${rawId}`,
      originalUrl,
      canonicalUrl: originalUrl,
      titleRaw: title,
      descriptionRaw: description,
      currentPriceRaw: typeof priceAmount === 'number' ? priceAmount : parseFloat(priceAmount) || null,
      currencyRaw: currency,
      expensesRaw: typeof expenses === 'number' ? expenses : parseFloat(expenses) || null,
      departmentRaw: department,
      neighborhoodRaw: neighborhood,
      streetNameRaw: street,
      streetNumberRaw: streetNumber,
      latitudeRaw: isNaN(lat as number) ? null : lat,
      longitudeRaw: isNaN(lng as number) ? null : lng,
      propertyTypeRaw: item.property_type?.name || item.prop_type || 'Apartamento',
      operationTypeRaw: item.operation_type?.name || 'Venta',
      totalAreaM2Raw: typeof totalArea === 'number' ? totalArea : parseFloat(totalArea) || null,
      builtAreaM2Raw: typeof builtArea === 'number' ? builtArea : parseFloat(builtArea) || null,
      landAreaM2Raw: typeof landArea === 'number' ? landArea : parseFloat(landArea) || null,
      bedroomsRaw: item.bedrooms !== undefined ? parseInt(item.bedrooms, 10) : null,
      bathroomsRaw: item.bathrooms !== undefined ? parseInt(item.bathrooms, 10) : null,
      garagesRaw: item.garage !== undefined ? parseInt(item.garage, 10) : null,
      agencyNameRaw: agencyName,
      agentPhoneRaw: agentPhone,
      amenitiesRaw,
      mediaRaw,
      sourcePublishedAt: item.date || item.creation_date || null,
      sourceUpdatedAt: item.modification_date || null,
      rawJson: item,
    };

    payload.contentHash = this.computeContentHash(payload);
    return payload;
  }

  private mapInfoCasasSubUnit(sub: any, parent: any): RawListingPayload {
    const rawId = String(sub.id || sub.code);
    const title = sub.title || `${parent.title || 'Unidad'} - ${sub.code || ''}`;
    const originalUrl = sub.link
      ? (sub.link.startsWith('http') ? sub.link : `${this.baseUrl}/${sub.link.replace(/^\//, '')}`)
      : parent.link
      ? `${this.baseUrl}/${parent.link.replace(/^\//, '')}`
      : `${this.baseUrl}/propiedad/${rawId}`;

    const price = sub.price?.amount || null;
    const currency = sub.price?.currency || parent.currency || 'USD';
    const totalArea = sub.m2 || sub.surface || null;

    const payload: RawListingPayload = {
      sourceCode: this.sourceCode,
      sourceListingId: rawId,
      sourceListingKey: `infocasas_${rawId}`,
      originalUrl,
      canonicalUrl: originalUrl,
      titleRaw: title,
      descriptionRaw: parent.notes || parent.description || '',
      currentPriceRaw: typeof price === 'number' ? price : parseFloat(price) || null,
      currencyRaw: currency,
      departmentRaw: parent.estate?.name || 'Montevideo',
      neighborhoodRaw: parent.neighborhood?.name || null,
      streetNameRaw: parent.street || null,
      latitudeRaw: parent.lat ? parseFloat(parent.lat) : null,
      longitudeRaw: parent.lng ? parseFloat(parent.lng) : null,
      propertyTypeRaw: sub.property_type?.name || parent.property_type?.name || 'Apartamento',
      operationTypeRaw: 'Venta',
      totalAreaM2Raw: typeof totalArea === 'number' ? totalArea : parseFloat(totalArea) || null,
      builtAreaM2Raw: typeof totalArea === 'number' ? totalArea : parseFloat(totalArea) || null,
      bedroomsRaw: sub.bedrooms !== undefined ? parseInt(sub.bedrooms, 10) : null,
      bathroomsRaw: sub.bathrooms !== undefined ? parseInt(sub.bathrooms, 10) : null,
      garagesRaw: parent.garage !== undefined ? parseInt(parent.garage, 10) : null,
      agencyNameRaw: parent.inmobiliaria?.name || null,
      mediaRaw: [],
      rawJson: sub,
    };

    payload.contentHash = this.computeContentHash(payload);
    return payload;
  }
}
