// ==============================================================================
// HIPOTECALY TASADOR IA - SUITE DE PRUEBAS DE COMPARABLES Y FILTROS (FASE 3)
// Regla del 12%, Jerarquía de Precios, Deduplicación de Masters y Outliers IQR
// ==============================================================================

import { test, expect } from '@playwright/test';
import { ComparableCandidateFinder } from '../src/lib/tasador/valuation/ComparableCandidateFinder';
import { ComparableScoringEngine } from '../src/lib/tasador/valuation/ComparableScoringEngine';
import { ComparableOutlierFilter } from '../src/lib/tasador/valuation/ComparableOutlierFilter';
import { DEFAULT_APPRAISAL_SETTINGS_V1 } from '../src/lib/tasador/valuation/AppraisalSettingsManager';
import { TargetPropertyInput } from '../src/lib/tasador/valuation/valuationTypes';
import { NormalizedListing } from '../src/lib/tasador/types/tasadorPipelineTypes';

test.describe.serial('TASADOR IA - FILTROS DE COMPARABLES Y REGLA DEL 12% (FASE 3)', () => {

  const targetApartment: TargetPropertyInput = {
    propertyType: 'APARTMENT',
    department: 'Montevideo',
    neighborhood: 'Pocitos',
    builtAreaM2: 70,
    totalAreaM2: 75,
    bedrooms: 2,
    bathrooms: 1,
    garages: 1,
    latitude: -34.915,
    longitude: -56.148,
  };

  const sampleListings: NormalizedListing[] = [
    {
      sourceListingId: 'infocasas_01',
      sourceCode: 'infocasas',
      propertyMasterId: 'master_pocitos_101',
      title: 'Apto 2 dorm en Pocitos',
      operationType: 'SALE',
      propertyType: 'APARTMENT',
      department: 'Montevideo',
      neighborhood: 'Pocitos',
      priceUsd: 200000,
      priceUyu: 8100000,
      currentCurrency: 'USD',
      builtAreaM2: 70,
      totalAreaM2: 75,
      bedrooms: 2,
      bathrooms: 1,
      garages: 1,
      latitude: -34.9152,
      longitude: -56.1482,
      dataQualityScore: 90,
      publicationDate: new Date().toISOString(),
      amenities: {},
    },
    // Misma propiedad publicada en MercadoLibre (debe deduplicarse por master_pocitos_101)
    {
      sourceListingId: 'meli_01',
      sourceCode: 'mercadolibre_uy',
      propertyMasterId: 'master_pocitos_101',
      title: 'Apartamento Pocitos 2 dormitorios impecable',
      operationType: 'SALE',
      propertyType: 'APARTMENT',
      department: 'Montevideo',
      neighborhood: 'Pocitos',
      priceUsd: 200000,
      priceUyu: 8100000,
      currentCurrency: 'USD',
      builtAreaM2: 70,
      totalAreaM2: 75,
      bedrooms: 2,
      bathrooms: 1,
      garages: 1,
      latitude: -34.9152,
      longitude: -56.1482,
      dataQualityScore: 85,
      publicationDate: new Date().toISOString(),
      amenities: {},
    },
    // Transacción real confirmada (sin descuento)
    {
      sourceListingId: 'tx_confirmed_01',
      sourceCode: 'catastro_transaccion',
      propertyMasterId: 'master_pocitos_tx_1',
      title: 'Transacción compraventa registrada',
      operationType: 'SALE',
      propertyType: 'APARTMENT',
      department: 'Montevideo',
      neighborhood: 'Pocitos',
      priceUsd: 190000,
      priceUyu: 7695000,
      currentCurrency: 'USD',
      builtAreaM2: 68,
      totalAreaM2: 72,
      bedrooms: 2,
      bathrooms: 1,
      garages: 1,
      latitude: -34.916,
      longitude: -56.149,
      dataQualityScore: 95,
      publicationDate: new Date().toISOString(),
      amenities: {},
    },
    // Alquiler (debe ser descartado)
    {
      sourceListingId: 'rent_01',
      sourceCode: 'infocasas',
      propertyMasterId: 'master_rent_1',
      title: 'Alquiler Pocitos',
      operationType: 'RENT',
      propertyType: 'APARTMENT',
      department: 'Montevideo',
      neighborhood: 'Pocitos',
      priceUsd: 1200,
      currentCurrency: 'USD',
      builtAreaM2: 70,
      bedrooms: 2,
      bathrooms: 1,
      dataQualityScore: 80,
      amenities: {},
    },
  ];

  test('Req 01: Regla del factor de oferta: asking_price_adjustment aplicado EXACTAMENTE UNA VEZ sobre asking prices (12% en V1 y 8.5% en V2)', () => {
    // 1. Verificación sobre V1 histórica (12.00%)
    const resultV1 = ComparableCandidateFinder.findCandidates(
      targetApartment,
      sampleListings,
      DEFAULT_APPRAISAL_SETTINGS_V1
    );

    const askingCompV1 = resultV1.candidates.find((c) => c.sourceCode === 'infocasas');
    expect(askingCompV1).toBeDefined();
    expect(askingCompV1?.rawAskingPriceUsd).toBe(200000);
    expect(askingCompV1?.isPriceAdjusted).toBe(true);
    expect(askingCompV1?.priceAdjustmentPercentage).toBe(12.0);
    // 200.000 * (1 - 0.12) = 176.000
    expect(askingCompV1?.effectivePriceUsd).toBe(176000);
    expect(askingCompV1?.priceEvidenceHierarchy).toBe('ADJUSTED_ASKING_PRICE');

    // 2. Verificación sobre V2 activa (8.50%)
    const resultV2 = ComparableCandidateFinder.findCandidates(
      targetApartment,
      sampleListings,
      {
        ...DEFAULT_APPRAISAL_SETTINGS_V1,
        version: 2,
        askingPriceAdjustment: 0.085,
      }
    );

    const askingCompV2 = resultV2.candidates.find((c) => c.sourceCode === 'infocasas');
    expect(askingCompV2).toBeDefined();
    expect(askingCompV2?.rawAskingPriceUsd).toBe(200000);
    expect(askingCompV2?.isPriceAdjusted).toBe(true);
    expect(askingCompV2?.priceAdjustmentPercentage).toBe(8.5);
    // 200.000 * (1 - 0.085) = 183.000
    expect(askingCompV2?.effectivePriceUsd).toBe(183000);
    expect(askingCompV2?.priceEvidenceHierarchy).toBe('ADJUSTED_ASKING_PRICE');
  });

  test('Req 02: Transacción real confirmada NO recibe 12% de descuento (precio intacto)', () => {
    const result = ComparableCandidateFinder.findCandidates(
      targetApartment,
      sampleListings,
      DEFAULT_APPRAISAL_SETTINGS_V1
    );

    const txComp = result.candidates.find((c) => c.sourceCode === 'catastro_transaccion');
    expect(txComp).toBeDefined();
    expect(txComp?.rawAskingPriceUsd).toBe(190000);
    expect(txComp?.isPriceAdjusted).toBe(false);
    expect(txComp?.priceAdjustmentPercentage).toBe(0);
    expect(txComp?.effectivePriceUsd).toBe(190000); // 100% intacto
    expect(txComp?.priceEvidenceHierarchy).toBe('CONFIRMED_TRANSACTION');
  });

  test('Req 03: Deduplicación de comparables: 1 Inmueble Físico = 1 Comparable (No duplicar por estar en N portales)', () => {
    const result = ComparableCandidateFinder.findCandidates(
      targetApartment,
      sampleListings,
      DEFAULT_APPRAISAL_SETTINGS_V1
    );

    // De 3 listings de venta (2 para master_pocitos_101 + 1 para master_pocitos_tx_1),
    // deben generarse exactamente 2 candidatos únicos
    expect(result.candidates.length).toBe(2);

    const master101Candidates = result.candidates.filter(
      (c) => c.propertyMasterId === 'master_pocitos_101'
    );
    expect(master101Candidates.length).toBe(1);
  });

  test('Req 04: Publicaciones de alquiler son estrictamente excluidas de comparables de venta', () => {
    const result = ComparableCandidateFinder.findCandidates(
      targetApartment,
      sampleListings,
      DEFAULT_APPRAISAL_SETTINGS_V1
    );

    const rentCandidates = result.candidates.filter((c) => c.sourceListingId === 'rent_01');
    expect(rentCandidates.length).toBe(0);
  });

  test('Req 05: Detección y aislamiento robusto de Outliers por IQR sin mover la mediana', () => {
    const candidateBase = {
      propertyType: 'APARTMENT' as const,
      department: 'Montevideo',
      neighborhood: 'Pocitos',
      builtAreaM2: 70,
      bedrooms: 2,
      bathrooms: 1,
      dataQualityScore: 90,
      daysSincePublication: 15,
      isPriceAdjusted: true,
      priceAdjustmentPercentage: 12.0,
      priceEvidenceHierarchy: 'ADJUSTED_ASKING_PRICE' as const,
      currency: 'USD',
    };

    // Precios normales en torno a $2.500 USD/m2
    const normalComps: any[] = [
      { id: '1', effectivePriceUsd: 175000, rawAskingPriceUsd: 200000, pricePerM2Usd: 2500, directlyAdjustedPriceUsd: 175000, ...candidateBase },
      { id: '2', effectivePriceUsd: 182000, rawAskingPriceUsd: 208000, pricePerM2Usd: 2600, directlyAdjustedPriceUsd: 182000, ...candidateBase },
      { id: '3', effectivePriceUsd: 168000, rawAskingPriceUsd: 192000, pricePerM2Usd: 2400, directlyAdjustedPriceUsd: 168000, ...candidateBase },
      { id: '4', effectivePriceUsd: 178000, rawAskingPriceUsd: 203000, pricePerM2Usd: 2550, directlyAdjustedPriceUsd: 178000, ...candidateBase },
      { id: '5', effectivePriceUsd: 172000, rawAskingPriceUsd: 196000, pricePerM2Usd: 2450, directlyAdjustedPriceUsd: 172000, ...candidateBase },
      // Outlier extremo absurdo ($15.000 USD/m2)
      { id: 'outlier_1', effectivePriceUsd: 1050000, rawAskingPriceUsd: 1200000, pricePerM2Usd: 15000, directlyAdjustedPriceUsd: 1050000, ...candidateBase },
    ];

    const outlierResult = ComparableOutlierFilter.filterOutliers(
      normalComps,
      DEFAULT_APPRAISAL_SETTINGS_V1
    );

    expect(outlierResult.excludedOutliers.length).toBe(1);
    expect(outlierResult.excludedOutliers[0].id).toBe('outlier_1');
    expect(outlierResult.acceptedComparables.length).toBe(5);
    expect(outlierResult.excludedOutliers[0].outlierReason).toContain('EXCLUDED_OUTLIER');
  });

  test('Req 06: Ampliación geográfica progresiva registrada con transparencia', () => {
    // Buscar en un barrio sin comparables (ej. 'Peñarol')
    const targetNoComps: TargetPropertyInput = {
      propertyType: 'APARTMENT',
      department: 'Montevideo',
      neighborhood: 'BarrioSinPropiedades',
      builtAreaM2: 70,
    };

    const result = ComparableCandidateFinder.findCandidates(
      targetNoComps,
      sampleListings,
      DEFAULT_APPRAISAL_SETTINGS_V1
    );

    // Debe haberse ampliado a nivel de Departamento
    expect(result.geographicLevel).toBe('DEPARTMENT');
    expect(result.reason).toContain('Ampliación');
    expect(result.candidates.length).toBeGreaterThan(0);
  });
});
