// ==============================================================================
// HIPOTECALY TASADOR IA - SUITE DE PRUEBAS DE INGESTA E IDEMPOTENCIA
// Snapshots Inmutables, Historial de Precios Append-Only y Deduplicación de Medios
// ==============================================================================

import { test, expect } from '@playwright/test';
import { IngestionEngine } from '../src/lib/tasador/crawler/IngestionEngine';
import { PriceHistoryTracker } from '../src/lib/tasador/price_history/PriceHistoryTracker';
import { RawListingPayload } from '../src/lib/tasador/types/tasadorPipelineTypes';
import { NormalizationEngine } from '../src/lib/tasador/normalization/NormalizationEngine';

test.describe.serial('TASADOR IA - INGESTA, IDEMPOTENCIA Y PRECIOS HISTÓRICOS', () => {

  test.beforeAll(() => {
    IngestionEngine.getInstance().resetState();
  });

  const samplePayload: RawListingPayload = {
    sourceCode: 'infocasas',
    sourceListingId: 'idem_test_01',
    originalUrl: 'https://infocasas.com.uy/prop/idem_test_01',
    titleRaw: 'Apartamento con terraza en Punta Carretas',
    currentPriceRaw: 280000,
    currencyRaw: 'USD',
    departmentRaw: 'Montevideo',
    neighborhoodRaw: 'Punta Carretas',
    streetNameRaw: 'Calle Ellauri',
    streetNumberRaw: '500',
    totalAreaM2Raw: 95,
    builtAreaM2Raw: 85,
    bedroomsRaw: 2,
    bathroomsRaw: 2,
    mediaRaw: [
      { sourceUrl: 'https://cdn.infocasas.com.uy/img1.jpg', mediaType: 'IMAGE', position: 0, sha256Hash: 'hash_1' },
      { sourceUrl: 'https://cdn.infocasas.com.uy/img2.jpg', mediaType: 'IMAGE', position: 1, sha256Hash: 'hash_2' },
    ],
  };

  test('Req 01: Primera ingesta genera snapshot, Master, medios y evento FIRST_SEEN', async () => {
    const engine = IngestionEngine.getInstance();
    const result1 = await engine.executeRun('infocasas', {
      customPayloads: [samplePayload],
    });

    expect(result1.listingsDiscovered).toBe(1);
    expect(result1.listingsNew).toBe(1);
    expect(result1.listingsUnchanged).toBe(0);
    expect(result1.priceEventsCreated).toBe(1);
    expect(result1.mediaDiscovered).toBe(2);

    const snapshot = engine.snapshots.get('infocasas_idem_test_01');
    expect(snapshot).toBeDefined();
    expect(snapshot?.contentHash).toBeDefined();
  });

  test('Req 02: Re-ejecución exacta sin cambios no duplica listings, masters ni precios (Idempotencia)', async () => {
    const engine = IngestionEngine.getInstance();
    const result2 = await engine.executeRun('infocasas', {
      customPayloads: [samplePayload],
    });

    expect(result2.listingsDiscovered).toBe(1);
    expect(result2.listingsNew).toBe(0);
    expect(result2.listingsUnchanged).toBe(1);
    expect(result2.priceEventsCreated).toBe(0);
    expect(result2.mediaDiscovered).toBe(0);
  });

  test('Req 03: Cambio de precio genera evento PRICE_CHANGED append-only con porcentaje de cambio', () => {
    const tracker = new PriceHistoryTracker();
    const listingInitial = NormalizationEngine.normalize(samplePayload);

    // Primer evento: FIRST_SEEN
    const ev1 = tracker.trackPrice(listingInitial, 'master_1', 'snp_1');
    expect(ev1).not.toBeNull();
    expect(ev1?.eventType).toBe('FIRST_SEEN');
    expect(ev1?.priceUsd).toBe(280000);
    expect(ev1?.previousPriceUsd).toBeNull();

    // Consulta idéntica: debe retornar null (no duplicar)
    const evDuplicate = tracker.trackPrice(listingInitial, 'master_1', 'snp_1');
    expect(evDuplicate).toBeNull();

    // Cambio de precio a USD 260.000 (-7.14%)
    const listingModified = NormalizationEngine.normalize({
      ...samplePayload,
      currentPriceRaw: 260000,
    });
    const ev2 = tracker.trackPrice(listingModified, 'master_1', 'snp_2');
    expect(ev2).not.toBeNull();
    expect(ev2?.eventType).toBe('PRICE_CHANGED');
    expect(ev2?.priceUsd).toBe(260000);
    expect(ev2?.previousPriceUsd).toBe(280000);
    expect(ev2?.priceChangePercentage).toBe(-7.14);

    const history = tracker.getAllHistory();
    expect(history.length).toBe(2);
  });
});
