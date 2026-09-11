// ==============================================================================
// HIPOTECALY TASADOR IA - SUITE DE PRUEBAS DE VALUACIÓN DETERMINÍSTICA (FASE 3)
// Reproducibilidad Exacta, Rango, Valor Prudente, Confidence y Multi-Método
// ==============================================================================

import { test, expect } from '@playwright/test';
import { ValuationService } from '../src/lib/tasador/valuation/ValuationService';
import { TargetPropertyInput } from '../src/lib/tasador/valuation/valuationTypes';
import { NormalizedListing } from '../src/lib/tasador/types/tasadorPipelineTypes';
import { AppraisalSettingsManager } from '../src/lib/tasador/valuation/AppraisalSettingsManager';

test.describe.serial('TASADOR IA - VALUACIÓN DETERMINÍSTICA Y REPRODUCIBILIDAD (FASE 3)', () => {

  const targetProperty: TargetPropertyInput = {
    propertyType: 'APARTMENT',
    department: 'Montevideo',
    neighborhood: 'Punta Carretas',
    builtAreaM2: 85,
    totalAreaM2: 90,
    bedrooms: 2,
    bathrooms: 2,
    garages: 1,
    constructionYear: 2016,
  };

  const poolListings: NormalizedListing[] = [
    {
      sourceListingId: 'pc_01',
      sourceCode: 'infocasas',
      propertyMasterId: 'm_pc_01',
      title: 'Apto 2 dorm en Punta Carretas',
      operationType: 'SALE',
      propertyType: 'APARTMENT',
      department: 'Montevideo',
      neighborhood: 'Punta Carretas',
      priceUsd: 260000,
      builtAreaM2: 85,
      bedrooms: 2,
      bathrooms: 2,
      garages: 1,
      dataQualityScore: 92,
      publicationDate: new Date().toISOString(),
      amenities: {},
    },
    {
      sourceListingId: 'pc_02',
      sourceCode: 'mercadolibre_uy',
      propertyMasterId: 'm_pc_02',
      title: 'Punta Carretas impecable',
      operationType: 'SALE',
      propertyType: 'APARTMENT',
      department: 'Montevideo',
      neighborhood: 'Punta Carretas',
      priceUsd: 275000,
      builtAreaM2: 88,
      bedrooms: 2,
      bathrooms: 2,
      garages: 1,
      dataQualityScore: 88,
      publicationDate: new Date().toISOString(),
      amenities: {},
    },
    {
      sourceListingId: 'pc_03',
      sourceCode: 'remax_uy',
      propertyMasterId: 'm_pc_03',
      title: 'Moderno apto cerca del parque',
      operationType: 'SALE',
      propertyType: 'APARTMENT',
      department: 'Montevideo',
      neighborhood: 'Punta Carretas',
      priceUsd: 250000,
      builtAreaM2: 82,
      bedrooms: 2,
      bathrooms: 1,
      garages: 1,
      dataQualityScore: 90,
      publicationDate: new Date().toISOString(),
      amenities: {},
    },
    {
      sourceListingId: 'pc_04',
      sourceCode: 'infocasas',
      propertyMasterId: 'm_pc_04',
      title: 'Apartamento con terraza en Punta Carretas',
      operationType: 'SALE',
      propertyType: 'APARTMENT',
      department: 'Montevideo',
      neighborhood: 'Punta Carretas',
      priceUsd: 290000,
      builtAreaM2: 90,
      bedrooms: 2,
      bathrooms: 2,
      garages: 1,
      dataQualityScore: 95,
      publicationDate: new Date().toISOString(),
      amenities: {},
    },
  ];

  test('Req 01: Reproducibilidad matemática estricta: Misma entrada + misma versión = Mismo valor exacto', async () => {
    const valService = ValuationService.getInstance();

    const run1 = await valService.appraiseProperty(targetProperty, poolListings);
    const run2 = await valService.appraiseProperty(targetProperty, poolListings);
    const run3 = await valService.appraiseProperty(targetProperty, poolListings);

    expect(run1.estimatedMarketValue).toBe(run2.estimatedMarketValue);
    expect(run2.estimatedMarketValue).toBe(run3.estimatedMarketValue);
    expect(run1.estimatedRangeLow).toBe(run2.estimatedRangeLow);
    expect(run1.estimatedRangeHigh).toBe(run2.estimatedRangeHigh);
    expect(run1.confidence.confidenceScore).toBe(run2.confidence.confidenceScore);
    expect(run1.prudentReferenceValue).toBe(run2.prudentReferenceValue);
  });

  test('Req 02: Ensamble robusto de 4 métodos estadísticos determinísticos', async () => {
    const valService = ValuationService.getInstance();
    const result = await valService.appraiseProperty(targetProperty, poolListings);

    expect(result.methods.length).toBe(4);
    const methodNames = result.methods.map((m) => m.method);
    expect(methodNames).toContain('WEIGHTED_MEDIAN');
    expect(methodNames).toContain('WEIGHTED_TRIMMED_MEAN');
    expect(methodNames).toContain('WEIGHTED_PRICE_PER_M2');
    expect(methodNames).toContain('DIRECT_COMPARABLE_ADJUSTMENT');

    // La suma de ponderaciones de métodos debe ser 1.00 (100%)
    const sumWeights = result.methods.reduce((acc, m) => acc + m.weight, 0);
    expect(Number(sumWeights.toFixed(2))).toBe(1.0);
  });

  test('Req 03: Rango de mercado y Valor de Referencia Prudente sin doble descuento del 12%', async () => {
    const valService = ValuationService.getInstance();
    const result = await valService.appraiseProperty(targetProperty, poolListings);

    expect(result.estimatedRangeLow).toBeLessThan(result.estimatedMarketValue);
    expect(result.estimatedRangeHigh).toBeGreaterThan(result.estimatedMarketValue);

    // El valor prudente debe ser menor o igual al valor central estimado y mayor o igual al límite inferior
    expect(result.prudentReferenceValue).toBeLessThanOrEqual(result.estimatedMarketValue);
    expect(result.prudentReferenceValue).toBeGreaterThanOrEqual(result.estimatedRangeLow);

    // Verificar que NO es un segundo descuento ciego del 12% (0.88 * 0.88)
    const doubleDiscountValue = Math.round(result.estimatedMarketValue * 0.88);
    expect(result.prudentReferenceValue).not.toBe(doubleDiscountValue);
  });

  test('Req 04: Confidence Score multiseñal responde a la cantidad y dispersión de comparables', async () => {
    const valService = ValuationService.getInstance();
    const result = await valService.appraiseProperty(targetProperty, poolListings);

    expect(result.confidence.confidenceScore).toBeGreaterThan(0);
    expect(result.confidence.confidenceScore).toBeLessThanOrEqual(100);
    expect(['VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW', 'VERY_LOW']).toContain(
      result.confidence.confidenceLevel
    );
    expect(result.confidence.breakdown.comparableCountScore).toBeGreaterThan(0);
    expect(result.confidence.breakdown.similarityAverageScore).toBeGreaterThan(0);
  });

  test('Req 05: Persistencia inmutable de versiones de tasación', async () => {
    const valService = ValuationService.getInstance();
    const result = await valService.appraiseProperty(targetProperty, poolListings);

    const saved = valService.getValuation(result.valuationId);
    expect(saved).toBeDefined();
    expect(saved?.valuationId).toBe(result.valuationId);
    expect(saved?.algorithmVersion).toBe('VALUATION_V1_DETERMINISTIC');
    expect(saved?.settingsVersion).toBe(1);
  });
});
