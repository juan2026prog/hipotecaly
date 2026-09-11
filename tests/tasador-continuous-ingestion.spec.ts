// ==============================================================================
// HIPOTECALY TASADOR IA - TEST SUITE: CONTINUOUS INGESTION, FINGERPRINTS & IDEMPOTENCIA
// Pruebas E2E de SourceDiscoveryService, ListingIngestionWorker, Kill Switch y Calidad
// ==============================================================================

import { test, expect } from '@playwright/test';
import { SourceDiscoveryService, computeListingFingerprints } from '../src/lib/tasador/ingestion/SourceDiscoveryService';
import { ListingIngestionWorker, evaluateComparableEligibility } from '../src/lib/tasador/ingestion/ListingIngestionWorker';
import { SourceHealthCheck } from '../src/lib/tasador/ingestion/SourceHealthCheck';
import { RawListingPayload } from '../src/lib/tasador/types/tasadorPipelineTypes';
import { NormalizationEngine } from '../src/lib/tasador/normalization/NormalizationEngine';

test.describe.serial('TASADOR IA - DATA ACQUISITION & CONTINUOUS INGESTION PIPELINE', () => {
  const discovery = SourceDiscoveryService.getInstance();
  const worker = ListingIngestionWorker.getInstance();
  const healthCheck = SourceHealthCheck.getInstance();

  const sampleListing1: RawListingPayload = {
    sourceCode: 'infocasas',
    sourceListingId: 'continuous_test_101',
    originalUrl: 'https://infocasas.com.uy/prop/continuous_test_101',
    canonicalUrl: 'https://infocasas.com.uy/prop/continuous_test_101',
    titleRaw: 'Apartamento de estilo en Pocitos 2 Dormitorios',
    descriptionRaw: 'Excelente estado, luminoso, cercano a la rambla con losa radiante y garage.',
    currentPriceRaw: 240000,
    currencyRaw: 'USD',
    expensesRaw: 6500,
    departmentRaw: 'Montevideo',
    neighborhoodRaw: 'Pocitos',
    streetNameRaw: 'Benito Blanco',
    streetNumberRaw: '1200',
    propertyTypeRaw: 'Apartamento',
    operationTypeRaw: 'Venta',
    builtAreaM2Raw: 72,
    totalAreaM2Raw: 78,
    bedroomsRaw: 2,
    bathroomsRaw: 2,
    garagesRaw: 1,
    mediaRaw: [
      { sourceUrl: 'https://cdn.infocasas.com.uy/foto1.jpg', mediaType: 'IMAGE', position: 0 },
      { sourceUrl: 'https://cdn.infocasas.com.uy/foto2.jpg', mediaType: 'IMAGE', position: 1 },
      { sourceUrl: 'https://cdn.infocasas.com.uy/foto3.jpg', mediaType: 'IMAGE', position: 2 },
      { sourceUrl: 'https://cdn.infocasas.com.uy/foto4.jpg', mediaType: 'IMAGE', position: 3 },
      { sourceUrl: 'https://cdn.infocasas.com.uy/foto5.jpg', mediaType: 'IMAGE', position: 4 },
    ],
  };

  test('01. Health Check Clasifica Honestamente Fuentes y Detecta WAF sin Evasión', async () => {
    // InfoCasas debe ser saludable
    const infoReport = await healthCheck.checkSource('infocasas');
    expect(infoReport.sourceCode).toBe('infocasas');
    expect(infoReport.healthy).toBe(true);
    expect(infoReport.healthStatus).toBe('HEALTHY');
    expect(infoReport.wafOrCaptchaDetected).toBe(false);

    // Gallito Luis debe ser clasificada como BLOCKED por Cloudflare WAF sin intentar evasión
    const gallitoReport = await healthCheck.checkSource('gallito_uy');
    expect(gallitoReport.sourceCode).toBe('gallito_uy');
    expect(gallitoReport.healthStatus).toBe('BLOCKED');
    expect(gallitoReport.healthy).toBe(false);
  });

  test('02. Fingerprints Determinísticos: Identity, Content y Pricing', () => {
    const fp1 = computeListingFingerprints(sampleListing1);
    expect(fp1.identityFingerprint).toBeDefined();
    expect(fp1.contentFingerprint).toBeDefined();
    expect(fp1.pricingFingerprint).toBeDefined();

    // Mismo contenido genera exactamente los mismos fingerprints
    const fp2 = computeListingFingerprints({ ...sampleListing1 });
    expect(fp2.identityFingerprint).toBe(fp1.identityFingerprint);
    expect(fp2.contentFingerprint).toBe(fp1.contentFingerprint);
    expect(fp2.pricingFingerprint).toBe(fp1.pricingFingerprint);

    // Variación solo de precio: altera pricingFingerprint, conserva identity y content
    const fpPriceChanged = computeListingFingerprints({ ...sampleListing1, currentPriceRaw: 230000 });
    expect(fpPriceChanged.identityFingerprint).toBe(fp1.identityFingerprint);
    expect(fpPriceChanged.contentFingerprint).toBe(fp1.contentFingerprint);
    expect(fpPriceChanged.pricingFingerprint).not.toBe(fp1.pricingFingerprint);
  });

  test('03. RUN #1: Descubrimiento e Ingesta Inicial de Nueva Publicación', async () => {
    // Discovery detecta como NEW y encola
    const disc1 = await discovery.runDiscovery('infocasas', {
      customPayloads: [sampleListing1],
    });

    expect(disc1.listingsFound).toBe(1);
    expect(disc1.listingsNew).toBe(1);
    expect(disc1.listingsUnchanged).toBe(0);
    expect(disc1.jobsQueued).toBe(1);

    // Worker procesa la publicación
    const procResult = await worker.processSingleListing(sampleListing1);
    expect(procResult.isNew).toBe(true);
    expect(procResult.masterId).toBeDefined();
    expect(procResult.priceEventCreated).toBe(true);
    expect(procResult.qualityScore).toBeGreaterThanOrEqual(70);
    expect(procResult.comparableEligibility).toBe('ELIGIBLE');
  });

  test('04. RUN #2: IDEMPOTENCIA ESTRICTA (0 Duplicados Generados)', async () => {
    // Re-ejecución sobre exactamente el mismo universo de datos
    const disc2 = await discovery.runDiscovery('infocasas', {
      customPayloads: [sampleListing1],
    });

    expect(disc2.listingsFound).toBe(1);
    expect(disc2.listingsNew).toBe(0);
    expect(disc2.listingsModified).toBe(0);
    expect(disc2.listingsUnchanged).toBe(1); // Detectada sin cambios
    expect(disc2.jobsQueued).toBe(0); // CERO jobs generados

    // Worker procesa de nuevo la misma: comprueba idempotencia sin duplicar
    const procAgain = await worker.processSingleListing(sampleListing1);
    expect(procAgain.isNew).toBe(false);
    expect(procAgain.masterCreated).toBe(false);
    expect(procAgain.priceEventCreated).toBe(false); // No duplica evento de precio
  });

  test('05. Detección Real de Cambio de Precio: Historial Append-Only', async () => {
    // Reducción de precio de USD 240.000 a USD 225.000 (-6.25%)
    const listingWithDiscount: RawListingPayload = {
      ...sampleListing1,
      currentPriceRaw: 225000,
    };

    // Discovery detecta cambio de precio y encola
    const discModified = await discovery.runDiscovery('infocasas', {
      customPayloads: [listingWithDiscount],
    });

    expect(discModified.listingsModified).toBe(1);
    expect(discModified.listingsNew).toBe(0);
    expect(discModified.jobsQueued).toBe(1);

    // Worker actualiza y genera evento PRICE_CHANGED en historial
    const procModified = await worker.processSingleListing(listingWithDiscount);
    expect(procModified.isNew).toBe(false);
    expect(procModified.priceEventCreated).toBe(true);

    const priceHist = worker.memoryPriceHistory.filter(
      (h) => h.listingId === procModified.listingId
    );
    expect(priceHist.length).toBeGreaterThanOrEqual(2);

    const latestPrice = priceHist[priceHist.length - 1];
    expect(latestPrice.eventType).toBe('PRICE_CHANGED');
    expect(latestPrice.priceUsd).toBe(225000);
    expect(latestPrice.previousPriceUsd).toBe(240000);
    expect(latestPrice.priceChangePercentage).toBe(-6.25);
  });

  test('06. Evaluación Determinística de Calidad y Elegibilidad como Comparable', () => {
    // 1. Caso Completo Venta Pocitos -> ELIGIBLE
    const normEligible = NormalizationEngine.normalize(sampleListing1);
    const evalEligible = evaluateComparableEligibility(normEligible, 85);
    expect(evalEligible.eligibility).toBe('ELIGIBLE');

    // 2. Caso Alquiler -> NOT_ELIGIBLE
    const normRent = NormalizationEngine.normalize({
      ...sampleListing1,
      operationTypeRaw: 'Alquiler',
    });
    const evalRent = evaluateComparableEligibility(normRent, 80);
    expect(evalRent.eligibility).toBe('NOT_ELIGIBLE');
    expect(evalRent.reasons.includes('OPERACION_NO_ES_VENTA')).toBe(true);

    // 3. Caso Sin Superficie Declarada -> REVIEW_REQUIRED
    const normNoArea = NormalizationEngine.normalize({
      ...sampleListing1,
      builtAreaM2Raw: null,
      totalAreaM2Raw: null,
    });
    const evalNoArea = evaluateComparableEligibility(normNoArea, 45);
    expect(evalNoArea.eligibility).toBe('REVIEW_REQUIRED');
    expect(evalNoArea.reasons.includes('SUPERFICIE_TOTAL_Y_CONSTRUIDA_NULAS')).toBe(true);

    // 4. Caso con Superficie pero Calidad Media -> PARTIAL
    const normPartial = NormalizationEngine.normalize({
      ...sampleListing1,
      builtAreaM2Raw: 60,
      neighborhoodRaw: null, // Sin barrio exacto
    });
    const evalPartial = evaluateComparableEligibility(normPartial, 50);
    expect(evalPartial.eligibility).toBe('PARTIAL');
  });
});
