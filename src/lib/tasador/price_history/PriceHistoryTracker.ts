// ==============================================================================
// HIPOTECALY TASADOR IA - HISTORIAL INMUTABLE APPEND-ONLY DE PRECIOS
// Registro de Eventos FIRST_SEEN, PRICE_CHANGED, CURRENCY_CHANGED sin Falsos Positivos
// ==============================================================================

import { NormalizedListing, PriceEventType } from '../types/tasadorPipelineTypes';

export interface PriceHistoryRecord {
  id: string;
  listingId: string;
  propertyMasterId?: string | null;
  priceAmount: number;
  currency: string;
  priceUsd: number;
  priceUyu: number | null;
  pricePerM2Usd: number | null;
  previousPriceUsd: number | null;
  priceChangePercentage: number | null;
  eventType: PriceEventType;
  sourceSnapshotId?: string | null;
  observedAt: string;
  recordedAt: string;
}

export class PriceHistoryTracker {
  private history: PriceHistoryRecord[] = [];
  private lastKnownPriceMap: Map<string, { priceUsd: number; currency: string }> = new Map();

  public trackPrice(
    listing: NormalizedListing,
    masterId?: string | null,
    snapshotId?: string | null
  ): PriceHistoryRecord | null {
    const listingKey = listing.sourceListingKey || `${listing.sourceCode}_${listing.sourceListingId}`;
    const now = new Date().toISOString();
    const lastKnown = this.lastKnownPriceMap.get(listingKey);

    let eventType: PriceEventType = 'OBSERVED';
    let previousPriceUsd: number | null = null;
    let changePct: number | null = null;

    if (!lastKnown) {
      eventType = 'FIRST_SEEN';
    } else if (lastKnown.priceUsd !== listing.priceUsd) {
      eventType = 'PRICE_CHANGED';
      previousPriceUsd = lastKnown.priceUsd;
      if (previousPriceUsd > 0) {
        changePct = Math.round(((listing.priceUsd - previousPriceUsd) / previousPriceUsd) * 10000) / 100;
      }
    } else if (lastKnown.currency !== listing.currentCurrency) {
      eventType = 'CURRENCY_CHANGED';
    } else {
      // Precio sin cambios: no registrar duplicado en historial
      return null;
    }

    const recordId = `ph_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record: PriceHistoryRecord = {
      id: recordId,
      listingId: listingKey,
      propertyMasterId: masterId || null,
      priceAmount: listing.currentPrice,
      currency: listing.currentCurrency,
      priceUsd: listing.priceUsd,
      priceUyu: listing.priceUyu ?? null,
      pricePerM2Usd: listing.pricePerM2Usd ?? null,
      previousPriceUsd,
      priceChangePercentage: changePct,
      eventType,
      sourceSnapshotId: snapshotId || null,
      observedAt: now,
      recordedAt: now,
    };

    this.history.push(record);
    this.lastKnownPriceMap.set(listingKey, {
      priceUsd: listing.priceUsd,
      currency: listing.currentCurrency,
    });

    return record;
  }

  public getHistoryForListing(listingId: string): PriceHistoryRecord[] {
    return this.history.filter((h) => h.listingId === listingId);
  }

  public getAllHistory(): PriceHistoryRecord[] {
    return this.history;
  }
}
