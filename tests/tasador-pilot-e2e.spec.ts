// ==============================================================================
// HIPOTECALY TASADOR IA - SUITE DE PRUEBAS END-TO-END PILOTO REAL (FASE 1 + 2)
// Ingesta Real de >= 100 Publicaciones de Uruguay, Trazabilidad e Idempotencia
// ==============================================================================

import { test, expect } from '@playwright/test';
import { IngestionEngine } from '../src/lib/tasador/crawler/IngestionEngine';
import { DataQualityEngine } from '../src/lib/tasador/quality/DataQualityEngine';

test.describe.serial('TASADOR IA - PRUEBA PILOTO REAL END-TO-END (FASE 1 + 2)', () => {
  // Test con timeout extendido para peticiones de red reales
  test.setTimeout(60000);

  test.beforeAll(() => {
    IngestionEngine.getInstance().resetState();
  });

  test('Req 01: Ingesta real de >= 100 publicaciones uruguayas y resolución de Property Masters', async () => {
    const engine = IngestionEngine.getInstance();

    const runResult = await engine.executeRun('infocasas', {
      limit: 120,
      department: 'montevideo',
      runType: 'DISCOVERY',
    });

    expect(runResult.status).toBe('COMPLETED');
    expect(runResult.listingsDiscovered).toBeGreaterThanOrEqual(100);
    expect(runResult.propertyMastersResolved).toBeGreaterThanOrEqual(20);
    expect(runResult.mediaDiscovered).toBeGreaterThanOrEqual(100);
    expect(runResult.priceEventsCreated).toBeGreaterThanOrEqual(100);

    // Verificación de Snapshots
    expect(engine.snapshots.size).toBeGreaterThanOrEqual(100);

    // Verificación de Normalización y Calidad
    const allListings = Array.from(engine.normalizedListings.values());
    expect(allListings.length).toBeGreaterThanOrEqual(100);

    const first = allListings[0];
    expect(first.department).toBeDefined();
    expect(first.priceUsd).toBeGreaterThan(0);
    expect(first.operationType).toBe('SALE');

    const quality = DataQualityEngine.evaluate(first);
    expect(quality.qualityScore).toBeGreaterThan(0);
    expect(quality.qualityScore).toBeLessThanOrEqual(100);

    // Verificación de Evidencia de Campos
    const evidenceList = engine.evidenceTracker.getEvidenceForListing(first.sourceListingKey || first.sourceListingId);
    expect(evidenceList.length).toBeGreaterThanOrEqual(4);
  });

  test('Req 02: Idempotencia estricta en re-ejecución sobre publicaciones existentes', async () => {
    const engine = IngestionEngine.getInstance();

    const secondRun = await engine.executeRun('infocasas', {
      limit: 120,
      department: 'montevideo',
      runType: 'REFRESH',
    });

    expect(secondRun.status).toBe('COMPLETED');
    expect(secondRun.listingsNew).toBe(0);
    expect(secondRun.listingsUnchanged).toBeGreaterThanOrEqual(100);
    expect(secondRun.priceEventsCreated).toBe(0);
  });
});
